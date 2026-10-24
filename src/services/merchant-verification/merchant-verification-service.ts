import axios from 'axios';
import { http } from "../../utils/http";

export interface GeocodeLocationResult {
    label: string;
    lat: number;
    lng: number;
}

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected' | 'suspended';

export interface VerificationAttachment {
    requirement_id: string;
    url: string;
    media_type: 'image' | 'video' | 'document';
}

export type VerificationProviderType = 'BUSINESS' | 'FREELANCE';

export interface VerificationDraftFile {
    requirement_id: string;
    key: string;
    name: string;
    url?: string;
    media_type?: VerificationAttachment['media_type'];
}

export interface VerificationDraftPayload {
    business_name: string;
    merchant_type: VerificationProviderType;
    address: string;
    barangay: string;
    city: string;
    province: string;
    lat: number;
    long: number;
    service_group_ids: number[];
    pin_placed: boolean;
    pin_confirmed: boolean;
    current_step: 1 | 2 | 3;
    files_by_type: Record<VerificationProviderType, VerificationDraftFile[]>;
}

export interface SavedVerificationDraft extends VerificationDraftPayload {
    version: number;
    modified_at: string;
    service_groups: { id: number; name: string; description: string }[];
}

export interface MerchantVerificationApplication {
    id: number;
    status: VerificationStatus;
    created_at: string;
    modified_at: string;
    business_name: string | null;
    merchant_type: 'BUSINESS' | 'FREELANCE' | null;
    address: string | null;
    barangay: string | null;
    city: string | null;
    province: string | null;
    business_types: { id: number; name: string }[];
    attachments: VerificationAttachment[];
}

export class MerchantVerificationService {
    async getOwnApplication(signal?: AbortSignal): Promise<{ data: MerchantVerificationApplication | null }> {
        return http.get('/merchant-application/me', { signal });
    }

    async getDraft(signal?: AbortSignal): Promise<{ data: SavedVerificationDraft | null }> {
        return http.get('/merchant-application/draft', { signal });
    }

    async saveDraft(payload: VerificationDraftPayload, version: number | null): Promise<{ data: { version: number; modified_at: string } }> {
        return http.put('/merchant-application/draft', { ...payload, version });
    }

    async uploadDraftFile(merchantType: VerificationProviderType, requirementId: string, file: File): Promise<VerificationDraftFile> {
        const { data } = await http.post<{ data: { key: string; upload_url: string; content_type: string } }>('/merchant-application/draft/upload-url', {
            merchant_type: merchantType, requirement_id: requirementId, name: file.name, size: file.size, content_type: file.type,
        });
        await axios.put(data.upload_url, file, { headers: { 'Content-Type': data.content_type } });
        return { requirement_id: requirementId, key: data.key, name: file.name };
    }

    async submitMerchantApplicationDetails(draftVersion: number): Promise<{ data: { application_id: number } }> {
        return http.post('/merchant-application', { draft_version: draftVersion });
    }

    async listServiceGroups(limit: number, offset: number, keyword: string): Promise<{ data: { id: string; name: string; description: string }[] }> {
        const response = await http.post<{ data: { id: number | string; name: string; description: string }[] }>('/merchant-service/list-service-groups', {
            limit: limit,
            offset: offset,
            keyword: keyword
        });
        return { ...response, data: response.data.map(group => ({ ...group, id: String(group.id) })) };
    }

    async searchLocations(query: string, limit: number = 5): Promise<{ data: GeocodeLocationResult[] }> {
        return http.post('/location-search/geocode', {
            query,
            limit
        });
    }
  }
