import { createContext, useContext } from 'react';
import type { PetOwnerTourState } from '../utils/pet-owner-tour';

export const PetOwnerTourContext = createContext<{
  status: PetOwnerTourState['status'];
  resume: () => void;
  restart: () => void;
} | null>(null);

export function usePetOwnerTour() {
  const context = useContext(PetOwnerTourContext);
  if (!context) throw new Error('Pet owner tour must be inside its provider');
  return context;
}
