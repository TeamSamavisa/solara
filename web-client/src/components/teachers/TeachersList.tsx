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
import { Badge } from '../ui/badge';
import type { User } from '@/interfaces/user';
import { MoreHorizontal } from 'lucide-react';
import { TeacherSkeletonRows } from './TeacherSkeletonRows';
import { useAuth } from '@/contexts/auth';
import { useRole } from '@/hooks/useRole';

interface TeachersListProps {
  teachers: User[];
  onEdit: (teacher: User) => void;
  onDelete: (teacher: User) => void;
  onViewAvailability: (teacher: User) => void;
  isLoading: boolean;
}

export const TeachersList: React.FC<TeachersListProps> = ({
  teachers,
  onEdit,
  onDelete,
  onViewAvailability,
  isLoading,
}) => {
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);

  const handleEdit = (teacher: User) => {
    setOpenDropdown(null);
    onEdit(teacher);
  };

  const handleDelete = (teacher: User) => {
    setOpenDropdown(null);
    onDelete(teacher);
  };

  const handleViewAvailability = (teacher: User) => {
    setOpenDropdown(null);
    onViewAvailability(teacher);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'destructive';
      case 'principal':
        return 'default';
      case 'coordinator':
        return 'secondary';
      case 'teacher':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'Administrador';
      case 'principal':
        return 'Diretor';
      case 'coordinator':
        return 'Coordenador';
      case 'teacher':
        return 'Professor';
      default:
        return role;
    }
  };

  return (
    <div className="max-h-[75vh] overflow-auto bg-white dark:bg-card shadow dark:shadow-lg rounded-lg border dark:border-border transition-colors">
      <Table>
        <TableHeader>
          <TableRow className="dark:border-border hover:bg-muted/50 dark:hover:bg-muted/20">
            <TableHead className="dark:text-foreground">
              Registro Funcional
            </TableHead>
            <TableHead className="dark:text-foreground">Nome</TableHead>
            <TableHead className="dark:text-foreground">Email</TableHead>
            <TableHead className="dark:text-foreground">Função</TableHead>
            <TableHead className="text-right dark:text-foreground">
              Ações
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TeacherSkeletonRows />
          ) : teachers.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center py-8 text-gray-500 dark:text-muted-foreground"
              >
                Nenhum professor encontrado
              </TableCell>
            </TableRow>
          ) : (
            teachers.map((teacher) => (
              <TableRow
                key={teacher.id}
                className="group dark:border-border hover:bg-muted/50 dark:hover:bg-muted/20 transition-colors"
              >
                <TableCell className="dark:text-foreground">
                  {teacher.registration || (
                    <span className="text-gray-400 dark:text-muted-foreground italic">
                      Não informado
                    </span>
                  )}
                </TableCell>
                <TableCell className="dark:text-foreground">
                  {teacher.full_name}
                </TableCell>
                <TableCell className="dark:text-foreground">
                  {teacher.email}
                </TableCell>
                <TableCell>
                  <Badge variant={getRoleBadgeVariant(teacher.role)}>
                    {getRoleLabel(teacher.role)}
                  </Badge>
                </TableCell>

                <TableCell className="text-right">
                  <DropdownMenu
                    open={openDropdown === teacher.id}
                    onOpenChange={(open) =>
                      setOpenDropdown(open ? teacher.id : null)
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
                        onClick={() => handleViewAvailability(teacher)}
                        className="dark:text-popover-foreground dark:hover:bg-accent dark:focus:bg-accent"
                      >
                        Ver Disponibilidade
                      </DropdownMenuItem>
                      {isAdmin && (
                        <>
                          <DropdownMenuItem
                            onClick={() => handleEdit(teacher)}
                            disabled={user?.id === teacher.id}
                            className="dark:text-popover-foreground dark:hover:bg-accent dark:focus:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600 dark:text-red-400 dark:hover:bg-accent dark:focus:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => handleDelete(teacher)}
                            disabled={user?.id === teacher.id}
                          >
                            Excluir
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
