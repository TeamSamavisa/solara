import { TableCell, TableRow } from '../ui/table';
import { Skeleton } from '../ui/skeleton';

export const ScheduleSkeletonRows = () => {
  return Array(5)
    .fill(0)
    .map((_, index) => (
      <TableRow key={`skeleton-${index}`}>
        <TableCell>
          <Skeleton className="h-4 w-48" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-24" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-24" />
        </TableCell>
        <TableCell className="text-right">
          <Skeleton className="h-8 w-8 float-right" />
        </TableCell>
      </TableRow>
    ));
};
