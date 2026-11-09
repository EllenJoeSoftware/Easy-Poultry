import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useAuth } from '@/lib/AuthContext';
import Onboarding from '@/pages/Onboarding';

/** True when the signed-in user still has to finish onboarding. */
export function needsOnboarding(user) {
  if (!user) return false;
  if (user.onboarding_completed) return false;
  // Legacy accounts that finished onboarding before the flag existed
  if (user.user_type && user.province && user.city) return false;
  return true;
}

/**
 * Mandatory onboarding popup: shown over every page (except Login/Onboarding)
 * until the user completes the steps. Cannot be dismissed by clicking outside
 * or pressing Escape.
 */
export default function OnboardingGate({ currentPageName }) {
  const { user, isLoadingAuth, refreshUser } = useAuth();
  if (isLoadingAuth || !needsOnboarding(user)) return null;
  if (currentPageName === 'Login' || currentPageName === 'Onboarding') return null;

  return (
    <Dialog open>
      <DialogContent
        className="rounded-2xl max-w-3xl w-[calc(100vw-2rem)] max-h-[92vh] overflow-y-auto p-5 sm:p-8 [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <Onboarding embedded onComplete={() => refreshUser?.()} />
      </DialogContent>
    </Dialog>
  );
}
