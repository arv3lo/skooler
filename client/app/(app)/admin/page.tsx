import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@ui/card';

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">School Administration</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>School Profile</CardTitle>
            <CardDescription>Manage your school information</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-neutral-400">
              Run <code>pnpm api:generate</code> to load data.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Announcements</CardTitle>
            <CardDescription>Public announcements for your school</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-neutral-400">
              Run <code>pnpm api:generate</code> to load data.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Academic Years</CardTitle>
            <CardDescription>Manage academic years and terms</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-neutral-400">
              Run <code>pnpm api:generate</code> to load data.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rooms</CardTitle>
            <CardDescription>Manage classrooms and facilities</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-neutral-400">
              Run <code>pnpm api:generate</code> to load data.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
