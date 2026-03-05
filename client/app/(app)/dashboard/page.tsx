import { auth } from '@clerk/nextjs/server';

import { Card, CardContent, CardHeader, CardTitle } from '@ui/card';

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {['Students', 'Classes', 'Staff', 'Announcements'].map((label) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-neutral-500">
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">—</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
