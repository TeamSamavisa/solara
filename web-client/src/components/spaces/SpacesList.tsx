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
import type { Space } from '@/interfaces/space';
import { SpaceSkeletonRows } from './SpaceSkeletonRows';

interface SpacesListProps {
  spaces: Space[];
  onEdit: (space: Space) => void;
  onDelete: (space: Space) => void;
  isLoading: boolean;
}

export const SpaceList: React.FC<SpacesListProps> = ({
  spaces,
  onEdit,
  onDelete,
  isLoading,
}) => {
  const { isAdmin } = useRole();
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);

  // Helper to access flatten fields from backend
  const getField = (obj: Space, field: string): string | undefined => {
    // @ts-expect-error - Accessing flatten fields from backend
    return obj[field];
  };

  const handleEdit = (space: Space) => {
    setOpenDropdown(null);
    onEdit(space);
  };

  const handleDelete = (space: Space) => {
    setOpenDropdown(null);
    onDelete(space);
  };

  return (
    <div className="max-h-[75vh] overflow-auto bg-white dark:bg-card shadow dark:shadow-lg rounded-lg border dark:border-border transition-colors">
      <Table>
        <TableHeader>
          <TableRow className="dark:border-border hover:bg-muted/50 dark:hover:bg-muted/20">
            <TableHead className="dark:text-foreground">Nome</TableHead>
            <TableHead className="dark:text-foreground">Andar/Piso</TableHead>
            <TableHead className="dark:text-foreground">Capacidade</TableHead>
            <TableHead className="dark:text-foreground">Bloqueado?</TableHead>
            <TableHead className="dark:text-foreground">
              Tipo de Espaço
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
            <SpaceSkeletonRows />
          ) : spaces.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center py-8 text-gray-500 dark:text-muted-foreground"
              >
                Nenhum espaço encontrado
              </TableCell>
            </TableRow>
          ) : (
            spaces.map((space) => (
              <TableRow
                key={space.id}
                className="group dark:border-border hover:bg-muted/50 dark:hover:bg-muted/20 transition-colors"
              >
                <TableCell className="dark:text-foreground">
                  {space.name || (
                    <span className="text-gray-400 dark:text-muted-foreground italic">
                      Não informado
                    </span>
                  )}
                </TableCell>
                <TableCell className="dark:text-foreground">
                  {space.floor}
                </TableCell>
                <TableCell className="dark:text-foreground">
                  {space.capacity}
                </TableCell>
                <TableCell className="dark:text-foreground">
                  {space.blocked ? 'Sim' : 'Não'}
                </TableCell>
                <TableCell className="dark:text-foreground">
                  {getField(space, 'spaceType.name') ||
                    space.spaceType?.name || (
                      <span className="text-gray-400 dark:text-muted-foreground italic">
                        Não definida
                      </span>
                    )}
                </TableCell>

                {isAdmin && (
                  <TableCell className="text-right">
                    <DropdownMenu
                      open={openDropdown === space.id}
                      onOpenChange={(open) =>
                        setOpenDropdown(open ? space.id : null)
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
                          onClick={() => handleEdit(space)}
                          className="dark:text-popover-foreground dark:hover:bg-accent dark:focus:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600 dark:text-red-400 dark:hover:bg-accent dark:focus:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => handleDelete(space)}
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
