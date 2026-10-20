export const PET_OWNER_TOUR_PREFIX = 'furk_pet_owner_onboarding_v1:';
export const PET_OWNER_TOUR_STEP_COUNT = 6;

export interface PetOwnerTourState {
  status: 'active' | 'paused' | 'completed';
  step: number;
}

type TourStorage = Pick<Storage, 'getItem' | 'setItem'>;

export function readPetOwnerTour(storage: TourStorage, accountId: string): PetOwnerTourState {
  try {
    const saved = storage.getItem(PET_OWNER_TOUR_PREFIX + accountId);
    if (saved) {
      const state: unknown = JSON.parse(saved);
      if (typeof state === 'object' && state !== null && 'status' in state && 'step' in state &&
          ['active', 'paused', 'completed'].includes(String(state.status)) &&
          Number.isInteger(state.step) && Number(state.step) >= 0 && Number(state.step) < PET_OWNER_TOUR_STEP_COUNT) {
        return state as PetOwnerTourState;
      }
    }
    // Avoid interrupting existing owners who already took the original tour.
    if (storage.getItem('furk_pet_owner_tour_seen') === 'true') {
      return { status: 'completed', step: 0 };
    }
  } catch {
    // The tour still works when browser storage is unavailable.
  }
  return { status: 'active', step: 0 };
}

export function savePetOwnerTour(storage: TourStorage, accountId: string, state: PetOwnerTourState): void {
  try {
    storage.setItem(PET_OWNER_TOUR_PREFIX + accountId, JSON.stringify(state));
  } catch {
    // Storage restrictions must not block signup or navigation.
  }
}
