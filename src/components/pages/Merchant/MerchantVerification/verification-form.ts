import type { ServiceGroup, UploadedFile, UploadRequirement } from './types';

export type ProviderType = 'BUSINESS' | 'FREELANCE';

export interface VerificationDraft {
  businessName: string;
  province: string;
  city: string;
  barangay: string;
  address: string;
  lat: number;
  long: number;
}

export type VerificationUploads = Record<string, UploadedFile | null>;

export function validateVerificationFile(requirement: UploadRequirement, file: File): string | undefined {
  const extension = `.${file.name.split('.').pop()?.toLowerCase()}`;
  if (!requirement.acceptedFormats.includes(extension)) return `Choose a ${requirement.acceptedFormats.join(', ')} file.`;
  if (file.size > requirement.maxSize * 1024 * 1024) return `This file is too large. Choose a file up to ${requirement.maxSize} MB.`;
}

export function getVerificationIssues(draft: VerificationDraft, serviceGroups: ServiceGroup[], requirements: UploadRequirement[], uploads: VerificationUploads) {
  const issues: { id: string; message: string }[] = [];
  if (!draft.businessName.trim()) issues.push({ id: 'businessName', message: 'Enter your business or professional name.' });
  if (!serviceGroups.length) issues.push({ id: 'serviceGroups', message: 'Choose at least one service type.' });
  for (const field of ['province', 'city', 'barangay', 'address'] as const) {
    if (!draft[field].trim()) issues.push({ id: field, message: `Complete your ${field === 'city' ? 'city or municipality' : field}.` });
  }
  for (const requirement of requirements) {
    const upload = uploads[requirement.id];
    if ((requirement.required && upload?.status !== 'success') || upload?.status === 'error') {
      issues.push({ id: `upload-${requirement.id}`, message: `${requirement.name}: ${upload?.error || 'choose a file.'}` });
    }
  }
  return issues;
}
