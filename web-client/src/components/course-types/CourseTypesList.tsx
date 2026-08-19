import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { MoreHorizontal } from 'lucide-react';
import { useRole } from '@/hooks/useRole';
import type { CourseType } from '@/interfaces/course-type';
import { CourseTypeSkeletonRows } from './CourseTypeSkeletonRows';

interface CourseTypesListProps {
  course_types: CourseType[];
  onEdit: (course_type: CourseType) => void;
  onDelete: (course_type: CourseType) => void;
  isLoading: boolean;
}

export const CourseTypesList: React.FC<CourseTypesListProps> = ({
  course_types,
  onEdit,
  onDelete,
  isLoading,
}) => {
  const { isAdmin } = useRole();
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);

  const handleEdit = (course_type: CourseType) => {
    setOpenDropdown(null);
    onEdit(course_type);
  };

  const handleDelete = (course_type: CourseType) => {
    setOpenDropdown(null);
    onDelete(course_type);
  };

  return (
    <div className="max-h-[75vh] overflow-auto bg-white dark:bg-card shadow dark:shadow-lg rounded-lg border dark:border-border transition-colors">
      <Table>
        <TableHeader>
          <TableRow className="dark:border-border hover:bg-muted/50 dark:hover:bg-muted/20">
            <TableHead className="dark:text-foreground">Nome</TableHead>
            {isAdmin && (
              <TableHead className="text-right dark:text-foreground">
                Ações
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <CourseTypeSkeletonRows />
          ) : course_types.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center py-8 text-gray-500 dark:text-muted-foreground"
              >
                Nenhum tipo de curso encontrado
              </TableCell>
            </TableRow>
          ) : (
            course_types.map((course_type) => (
              <TableRow
                key={course_type.id}
                className="group dark:border-border hover:bg-muted/50 dark:hover:bg-muted/20 transition-colors"
              >
                <TableCell className="dark:text-foreground">
                  {course_type.name || (
                    <span className="text-gray-400 dark:text-muted-foreground italic">
                      Não informado
                    </span>
                  )}
                </TableCell>

                {isAdmin && (
                  <TableCell className="text-right">
                    <DropdownMenu
                      open={openDropdown === course_type.id}
                      onOpenChange={(open) =>
                        setOpenDropdown(open ? course_type.id : null)
                      }
                    >
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 opacity-100 transition-opacity dark:text-foreground dark:hover:bg-accent"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Abrir menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="dark:bg-popover dark:border-border"
                      >
                        <DropdownMenuItem
                          onClick={() => handleEdit(course_type)}
                          className="dark:text-popover-foreground dark:hover:bg-accent dark:focus:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600 dark:text-red-400 dark:hover:bg-accent dark:focus:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => handleDelete(course_type)}
                        >
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
