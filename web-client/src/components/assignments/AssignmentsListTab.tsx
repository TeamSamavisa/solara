import React from 'react';
import { Button } from '@/components/ui/button';
import { AssignmentFilters } from './AssignmentFilters';
import { AssignmentsList } from './AssignmentsList';
import { AssignmentsPagination } from './AssignmentsPagination';
import type { Assignment } from '@/interfaces/assignment';
import type { PaginatedResponse } from '@/interfaces/paginated-response';

interface AssignmentsListTabProps {
  assignmentsData: PaginatedResponse<Assignment> | undefined;
  isLoading: boolean;
  isAdmin: boolean;
  onFilterChange: (name: string, value: string) => void;
  onPageChange: (page: number) => void;
  onEdit: (assignment: Assignment) => void;
  onDelete: (assignment: Assignment) => void;
  onOpenDialog: () => void;
}

export const AssignmentsListTab: React.FC<AssignmentsListTabProps> = ({
  assignmentsData,
  isLoading,
  isAdmin,
  onFilterChange,
  onPageChange,
  onEdit,
  onDelete,
  onOpenDialog,
}) => {
  return (
    <div className="p-4">
      <div className="flex flex-col lg:flex-row gap-4 lg:items-center mb-4 lg:justify-between">
        <AssignmentFilters
          filters={{
            teacherName: '',
            subjectName: '',
            className: '',
          }}
          onFilterChange={onFilterChange}
        />

        <div className="flex items-center justify-between lg:justify-start gap-4 w-full lg:w-auto">
          {isAdmin && (
            <Button
              onClick={onOpenDialog}
              className="bg-[var(--solara-800)] hover:bg-[var(--solara-700)] dark:bg-primary dark:hover:bg-primary/90 transition-colors"
            >
              Nova Alocação
            </Button>
          )}
        </div>
      </div>

      <AssignmentsList
        assignments={assignmentsData?.content || []}
        onEdit={onEdit}
        onDelete={onDelete}
        isLoading={isLoading}
      />

      {assignmentsData && (
        <AssignmentsPagination
          currentPage={assignmentsData.pagination.currentPage}
          totalPages={assignmentsData.pagination.totalPages}
          totalItems={assignmentsData.pagination.totalItems}
          itemsPerPage={assignmentsData.pagination.itemsPerPage}
          hasNextPage={assignmentsData.pagination.hasNextPage}
          hasPrevPage={assignmentsData.pagination.hasPrevPage}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
};
