import { useMemo, useState } from 'react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Check, Edit } from '@/assets/icons';
import { useSchedules } from '@/hooks/queries/useSchedules';
import { useScheduleTeachers } from '@/hooks/queries/useScheduleTeachers';
import {
  useCreateScheduleTeacher,
  useDeleteScheduleTeacher,
} from '@/hooks/mutations/mutationScheduleTeachers';
import { AvailabilitySkeleton } from '@/components/availability/AvailabilitySkeleton';
import { useRole } from '@/hooks/useRole';
import type { User } from '@/interfaces/user';

interface TeacherAvailabilityDialogProps {
  teacher: User | null;
  isOpen: boolean;
  onClose: () => void;
  isDesktop: boolean;
  allowEdit?: boolean;
}

const WEEKDAYS = [
  { key: 'monday', label: 'Segunda-feira' },
  { key: 'tuesday', label: 'Terça-feira' },
  { key: 'wednesday', label: 'Quarta-feira' },
  { key: 'thursday', label: 'Quinta-feira' },
  { key: 'friday', label: 'Sexta-feira' },
  { key: 'satur day', label: 'Sábado' },
];

const AvailabilityContent = ({
  teacher,
  allowEdit,
}: {
  teacher: User;
  allowEdit: boolean;
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<number | null>(null);

  const { data: schedulesData, isLoading: isLoadingSchedules } = useSchedules({
    limit: 100,
  });
  const { data: scheduleTeachersData, isLoading: isLoadingScheduleTeachers } =
    useScheduleTeachers({
      teacher_id: teacher.id,
      limit: 100,
    });

  // Mutations
  const createScheduleTeacherMutation = useCreateScheduleTeacher();
  const deleteScheduleTeacherMutation = useDeleteScheduleTeacher();

  const schedulesByWeekday = useMemo(() => {
    if (!schedulesData?.content) return {};

    const grouped: Record<string, typeof schedulesData.content> = {};

    WEEKDAYS.forEach((day) => {
      grouped[day.key] = schedulesData.content
        .filter((schedule) => schedule.weekday.toLowerCase() === day.key)
        .sort((a, b) => a.start_time.localeCompare(b.start_time));
    });

    return grouped;
  }, [schedulesData]);

  const teacherScheduleIds = useMemo(() => {
    if (!scheduleTeachersData?.content) return new Set<number>();
    return new Set(scheduleTeachersData.content.map((st) => st.schedule_id));
  }, [scheduleTeachersData]);

  const isLoading = isLoadingSchedules || isLoadingScheduleTeachers;
  const isProcessing =
    createScheduleTeacherMutation.isPending ||
    deleteScheduleTeacherMutation.isPending;

  const handleToggleAvailability = async (scheduleId: number) => {
    const isCurrentlyAvailable = teacherScheduleIds.has(scheduleId);

    if (isCurrentlyAvailable) {
      const scheduleTeacher = scheduleTeachersData?.content.find(
        (st) => st.schedule_id === scheduleId,
      );
      if (scheduleTeacher) {
        setScheduleToDelete(scheduleTeacher.id);
      }
    } else {
      try {
        await createScheduleTeacherMutation.mutateAsync({
          schedule_id: scheduleId,
          teacher_id: teacher.id,
        });
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (scheduleToDelete === null) return;

    try {
      await deleteScheduleTeacherMutation.mutateAsync(scheduleToDelete);
      setScheduleToDelete(null);
    } catch (error) {
      console.error(error);
    }
  };

  if (isLoading) {
    return <AvailabilitySkeleton />;
  }

  const totalAvailability = teacherScheduleIds.size;

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-4 border-b dark:border-border">
          <div className="flex items-center gap-2">
            <Calendar className="size-5 text-[var(--solara-600)] dark:text-primary" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Total de horários disponíveis:
            </span>
            <Badge
              variant="default"
              className="bg-[var(--solara-800)] dark:bg-primary"
            >
              {totalAvailability}
            </Badge>
          </div>
          {allowEdit && (
            <Button
              variant={isEditMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => setIsEditMode(!isEditMode)}
              className={
                isEditMode
                  ? 'bg-[var(--solara-800)] hover:bg-[var(--solara-700)] dark:bg-primary dark:hover:bg-primary/90'
                  : ''
              }
            >
              <Edit className="size-4 mr-2" />
              {isEditMode ? 'Concluir Edição' : 'Editar'}
            </Button>
          )}
        </div>

        {!isEditMode && totalAvailability === 0 ? (
          <div className="text-center py-12">
            <Calendar className="size-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
              Nenhuma disponibilidade cadastrada
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
              {allowEdit
                ? 'Clique em "Editar" para cadastrar horários disponíveis'
                : 'Este professor ainda não informou seus horários disponíveis'}
            </p>
          </div>
        ) : (
          <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
            {isEditMode && (
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Modo de edição ativado:</strong> Clique nos horários
                  para adicionar ou remover da disponibilidade do professor.
                </p>
              </div>
            )}

            {WEEKDAYS.map((day) => {
              const daySchedules = schedulesByWeekday[day.key] || [];
              const availableSchedules = daySchedules.filter((schedule) =>
                teacherScheduleIds.has(schedule.id),
              );

              if (!isEditMode && availableSchedules.length === 0) return null;

              return (
                <div key={day.key} className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    <div className="h-1 w-1 rounded-full bg-[var(--solara-600)] dark:bg-primary" />
                    {day.label}
                    <Badge variant="outline" className="ml-2">
                      {availableSchedules.length}
                    </Badge>
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {(isEditMode ? daySchedules : availableSchedules).map(
                      (schedule) => {
                        const isSelected = teacherScheduleIds.has(schedule.id);
                        return isEditMode ? (
                          <Button
                            key={schedule.id}
                            onClick={() =>
                              handleToggleAvailability(schedule.id)
                            }
                            disabled={isProcessing}
                            variant={isSelected ? 'default' : 'outline'}
                            className={`
                              relative h-auto py-3 px-4 flex flex-col items-center justify-center
                              transition-all duration-200 hover:scale-105
                              ${
                                isSelected
                                  ? 'bg-[var(--solara-800)] hover:bg-[var(--solara-700)] dark:bg-primary dark:hover:bg-primary/90 text-white shadow-md'
                                  : 'bg-white dark:bg-card hover:bg-gray-50 dark:hover:bg-card/80 border-2 dark:border-border'
                              }
                            `}
                          >
                            {isSelected && (
                              <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1 shadow-md">
                                <Check className="size-3 text-white" />
                              </div>
                            )}
                            <span className="text-sm font-semibold">
                              {schedule.start_time.slice(0, 5)}
                            </span>
                            <span className="text-xs opacity-80">até</span>
                            <span className="text-sm font-semibold">
                              {schedule.end_time.slice(0, 5)}
                            </span>
                          </Button>
                        ) : (
                          <div
                            key={schedule.id}
                            className="flex flex-col items-center justify-center p-3 rounded-lg bg-[var(--solara-50)] dark:bg-primary/10 border-2 border-[var(--solara-200)] dark:border-primary/30 transition-all"
                          >
                            <Clock className="size-4 text-[var(--solara-600)] dark:text-primary mb-1" />
                            <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                              {schedule.start_time.slice(0, 5)}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              até
                            </span>
                            <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                              {schedule.end_time.slice(0, 5)}
                            </span>
                          </div>
                        );
                      },
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AlertDialog
        open={scheduleToDelete !== null}
        onOpenChange={(open) => !open && setScheduleToDelete(null)}
      >
        <AlertDialogContent className="dark:bg-card dark:border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-foreground">
              Remover disponibilidade
            </AlertDialogTitle>
            <AlertDialogDescription className="dark:text-muted-foreground">
              Tem certeza que deseja remover este horário da disponibilidade do
              professor?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-secondary/80">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 dark:bg-destructive dark:hover:bg-destructive/80 transition-colors"
              disabled={deleteScheduleTeacherMutation.isPending}
            >
              {deleteScheduleTeacherMutation.isPending
                ? 'Removendo...'
                : 'Remover'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export const TeacherAvailabilityDialog = ({
  teacher,
  isOpen,
  onClose,
  isDesktop,
  allowEdit = false,
}: TeacherAvailabilityDialogProps) => {
  const { hasRole } = useRole();

  if (!teacher) return null;

  const canEdit = allowEdit && hasRole('coordinator');

  const content = <AvailabilityContent teacher={teacher} allowEdit={canEdit} />;

  const description = canEdit
    ? 'Visualize e gerencie os horários disponíveis do professor'
    : 'Visualize os horários em que o professor está disponível';

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="dark:text-foreground flex items-center gap-2">
              <Calendar className="size-5" />
              Disponibilidade - {teacher.full_name}
            </DialogTitle>
            <DialogDescription className="dark:text-muted-foreground">
              {description}
            </DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="text-left">
          <DrawerTitle className="dark:text-foreground flex items-center gap-2">
            <Calendar className="size-5" />
            Disponibilidade - {teacher.full_name}
          </DrawerTitle>
          <DrawerDescription className="dark:text-muted-foreground">
            {description}
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-4 overflow-y-auto">{content}</div>
      </DrawerContent>
    </Drawer>
  );
};
