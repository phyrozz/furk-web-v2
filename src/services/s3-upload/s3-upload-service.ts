import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity';
import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity';

export class S3UploadService {
  private s3Client: S3Client;
  private region = import.meta.env.VITE_AWS_REGION || '';
  private bucketName = import.meta.env.VITE_S3_BUCKET_NAME || '';

  constructor() {
    const idToken = localStorage.getItem('cognitoIdToken');
    if (!idToken) {
      throw new Error('No authentication token found');
    }
  
    this.s3Client = new S3Client({
      region: this.region,
      credentials: fromCognitoIdentityPool({
        client: new CognitoIdentityClient({ region: this.region }),
        identityPoolId: import.meta.env.VITE_IDENTITY_POOL_ID,
        logins: {
          [`cognito-idp.${this.region}.amazonaws.com/${import.meta.env.VITE_COGNITO_USER_POOL_ID}`]: idToken
        }
      })
    });
  }

  async uploadFile(file: File, key: string): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: uint8Array,
        ContentType: file.type,
      });

      await this.s3Client.send(command);

      // Return the URL of the uploaded file
      return `https://${this.bucketName}.s3.amazonaws.com/${key}`;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error('Failed to upload file');
    }
  }

  async uploadBuffer(buffer: Buffer, key: string, contentType: string): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      });

      await this.s3Client.send(command);

      // Return the URL of the uploaded file
      return `https://${this.bucketName}.s3.amazonaws.com/${key}`;
    } catch (error) {
      console.error('Error uploading buffer:', error);
      throw new Error('Failed to upload buffer');
    }
  }
}
