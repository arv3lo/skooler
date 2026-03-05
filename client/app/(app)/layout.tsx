import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';

import { Sidebar } from '@components/sidebar';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/login');
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-neutral-50 p-8">
        {children}
      </main>
    </div>
  );
}
