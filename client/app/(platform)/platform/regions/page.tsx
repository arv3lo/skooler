import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@ui/table';

export default function PlatformRegionsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Regions</h1>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Code</TableHead>
            <TableHead>Schools</TableHead>
            <TableHead>Supervisors</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell
              colSpan={4}
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
