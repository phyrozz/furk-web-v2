#!/usr/bin/env pwsh
# Requires PowerShell 7+
# Usage: ./deploy.ps1 [-Stage prod|dev]

param (
    [Parameter(Mandatory = $false)]
    [string]$Stage = 'prod'
)

$ErrorActionPreference = 'Stop'

$RepoRoot = $PSScriptRoot
$Region = 'ap-southeast-1'
$Profile = "furk-$Stage"
$BuildScript = if ($Stage -eq 'dev') { 'build:dev' } else { 'build' }
$BucketParamName = "/furk/$Stage/web-bucket-name"
$DistributionParamName = "/furk/$Stage/web-distribution-id"
$DistPath = Join-Path $RepoRoot 'dist'

Write-Host "Deploying Furk web UI (stage: $Stage)"
Write-Host "Config source: SSM parameters"
Write-Host "Bucket parameter: $BucketParamName"
Write-Host "Distribution parameter: $DistributionParamName"

if (-not (Get-Command 'node' -ErrorAction SilentlyContinue)) {
    Write-Host "'node' command not found. Please install Node.js first."
    exit 1
}

if (-not (Get-Command 'npm' -ErrorAction SilentlyContinue)) {
    Write-Host "'npm' command not found. Please install Node.js/npm first."
    exit 1
}

if (-not (Get-Command 'aws' -ErrorAction SilentlyContinue)) {
    Write-Host "'aws' command not found. Please install and configure the AWS CLI."
    exit 1
}

function Get-SsmParameterValue {
    param (
        [Parameter(Mandatory = $true)]
        [string]$Name
    )

    $value = aws ssm get-parameter `
        --name $Name `
        --with-decryption `
        --query 'Parameter.Value' `
        --output text `
        --profile $Profile `
        --region $Region

    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($value)) {
        throw "Failed to resolve SSM parameter: $Name"
    }

    return $value.Trim()
}

Push-Location $RepoRoot
try {
    $BucketName = Get-SsmParameterValue -Name $BucketParamName
    $DistributionId = Get-SsmParameterValue -Name $DistributionParamName

    Write-Host "Resolved bucket: $BucketName"
    Write-Host "Resolved distribution: $DistributionId"

    Write-Host "Building the web app with npm run $BuildScript ..."
    npm run $BuildScript

    if (-not (Test-Path $DistPath)) {
        throw "Build output folder not found: $DistPath"
    }

    Write-Host "Uploading dist to s3://$BucketName ..."
    aws s3 sync $DistPath "s3://$BucketName" `
        --region $Region `
        --profile $Profile `
        --delete

    Write-Host "Creating CloudFront invalidation for $DistributionId ..."
    aws cloudfront create-invalidation `
        --distribution-id $DistributionId `
        --paths '/*' `
        --profile $Profile `
        --output text | Out-Null

    Write-Host 'Deployment complete.'
    Write-Host "Bucket: s3://$BucketName"
    Write-Host "CloudFront distribution: $DistributionId"
}
finally {
    Pop-Location
}
