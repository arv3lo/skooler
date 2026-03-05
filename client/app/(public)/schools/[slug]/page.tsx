import { Badge } from '@ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card';
import { Separator } from '@ui/separator';

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

interface SchoolProfile {
  id: string;
  name: string;
  slug: string;
  type: string;
  logoUrl: string | null;
  phone: string | null;
  address: string | null;
  announcements: Announcement[];
}

async function getSchoolProfile(slug: string): Promise<SchoolProfile> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/schools/${slug}`,
    { next: { revalidate: 60 } },
  );

  if (!res.ok) {
    throw new Error('School not found');
  }

  return res.json();
}

export default async function PublicSchoolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const school = await getSchoolProfile(slug);

  return (
    <main className="mx-auto max-w-2xl space-y-8 px-4 py-12">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">{school.name}</h1>
          <Badge variant="outline">{school.type}</Badge>
        </div>
        {school.address && (
          <p className="text-neutral-500">{school.address}</p>
        )}
        {school.phone && (
          <p className="text-sm text-neutral-500">{school.phone}</p>
        )}
      </div>

      {school.announcements.length > 0 && (
        <>
          <Separator />
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Announcements</h2>
            {school.announcements.map((a) => (
              <Card key={a.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{a.title}</CardTitle>
                  <p className="text-xs text-neutral-400">
                    {new Date(a.createdAt).toLocaleDateString()}
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-neutral-600">{a.content}</p>
                </CardContent>
              </Card>
            ))}
          </section>
        </>
      )}
    </main>
  );
}
