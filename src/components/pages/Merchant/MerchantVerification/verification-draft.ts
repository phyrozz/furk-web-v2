import type { MerchantVerificationService, SavedVerificationDraft, VerificationDraftPayload } from '../../../../services/merchant-verification/merchant-verification-service';
import type { ProviderType, VerificationDraft, VerificationStep, VerificationUploads } from './verification-form';
import type { ServiceGroup } from './types';

export interface VerificationDraftState {
  draft: VerificationDraft;
  merchantType: ProviderType;
  serviceGroups: ServiceGroup[];
  uploadsByType: Record<ProviderType, VerificationUploads>;
  pinPlaced: boolean;
  pinConfirmed: boolean;
  currentStep: VerificationStep;
}

const providerTypes: ProviderType[] = ['BUSINESS', 'FREELANCE'];

export function draftPayload(state: VerificationDraftState): VerificationDraftPayload {
  const filesByType = { BUSINESS: [], FREELANCE: [] } as VerificationDraftPayload['files_by_type'];
  for (const providerType of providerTypes) {
    filesByType[providerType] = Object.values(state.uploadsByType[providerType])
      .flatMap(upload => upload?.status === 'success' && upload.saved
        ? [{ requirement_id: upload.id, key: upload.saved.key, name: upload.saved.name }]
        : []);
  }
  return {
    business_name: state.draft.businessName, merchant_type: state.merchantType,
    address: state.draft.address, barangay: state.draft.barangay, city: state.draft.city, province: state.draft.province,
    lat: state.draft.lat, long: state.draft.long,
    service_group_ids: state.serviceGroups.map(group => Number(group.id)),
    pin_placed: state.pinPlaced, pin_confirmed: state.pinConfirmed, current_step: state.currentStep,
    files_by_type: filesByType,
  };
}

export function draftSignature(state: VerificationDraftState): string {
  return JSON.stringify({
    ...draftPayload(state),
    localFiles: providerTypes.flatMap(providerType => Object.values(state.uploadsByType[providerType])
      .filter(upload => upload?.file && !upload.saved)
      .map(upload => [providerType, upload!.id, upload!.file!.name, upload!.file!.size, upload!.file!.lastModified, upload!.status])),
  });
}

export function restoreDraft(saved: SavedVerificationDraft): VerificationDraftState {
  const uploadsByType: VerificationDraftState['uploadsByType'] = { BUSINESS: {}, FREELANCE: {} };
  for (const providerType of providerTypes) {
    for (const file of saved.files_by_type[providerType] ?? []) {
      uploadsByType[providerType][file.requirement_id] = {
        id: file.requirement_id, saved: file, status: 'success',
        preview: file.media_type === 'image' || file.media_type === 'video' ? file.url : undefined,
      };
    }
  }
  return {
    draft: { businessName: saved.business_name, address: saved.address, barangay: saved.barangay, city: saved.city, province: saved.province, lat: saved.lat, long: saved.long },
    merchantType: saved.merchant_type,
    serviceGroups: saved.service_groups.map(group => ({ ...group, id: String(group.id) })),
    uploadsByType, pinPlaced: saved.pin_placed, pinConfirmed: saved.pin_confirmed, currentStep: saved.current_step,
  };
}

// Upload one file at a time to keep large video uploads manageable on phones.
// Keep successful upload keys in memory even if a later upload/save fails, so
// retrying does not resend files that are already in storage.
export async function persistDraft(
  service: Pick<MerchantVerificationService, 'uploadDraftFile' | 'saveDraft'>,
  state: VerificationDraftState,
  version: number | null,
  onUploadsChanged: (uploads: VerificationDraftState['uploadsByType']) => void,
  onProgress: (completed: number, total: number) => void,
) {
  const uploadsByType = { BUSINESS: { ...state.uploadsByType.BUSINESS }, FREELANCE: { ...state.uploadsByType.FREELANCE } };
  const pending = providerTypes.flatMap(providerType => Object.values(uploadsByType[providerType])
    .filter(upload => upload?.file && !upload.saved && upload.status === 'success')
    .map(upload => ({ providerType, upload: upload! })));
  let completed = 0;
  onProgress(completed, pending.length);
  for (const { providerType, upload } of pending) {
    try {
      const saved = await service.uploadDraftFile(providerType, upload.id, upload.file!);
      uploadsByType[providerType] = { ...uploadsByType[providerType], [upload.id]: { ...upload, file: undefined, saved } };
      onUploadsChanged({ ...uploadsByType });
    } catch {
      // Save the rest of the draft and report unsaved files to the merchant.
    }
    onProgress(++completed, pending.length);
  }
  const updatedState = { ...state, uploadsByType };
  const { data } = await service.saveDraft(draftPayload(updatedState), version);
  const persistedUploads = { BUSINESS: {}, FREELANCE: {} } as VerificationDraftState['uploadsByType'];
  let unsavedFiles = 0;
  let unsavedActiveFiles = 0;
  for (const providerType of providerTypes) {
    for (const upload of Object.values(uploadsByType[providerType])) {
      if (!upload) continue;
      if (upload.saved && upload.status === 'success') persistedUploads[providerType][upload.id] = upload;
      else {
        unsavedFiles++;
        if (providerType === state.merchantType) unsavedActiveFiles++;
      }
    }
  }
  return { ...data, unsavedFiles, unsavedActiveFiles, signature: draftSignature({ ...state, uploadsByType: persistedUploads }) };
}
