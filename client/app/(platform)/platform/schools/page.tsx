import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@ui/table';

export default function PlatformSchoolsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Schools</h1>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Region</TableHead>
            <TableHead>Subscription</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell
              colSpan={6}
              className="text-center text-sm text-neutral-400"
            >
              Run <code>pnpm api:generate</code> to load data.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
