import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 flex-col border-r border-neutral-200 bg-white px-4 py-6">
        <div className="mb-8">
          <span className="text-lg font-bold tracking-tight">Skool</span>
          <span className="ml-2 rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-500">
            Platform
          </span>
        </div>

        <nav className="flex flex-1 flex-col gap-1 text-sm">
          <Link
            href="/platform/schools"
            className="rounded-md px-3 py-2 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
          >
            Schools
          </Link>
          <Link
            href="/platform/regions"
            className="rounded-md px-3 py-2 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
          >
            Regions
          </Link>
        </nav>

        <div className="mt-auto">
          <UserButton />
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-neutral-50 p-8">{children}</main>
    </div>
  );
}
