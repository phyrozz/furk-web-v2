import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { petOwnerTourSteps } from '../data/pet-owner-tour';
import { readPetOwnerTour, savePetOwnerTour, type PetOwnerTourState } from '../utils/pet-owner-tour';
import PetOwnerTourDialog from '../components/common/PetOwnerTourDialog';
import { PetOwnerTourContext } from './PetOwnerTourContext';

function getAccountId(): string | null {
  try {
    const token = localStorage.getItem('cognitoIdToken');
    return token ? jwtDecode<{ sub: string }>(token).sub || null : null;
  } catch {
    return null;
  }
}

export function PetOwnerTourProvider({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const accountId = enabled ? getAccountId() : null;
  const [session, setSession] = useState<{ accountId: string; tour: PetOwnerTourState } | null>(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const tour = session?.accountId === accountId ? session?.tour : undefined;

  useEffect(() => {
    if (!accountId) {
      setSession(null);
      return;
    }
    const saved = readPetOwnerTour(localStorage, accountId);
    // A refresh/payment return keeps progress without reopening a modal mid-task.
    const restored = saved.status === 'active' && saved.step > 0 ? { ...saved, status: 'paused' as const } : saved;
    savePetOwnerTour(localStorage, accountId, restored);
    setSession({ accountId, tour: restored });
  }, [accountId]);

  const update = useCallback((next: PetOwnerTourState) => {
    if (!accountId) return;
    savePetOwnerTour(localStorage, accountId, next);
    setSession({ accountId, tour: next });
  }, [accountId]);

  const showStep = (step: number) => {
    const nextStep = petOwnerTourSteps[step];
    if (!nextStep) return;
    update({ status: 'active', step });
    if (nextStep.route) navigate(nextStep.route, { replace: true });
  };

  const pause = (restoreFocus = true) => {
    update({ status: 'paused', step: tour?.step ?? 0 });
    if (restoreFocus) {
      requestAnimationFrame(() => {
        const trigger = document.querySelector<HTMLButtonElement>('[data-pet-owner-tour-trigger]');
        trigger?.focus({ preventScroll: true });
        trigger?.scrollIntoView({ block: 'center', behavior: 'instant' });
      });
    }
  };
  const canShowTour = pathname === '/profile' || pathname === '/services';

  return (
    <PetOwnerTourContext.Provider value={{
      status: tour?.status ?? 'completed',
      resume: () => showStep(tour?.step ?? 0),
      restart: () => showStep(0),
    }}>
      {children}
      {enabled && tour?.status === 'active' && canShowTour && (
        <PetOwnerTourDialog
          stepIndex={tour.step}
          onPause={pause}
          onBack={() => showStep(tour.step - 1)}
          onNext={() => {
            if (tour.step === petOwnerTourSteps.length - 1) {
              update({ status: 'completed', step: tour.step });
              requestAnimationFrame(() => {
                const search = document.getElementById('service-search');
                search?.focus({ preventScroll: true });
                search?.scrollIntoView({ block: 'center', behavior: 'instant' });
              });
            } else {
              showStep(tour.step + 1);
            }
          }}
        />
      )}
    </PetOwnerTourContext.Provider>
  );
}
