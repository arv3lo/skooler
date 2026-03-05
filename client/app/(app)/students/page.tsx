import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@ui/table';
import { Badge } from '@ui/badge';

export default function StudentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Students</h1>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>National ID</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Enrolled classes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell
              colSpan={4}
              className="text-center text-sm text-neutral-400"
            >
              Data loads after API client is generated — run{' '}
              <code>pnpm api:generate</code>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
