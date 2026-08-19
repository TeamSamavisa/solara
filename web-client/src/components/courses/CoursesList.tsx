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
import type { Course } from '@/interfaces/course';
import { CourseSkeletonRows } from './CourseSkeletonRows';

interface CoursesListProps {
  courses: Course[];
  onEdit: (course: Course) => void;
  onDelete: (course: Course) => void;
  isLoading: boolean;
}

export const CoursesList: React.FC<CoursesListProps> = ({
  courses,
  onEdit,
  onDelete,
  isLoading,
}) => {
  const { isAdmin } = useRole();
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);

  // Helper to access flatten fields from backend
  const getField = (obj: Course, field: string): string | undefined => {
    // @ts-expect-error - Accessing flatten fields from backend
    return obj[field];
  };

  const handleEdit = (course: Course) => {
    setOpenDropdown(null);
    onEdit(course);
  };

  const handleDelete = (course: Course) => {
    setOpenDropdown(null);
    onDelete(course);
  };

  return (
    <div className="max-h-[75vh] overflow-auto bg-white dark:bg-card shadow dark:shadow-lg rounded-lg border dark:border-border transition-colors">
      <Table>
        <TableHeader>
          <TableRow className="dark:border-border hover:bg-muted/50 dark:hover:bg-muted/20">
            <TableHead className="dark:text-foreground">Nome</TableHead>
            <TableHead className="dark:text-foreground">
              Tipo de Curso
            </TableHead>
            {isAdmin && (
              <TableHead className="text-right dark:text-foreground">
                Ações
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <CourseSkeletonRows />
          ) : courses.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center py-8 text-gray-500 dark:text-muted-foreground"
              >
                Nenhum curso encontrado
              </TableCell>
            </TableRow>
          ) : (
            courses.map((course) => (
              <TableRow
                key={course.id}
                className="group dark:border-border hover:bg-muted/50 dark:hover:bg-muted/20 transition-colors"
              >
                <TableCell className="dark:text-foreground">
                  {course.name || (
                    <span className="text-gray-400 dark:text-muted-foreground italic">
                      Não informado
                    </span>
                  )}
                </TableCell>
                <TableCell className="dark:text-foreground">
                  {getField(course, 'courseType.name') ||
                    course.courseType?.name || (
                      <span className="text-gray-400 dark:text-muted-foreground italic">
                        Não definida
                      </span>
                    )}
                </TableCell>

                {isAdmin && (
                  <TableCell className="text-right">
                    <DropdownMenu
                      open={openDropdown === course.id}
                      onOpenChange={(open) =>
                        setOpenDropdown(open ? course.id : null)
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
                          onClick={() => handleEdit(course)}
                          className="dark:text-popover-foreground dark:hover:bg-accent dark:focus:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600 dark:text-red-400 dark:hover:bg-accent dark:focus:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => handleDelete(course)}
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
