import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { MoreHorizontal, AlertTriangle, Info } from 'lucide-react';
import { useRole } from '@/hooks/useRole';
import { Badge } from '@/components/ui/badge';
import type { Assignment } from '@/interfaces/assignment';
import { AssignmentSkeletonRows } from './AssignmentSkeletonRows';
import { useState, useEffect } from 'react';

const translateWeekDay = (weekday: string) => {
  const days: Record<string, string> = {
    monday: 'Segunda',
    tuesday: 'Terça',
    wednesday: 'Quarta',
    thursday: 'Quinta',
    friday: 'Sexta',
    saturday: 'Sábado',
    sunday: 'Domingo',
  };
  return days[weekday?.toLowerCase()] || weekday;
};

interface AssignmentsListProps {
  assignments: Assignment[];
  onEdit: (assignment: Assignment) => void;
  onDelete: (assignment: Assignment) => void;
  isLoading: boolean;
}

export const AssignmentsList = ({
  assignments,
  onEdit,
  onDelete,
  isLoading,
}: AssignmentsListProps) => {
  const { isAdmin } = useRole();
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [selectedViolation, setSelectedViolation] = useState<Assignment | null>(
    null,
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Helper to access flatten fields from backend
  const getField = (obj: Assignment, field: string): string | undefined => {
    // @ts-expect-error - Accessing flatten fields from backend
    return obj[field];
  };

  const handleEdit = (assignment: Assignment) => {
    setOpenDropdown(null);
    onEdit(assignment);
  };

  const handleDelete = (assignment: Assignment) => {
    setOpenDropdown(null);
    onDelete(assignment);
  };

  const handleViolationClick = (assignment: Assignment) => {
    setSelectedViolation(assignment);
    setIsDialogOpen(true);
  };

  const violationsCount =
    assignments?.filter((a) => {
      const violatesValue = a.violates_availability as
        | number
        | boolean
        | undefined;
      return (
        violatesValue === 1 ||
        violatesValue === true ||
        (typeof violatesValue === 'number' && violatesValue > 0)
      );
    }).length || 0;

  return (
    <div className="space-y-3">
      {violationsCount > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Info className="size-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                {violationsCount}{' '}
                {violationsCount === 1
                  ? 'atribuição viola'
                  : 'atribuições violam'}{' '}
                restrições de disponibilidade
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                Linhas destacadas em vermelho indicam que o professor não está
                disponível no horário alocado, ou há incompatibilidade de turno.
                Clique em "Ver detalhes" para mais informações.
              </p>
            </div>
          </div>
        </div>
      )}
      <div className="max-h-[75vh] overflow-auto bg-white dark:bg-card shadow dark:shadow-lg rounded-lg border dark:border-border transition-colors">
        <Table>
          <TableHeader>
            <TableRow className="dark:border-border hover:bg-muted/50 dark:hover:bg-muted/20">
              <TableHead className="dark:text-foreground">Professor</TableHead>
              <TableHead className="dark:text-foreground">Disciplina</TableHead>
              <TableHead className="dark:text-foreground">Horário</TableHead>
              <TableHead className="dark:text-foreground">Espaço</TableHead>
              <TableHead className="dark:text-foreground">Turma</TableHead>
              <TableHead className="dark:text-foreground">Duração</TableHead>
              {isAdmin && (
                <TableHead className="text-right dark:text-foreground">
                  Ações
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <AssignmentSkeletonRows isAdmin={isAdmin} />
            ) : assignments?.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={isAdmin ? 7 : 6}
                  className="text-center py-8 text-gray-500 dark:text-muted-foreground"
                >
                  Nenhuma alocação encontrada
                </TableCell>
              </TableRow>
            ) : (
              assignments?.map((assignment) => {
                const violatesValue = assignment.violates_availability as
                  | number
                  | boolean
                  | undefined;
                const violatesAvailability =
                  violatesValue === 1 ||
                  violatesValue === true ||
                  (typeof violatesValue === 'number' && violatesValue > 0);
                return (
                  <TableRow
                    key={assignment.id}
                    className={`group dark:border-border hover:bg-muted/50 dark:hover:bg-muted/20 transition-colors ${
                      violatesAvailability
                        ? 'bg-red-200 dark:bg-red-700/30 hover:bg-red-300 dark:hover:bg-red-700/50'
                        : ''
                    }`}
                  >
                    <TableCell className="dark:text-foreground">
                      {getField(assignment, 'teacher.full_name') ||
                        assignment.teacher?.full_name || (
                          <span className="text-gray-400 dark:text-muted-foreground italic">
                            Não atribuído
                          </span>
                        )}
                    </TableCell>
                    <TableCell className="dark:text-foreground">
                      {getField(assignment, 'subject.name') ||
                        assignment.subject?.name || (
                          <span className="text-gray-400 dark:text-muted-foreground italic">
                            Não definida
                          </span>
                        )}
                    </TableCell>
                    <TableCell className="dark:text-foreground">
                      {assignment.schedules &&
                      assignment.schedules.length > 0 ? (
                        <div className="space-y-2">
                          {violatesAvailability && (
                            <Badge
                              variant="destructive"
                              className="text-xs font-normal"
                            >
                              <AlertTriangle className="size-3 mr-1" />
                              Violação de disponibilidade
                            </Badge>
                          )}
                          <div className="space-y-1">
                            {assignment.schedules.map((schedule, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-1"
                              >
                                {violatesAvailability && (
                                  <AlertTriangle className="size-3 text-red-600 dark:text-red-400 flex-shrink-0" />
                                )}
                                <span
                                  className={
                                    violatesAvailability
                                      ? 'text-red-600 dark:text-red-400'
                                      : ''
                                  }
                                >
                                  {translateWeekDay(schedule.weekday)}:{' '}
                                  {schedule.start_time.slice(0, 5)} -{' '}
                                  {schedule.end_time.slice(0, 5)}
                                </span>
                              </div>
                            ))}
                            {violatesAvailability && (
                              <button
                                onClick={() => handleViolationClick(assignment)}
                                className="text-xs underline text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                              >
                                Ver detalhes
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 dark:text-muted-foreground italic">
                          Não definido
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="dark:text-foreground">
                      {getField(assignment, 'space.name') ||
                        assignment.space?.name || (
                          <span className="text-gray-400 dark:text-muted-foreground italic">
                            Não definido
                          </span>
                        )}
                    </TableCell>
                    <TableCell className="dark:text-foreground">
                      {getField(assignment, 'classGroup.name') ||
                        assignment.classGroup?.name || (
                          <span className="text-gray-400 dark:text-muted-foreground italic">
                            Não definida
                          </span>
                        )}
                    </TableCell>
                    <TableCell className="dark:text-foreground">
                      {`${assignment.duration}h`}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <DropdownMenu
                          open={openDropdown === assignment.id}
                          onOpenChange={(open) =>
                            setOpenDropdown(open ? assignment.id : null)
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
                              onClick={() => handleEdit(assignment)}
                              className="dark:text-popover-foreground dark:hover:bg-accent dark:focus:bg-accent"
                            >
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600 dark:text-red-400 dark:hover:bg-accent dark:focus:bg-accent"
                              onClick={() => handleDelete(assignment)}
                            >
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Dialog for Desktop */}
        {!isMobile && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="dark:bg-card dark:border-border">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertTriangle className="size-5" />
                  Violação de Disponibilidade
                </DialogTitle>
                <DialogDescription className="dark:text-muted-foreground">
                  Esta alocação viola restrições de disponibilidade
                </DialogDescription>
              </DialogHeader>
              {selectedViolation && (
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Professor
                      </p>
                      <p className="text-base dark:text-foreground">
                        {getField(selectedViolation, 'teacher.full_name') ||
                          selectedViolation.teacher?.full_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Disciplina
                      </p>
                      <p className="text-base dark:text-foreground">
                        {getField(selectedViolation, 'subject.name') ||
                          selectedViolation.subject?.name}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Horários
                      </p>
                      <div className="space-y-1">
                        {selectedViolation.schedules &&
                        selectedViolation.schedules.length > 0 ? (
                          selectedViolation.schedules.map((schedule, idx) => (
                            <p
                              key={idx}
                              className="text-base dark:text-foreground"
                            >
                              {translateWeekDay(schedule.weekday)}:{' '}
                              {schedule.start_time.slice(0, 5)} -{' '}
                              {schedule.end_time.slice(0, 5)}
                            </p>
                          ))
                        ) : (
                          <p className="text-base dark:text-foreground italic">
                            Nenhum horário definido
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Turma
                      </p>
                      <p className="text-base dark:text-foreground">
                        {getField(selectedViolation, 'classGroup.name') ||
                          selectedViolation.classGroup?.name}
                      </p>
                    </div>
                  </div>
                  <div className="pt-4 border-t dark:border-border">
                    <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">
                      Possíveis Motivos da Violação:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                      <li>O professor não está disponível neste horário</li>
                      <li>
                        O turno do horário não é compatível com o turno da turma
                      </li>
                      <li>Há conflito com outra alocação existente</li>
                    </ul>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        )}

        {/* Drawer for Mobile */}
        {isMobile && (
          <Drawer open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DrawerContent className="dark:bg-card dark:border-border">
              <DrawerHeader>
                <DrawerTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertTriangle className="size-5" />
                  Violação de Disponibilidade
                </DrawerTitle>
                <DrawerDescription className="dark:text-muted-foreground">
                  Esta alocação viola restrições de disponibilidade
                </DrawerDescription>
              </DrawerHeader>
              {selectedViolation && (
                <div className="space-y-4 p-4 pb-8">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Professor
                      </p>
                      <p className="text-base dark:text-foreground">
                        {getField(selectedViolation, 'teacher.full_name') ||
                          selectedViolation.teacher?.full_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Disciplina
                      </p>
                      <p className="text-base dark:text-foreground">
                        {getField(selectedViolation, 'subject.name') ||
                          selectedViolation.subject?.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Horários
                      </p>
                      <div className="space-y-1">
                        {selectedViolation.schedules &&
                        selectedViolation.schedules.length > 0 ? (
                          selectedViolation.schedules.map((schedule, idx) => (
                            <p
                              key={idx}
                              className="text-base dark:text-foreground"
                            >
                              {translateWeekDay(schedule.weekday)}:{' '}
                              {schedule.start_time.slice(0, 5)} -{' '}
                              {schedule.end_time.slice(0, 5)}
                            </p>
                          ))
                        ) : (
                          <p className="text-base dark:text-foreground italic">
                            Nenhum horário definido
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Turma
                      </p>
                      <p className="text-base dark:text-foreground">
                        {getField(selectedViolation, 'classGroup.name') ||
                          selectedViolation.classGroup?.name}
                      </p>
                    </div>
                  </div>
                  <div className="pt-4 border-t dark:border-border">
                    <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">
                      Possíveis Motivos da Violação:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                      <li>O professor não está disponível neste horário</li>
                      <li>
                        O turno do horário não é compatível com o turno da turma
                      </li>
                      <li>Há conflito com outra alocação existente</li>
                    </ul>
                  </div>
                </div>
              )}
            </DrawerContent>
          </Drawer>
        )}
      </div>
    </div>
  );
};
