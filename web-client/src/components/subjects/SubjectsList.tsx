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
import type { Subject } from '@/interfaces/subject';
import { SubjectSkeletonRows } from './SubjectSkeletonRows';

interface SubjectsListProps {
  subjects: Subject[];
  onEdit: (subject: Subject) => void;
  onDelete: (subject: Subject) => void;
  isLoading: boolean;
}

export const SubjectList: React.FC<SubjectsListProps> = ({
  subjects,
  onEdit,
  onDelete,
  isLoading,
}) => {
  const { isAdmin } = useRole();
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);

  // Helper to access flatten fields from backend
  const getField = (obj: Subject, field: string): string | undefined => {
    // @ts-expect-error - Accessing flatten fields from backend
    return obj[field];
  };

  const handleEdit = (subject: Subject) => {
    setOpenDropdown(null);
    onEdit(subject);
  };

  const handleDelete = (subject: Subject) => {
    setOpenDropdown(null);
    onDelete(subject);
  };

  return (
    <div className="max-h-[75vh] overflow-auto bg-white dark:bg-card shadow dark:shadow-lg rounded-lg border dark:border-border transition-colors">
      <Table>
        <TableHeader>
          <TableRow className="dark:border-border hover:bg-muted/50 dark:hover:bg-muted/20">
            <TableHead className="dark:text-foreground">Nome</TableHead>
            <TableHead className="dark:text-foreground">
              Tipo de Espaço
            </TableHead>
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
            <SubjectSkeletonRows />
          ) : subjects.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center py-8 text-gray-500 dark:text-muted-foreground"
              >
                Nenhum espaço encontrado
              </TableCell>
            </TableRow>
          ) : (
            subjects.map((subject) => (
              <TableRow
                key={subject.id}
                className="group dark:border-border hover:bg-muted/50 dark:hover:bg-muted/20 transition-colors"
              >
                <TableCell className="dark:text-foreground">
                  {subject.name || (
                    <span className="text-gray-400 dark:text-muted-foreground italic">
                      Não informado
                    </span>
                  )}
                </TableCell>
                <TableCell className="dark:text-foreground">
                  {getField(subject, 'requiredSpaceType.name') ||
                    subject.requiredSpaceType?.name || (
                      <span className="text-gray-400 dark:text-muted-foreground italic">
                        Não definida
                      </span>
                    )}
                </TableCell>
                <TableCell className="dark:text-foreground">
                  {getField(subject, 'course.name') || subject.course?.name || (
                    <span className="text-gray-400 dark:text-muted-foreground italic">
                      Não definida
                    </span>
                  )}
                </TableCell>

                {isAdmin && (
                  <TableCell className="text-right">
                    <DropdownMenu
                      open={openDropdown === subject.id}
                      onOpenChange={(open) =>
                        setOpenDropdown(open ? subject.id : null)
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
                          onClick={() => handleEdit(subject)}
                          className="dark:text-popover-foreground dark:hover:bg-accent dark:focus:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600 dark:text-red-400 dark:hover:bg-accent dark:focus:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => handleDelete(subject)}
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
