import { Tabs, TabsContent, TabsList, TabsTrigger } from '@ui/tabs';

export default function SchedulePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Schedule</h1>

      <Tabs defaultValue="classes">
        <TabsList>
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="rooms">Rooms</TabsTrigger>
          <TabsTrigger value="years">Academic years</TabsTrigger>
        </TabsList>

        <TabsContent value="classes" className="mt-4">
          <p className="text-sm text-neutral-400">
            Run <code>pnpm api:generate</code> to load data.
          </p>
        </TabsContent>

        <TabsContent value="rooms" className="mt-4">
          <p className="text-sm text-neutral-400">Room list goes here.</p>
        </TabsContent>

        <TabsContent value="years" className="mt-4">
          <p className="text-sm text-neutral-400">
            Academic years and terms go here.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
