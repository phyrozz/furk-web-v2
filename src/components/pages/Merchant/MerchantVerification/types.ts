export interface UploadRequirement {
  id: string;
  name: string;
  type: 'document' | 'photo' | 'video';
  description: string;
  required: boolean;
  maxSize: number;
  acceptedFormats: string[];
}

export interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

export interface ServiceGroup {
  id: string;
  name: string;
  description: string;
}

export const businessMerchantRequirements: UploadRequirement[] = [
  {
    id: 'company_profile',
    name: 'Company Profile',
    type: 'document',
    description: 'Detailed information about your business',
    required: true,
    maxSize: 5,
    acceptedFormats: ['.pdf', '.doc', '.docx'],
  },
  {
    id: 'dti_sec',
    name: 'DTI/SEC Registration',
    type: 'document',
    description: 'Certificate of Registration',
    required: true,
    maxSize: 5,
    acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
  },
  {
    id: 'bir_2303',
    name: 'BIR 2303/COR',
    type: 'document',
    description: 'BIR Certificate of Registration',
    required: true,
    maxSize: 5,
    acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
  },
  {
    id: 'mayors_permit',
    name: "Mayor's Permit",
    type: 'document',
    description: 'Valid business permit',
    required: true,
    maxSize: 5,
    acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
  },
  {
    id: 'valid_id_1',
    name: 'Valid ID 1',
    type: 'document',
    description: 'Government-issued ID',
    required: true,
    maxSize: 5,
    acceptedFormats: ['.jpg', '.jpeg', '.png', '.pdf'],
  },
  {
    id: 'valid_id_2',
    name: 'Valid ID 2',
    type: 'document',
    description: 'Secondary government-issued ID',
    required: true,
    maxSize: 5,
    acceptedFormats: ['.jpg', '.jpeg', '.png', '.pdf'],
  },
  {
    id: 'exterior_photo',
    name: 'Exterior Photo',
    type: 'photo',
    description: 'Photo of establishment facade',
    required: true,
    maxSize: 2,
    acceptedFormats: ['.jpg', '.jpeg', '.png'],
  },
  {
    id: 'interior_photo_1',
    name: 'Interior Photo 1',
    type: 'photo',
    description: 'First interior photo',
    required: true,
    maxSize: 2,
    acceptedFormats: ['.jpg', '.jpeg', '.png'],
  },
  {
    id: 'interior_photo_2',
    name: 'Interior Photo 2',
    type: 'photo',
    description: 'Second interior photo',
    required: true,
    maxSize: 2,
    acceptedFormats: ['.jpg', '.jpeg', '.png'],
  },
]

export const freelanceMerchantRequirements: UploadRequirement[] = [
  {
    id: 'cv',
    name: 'CV/Professional Background',
    type: 'document',
    description: 'Your professional background and experience',
    required: true,
    maxSize: 5,
    acceptedFormats: ['.pdf', '.doc', '.docx']
  },
  {
    id: 'current_address_proof',
    name: 'Current Address Proof',
    type: 'document',
    description: 'Utility bills showing current residence',
    required: true,
    maxSize: 5,
    acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png']
  },
  {
    id: 'permanent_address_proof',
    name: 'Permanent Address Proof',
    type: 'document',
    description: 'Utility bills showing permanent address (if different from current)',
    required: false,
    maxSize: 5,
    acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png']
  },
  {
    id: 'sss_umid',
    name: 'SSS ID/UMID',
    type: 'document',
    description: 'Social Security System ID or UMID',
    required: true,
    maxSize: 2,
    acceptedFormats: ['.jpg', '.jpeg', '.png', '.pdf']
  },
  {
    id: 'bir_tin',
    name: 'BIR TIN Document',
    type: 'document',
    description: 'Document showing TIN and Full Name',
    required: true,
    maxSize: 2,
    acceptedFormats: ['.jpg', '.jpeg', '.png', '.pdf']
  },
  {
    id: 'other_valid_id',
    name: 'Other Valid ID',
    type: 'document',
    description: 'Passport, Driver\'s License, etc.',
    required: true,
    maxSize: 2,
    acceptedFormats: ['.jpg', '.jpeg', '.png', '.pdf']
  },
  {
    id: 'nbi_clearance',
    name: 'NBI Clearance',
    type: 'document',
    description: 'Valid NBI Clearance',
    required: true,
    maxSize: 2,
    acceptedFormats: ['.jpg', '.jpeg', '.png', '.pdf']
  },
  {
    id: 'service_photo_1',
    name: 'Service Photo 1',
    type: 'photo',
    description: 'Photo of actual pet service',
    required: true,
    maxSize: 2,
    acceptedFormats: ['.jpg', '.jpeg', '.png']
  },
  {
    id: 'service_photo_2',
    name: 'Service Photo 2',
    type: 'photo',
    description: 'Photo of actual pet service',
    required: true,
    maxSize: 2,
    acceptedFormats: ['.jpg', '.jpeg', '.png']
  },
  {
    id: 'service_photo_3',
    name: 'Service Photo 3',
    type: 'photo',
    description: 'Photo of actual pet service',
    required: true,
    maxSize: 2,
    acceptedFormats: ['.jpg', '.jpeg', '.png']
  },
  {
    id: 'service_video_1',
    name: 'Service Video 1',
    type: 'video',
    description: 'Video of actual pet service (max 1 minute)',
    required: true,
    maxSize: 25,
    acceptedFormats: ['.mp4', '.mov']
  },
  {
    id: 'service_video_2',
    name: 'Service Video 2',
    type: 'video',
    description: 'Video of actual pet service (max 1 minute)',
    required: true,
    maxSize: 25,
    acceptedFormats: ['.mp4', '.mov']
  }
]