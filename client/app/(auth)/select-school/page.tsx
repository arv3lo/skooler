'use client';

import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@ui/card';
import { Badge } from '@ui/badge';
import { Skeleton } from '@ui/skeleton';
import { apiClient } from '@lib/api-client';
import { useAuthStore } from '@store/auth.store';

interface Membership {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  role: string;
}

export default function SelectSchoolPage() {
  const { getToken } = useAuth();
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<string | null>(null);

  useEffect(() => {
    async function loadMemberships() {
      try {
        const externalToken = await getToken();
        if (!externalToken) return;

        const data = await apiClient.post<{ memberships: Membership[] }>(
          '/auth/login',
          { externalToken },
        );
        setMemberships(data.memberships);
      } catch {
        toast.error('Failed to load your schools');
      } finally {
        setLoading(false);
      }
    }

    loadMemberships();
  }, [getToken]);

  async function selectSchool(membership: Membership) {
    setSelecting(membership.tenantId);
    try {
      const externalToken = await getToken();

      const data = await apiClient.post<{
        accessToken: string;
        role: string;
        tenantId: string;
        subscriptionTier: string;
      }>('/auth/select-tenant', {
        externalToken,
        tenantId: membership.tenantId,
      });

      setSession({
        accessToken: data.accessToken,
        role: data.role as never,
        tenantId: data.tenantId,
        subscriptionTier: data.subscriptionTier as never,
      });

      router.push('/dashboard');
    } catch {
      toast.error('Failed to sign in to this school');
    } finally {
      setSelecting(null);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Select a school</h1>
          <p className="mt-1 text-sm text-neutral-500">
            You have access to the following schools.
          </p>
        </div>

        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))
        ) : memberships.length === 0 ? (
          <p className="text-center text-sm text-neutral-500">
            No school access found. Contact your administrator.
          </p>
        ) : (
          memberships.map((m) => (
            <button
              key={m.tenantId}
              onClick={() => selectSchool(m)}
              disabled={selecting === m.tenantId}
              className="w-full text-left"
            >
              <Card className="cursor-pointer transition-shadow hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{m.tenantName}</CardTitle>
                    <Badge variant="secondary">{m.role.replace('_', ' ')}</Badge>
                  </div>
                  <CardDescription>{m.tenantSlug}</CardDescription>
                </CardHeader>
                <CardContent />
              </Card>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
