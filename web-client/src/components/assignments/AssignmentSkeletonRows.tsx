import { TableCell, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface AssignmentSkeletonRowsProps {
  isAdmin?: boolean;
}

export const AssignmentSkeletonRows = ({
  isAdmin = false,
}: AssignmentSkeletonRowsProps) => {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <TableRow key={index}>
          <TableCell>
            <Skeleton className="h-4 w-32" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-40" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-28" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-32" />
          </TableCell>
          {isAdmin && (
            <TableCell className="text-right">
              <Skeleton className="h-8 w-8 ml-auto" />
            </TableCell>
          )}
        </TableRow>
      ))}
    </>
  );
};
