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
import type { ClassGroup } from '@/interfaces/class-group';
import { ClassGroupSkeletonRows } from './ClassGroupSkeletonRows';

interface ClassGroupListProps {
  class_groups: ClassGroup[];
  onEdit: (class_group: ClassGroup) => void;
  onDelete: (class_group: ClassGroup) => void;
  isLoading: boolean;
}

export const ClassGroupList: React.FC<ClassGroupListProps> = ({
  class_groups,
  onEdit,
  onDelete,
  isLoading,
}) => {
  const { isAdmin } = useRole();
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);

  // Helper to access flatten fields from backend
  const getField = (obj: ClassGroup, field: string): string | undefined => {
    // @ts-expect-error - Accessing flatten fields from backend
    return obj[field];
  };

  const handleEdit = (class_group: ClassGroup) => {
    setOpenDropdown(null);
    onEdit(class_group);
  };

  const handleDelete = (class_group: ClassGroup) => {
    setOpenDropdown(null);
    onDelete(class_group);
  };

  return (
    <div className="max-h-[75vh] overflow-auto bg-white dark:bg-card shadow dark:shadow-lg rounded-lg border dark:border-border transition-colors">
      <Table>
        <TableHeader>
          <TableRow className="dark:border-border hover:bg-muted/50 dark:hover:bg-muted/20">
            <TableHead className="dark:text-foreground">Nome</TableHead>
            <TableHead className="dark:text-foreground">Semestre</TableHead>
            <TableHead className="dark:text-foreground">Módulo</TableHead>
            <TableHead className="dark:text-foreground">Nº de Alunos</TableHead>
            <TableHead className="dark:text-foreground">Turno</TableHead>
            <TableHead className="dark:text-foreground">Curso</TableHead>
            {isAdmin && (
              <TableHead className="text-right dark:text-foreground">
                Ações
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <ClassGroupSkeletonRows />
          ) : class_groups.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center py-8 text-gray-500 dark:text-muted-foreground"
              >
                Nenhuma turma encontrada
              </TableCell>
            </TableRow>
          ) : (
            class_groups.map((class_group) => (
              <TableRow
                key={class_group.id}
                className="group dark:border-border hover:bg-muted/50 dark:hover:bg-muted/20 transition-colors"
              >
                <TableCell className="dark:text-foreground">
                  {class_group.name || (
                    <span className="text-gray-400 dark:text-muted-foreground italic">
                      Não informado
                    </span>
                  )}
                </TableCell>
                <TableCell className="dark:text-foreground">
                  {class_group.semester}
                </TableCell>
                <TableCell className="dark:text-foreground">
                  {class_group.module}
                </TableCell>
                <TableCell className="dark:text-foreground">
                  {class_group.student_count}
                </TableCell>
                <TableCell className="dark:text-foreground">
                  {getField(class_group, 'shift.name') ||
                    class_group.shift.name || (
                      <span className="text-gray-400 dark:text-muted-foreground italic">
                        Não definida
                      </span>
                    )}
                </TableCell>
                <TableCell className="dark:text-foreground">
                  {getField(class_group, 'course.name') ||
                    class_group.course.name || (
                      <span className="text-gray-400 dark:text-muted-foreground italic">
                        Não definida
                      </span>
                    )}
                </TableCell>

                {isAdmin && (
                  <TableCell className="text-right">
                    <DropdownMenu
                      open={openDropdown === class_group.id}
                      onOpenChange={(open) =>
                        setOpenDropdown(open ? class_group.id : null)
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
                          onClick={() => handleEdit(class_group)}
                          className="dark:text-popover-foreground dark:hover:bg-accent dark:focus:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600 dark:text-red-400 dark:hover:bg-accent dark:focus:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => handleDelete(class_group)}
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
