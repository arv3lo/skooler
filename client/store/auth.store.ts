'use client';

import { create } from 'zustand';

export type Role =
  | 'PLATFORM_ADMIN'
  | 'REGIONAL_SUPERVISOR'
  | 'SCHOOL_ADMIN'
  | 'TEACHER'
  | 'STUDENT'
  | 'PARENT';

export type SubscriptionTier = 'FREE' | 'PRO' | 'ENTERPRISE';

interface PlatformSession {
  accessToken: string;
  role: Role;
  tenantId?: string;
  subscriptionTier?: SubscriptionTier;
}

interface AuthState {
  session: PlatformSession | null;
  setSession: (session: PlatformSession) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  setSession: (session) => set({ session }),
  clearSession: () => set({ session: null }),
}));
