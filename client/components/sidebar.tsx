'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  CalendarDays,
  GraduationCap,
  LayoutDashboard,
  Settings,
  Users,
} from 'lucide-react';
import { UserButton } from '@clerk/nextjs';
import { cn } from '@lib/utils';
import { useAuthStore } from '@store/auth.store';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/students', label: 'Students', icon: GraduationCap },
  { href: '/schedule', label: 'Schedule', icon: CalendarDays },
  { href: '/staff', label: 'Staff', icon: Users },
  { href: '/admin', label: 'Admin', icon: Settings, roles: ['SCHOOL_ADMIN'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const role = useAuthStore((s) => s.session?.role);

  const visible = nav.filter(
    (item) => !item.roles || (role && item.roles.includes(role)),
  );

  return (
    <aside className="flex h-screen w-56 flex-col border-r bg-white px-3 py-4">
      <div className="mb-6 flex items-center gap-2 px-2">
        <BookOpen className="size-5 text-neutral-800" />
        <span className="font-semibold">Skool</span>
      </div>

      <nav className="flex-1 space-y-1">
        {visible.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
              pathname.startsWith(href)
                ? 'bg-neutral-100 font-medium text-neutral-900'
                : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900',
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="border-t pt-3">
        <UserButton />
      </div>
    </aside>
  );
}
