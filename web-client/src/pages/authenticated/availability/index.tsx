import { useState, useMemo } from 'react';
import { Link } from 'react-router';
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
import { Return, Calendar } from '@/assets/icons';
import { MainLayout } from '@/components/layouts/MainLayout';
import { useAuth } from '@/contexts/auth';
import { useSchedules } from '@/hooks/queries/useSchedules';
import { useScheduleTeachers } from '@/hooks/queries/useScheduleTeachers';
import {
  useCreateScheduleTeacher,
  useDeleteScheduleTeacher,
} from '@/hooks/mutations/mutationScheduleTeachers';
import { AvailabilityGrid } from '@/components/availability/AvailabilityGrid';
import { AvailabilitySkeleton } from '@/components/availability/AvailabilitySkeleton';

const WEEKDAYS = [
  { key: 'monday', label: 'Segunda' },
  { key: 'tuesday', label: 'Terça' },
  { key: 'wednesday', label: 'Quarta' },
  { key: 'thursday', label: 'Quinta' },
  { key: 'friday', label: 'Sexta' },
  { key: 'saturday', label: 'Sábado' },
];

const Availability = () => {
  const { user } = useAuth();
  const [scheduleToDelete, setScheduleToDelete] = useState<number | null>(null);

  // Queries
  const { data: schedulesData, isLoading: isLoadingSchedules } = useSchedules({
    limit: 100,
  });
  const { data: scheduleTeachersData, isLoading: isLoadingScheduleTeachers } =
    useScheduleTeachers({
      teacher_id: user?.id,
      limit: 100,
    });

  // Mutations
  const createScheduleTeacherMutation = useCreateScheduleTeacher();
  const deleteScheduleTeacherMutation = useDeleteScheduleTeacher();

  // Process data to group by weekday
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

  // Get teacher's current availability
  const teacherScheduleIds = useMemo(() => {
    if (!scheduleTeachersData?.content) return new Set<number>();
    return new Set(scheduleTeachersData.content.map((st) => st.schedule_id));
  }, [scheduleTeachersData]);

  const handleToggleAvailability = async (scheduleId: number) => {
    if (!user) return;

    const isCurrentlyAvailable = teacherScheduleIds.has(scheduleId);

    if (isCurrentlyAvailable) {
      // Find the schedule_teacher record to delete
      const scheduleTeacher = scheduleTeachersData?.content.find(
        (st) => st.schedule_id === scheduleId,
      );
      if (scheduleTeacher) {
        setScheduleToDelete(scheduleTeacher.id);
      }
    } else {
      // Create new availability
      try {
        await createScheduleTeacherMutation.mutateAsync({
          schedule_id: scheduleId,
          teacher_id: user.id,
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

  const isLoading = isLoadingSchedules || isLoadingScheduleTeachers;
  const isProcessing =
    createScheduleTeacherMutation.isPending ||
    deleteScheduleTeacherMutation.isPending;

  return (
    <MainLayout requireAdmin={false}>
      <div className="space-y-6">
        <div className="flex gap-6 items-center">
          <Link to="/dashboard">
            <Return className="size-10 text-white dark:text-gray-200 hover:-translate-x-1 transition-transform" />
          </Link>
          <div>
            <h1 className="flex items-center gap-6 text-3xl font-bold text-white dark:text-gray-50 font-playwrite">
              <Calendar className="size-8" /> Minha Disponibilidade
            </h1>
            <p className="text-white/90 dark:text-gray-300 mt-3">
              Informe sua disponibilidade de horários para alocação de aulas
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-card rounded-lg p-6 shadow-sm dark:shadow-lg border dark:border-border transition-colors">
          {isLoading ? (
            <AvailabilitySkeleton />
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b dark:border-border">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
                    Selecione seus horários disponíveis
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    Clique nos horários em que você está disponível para dar
                    aulas
                  </p>
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">
                    {teacherScheduleIds.size}
                  </span>{' '}
                  horário(s) selecionado(s)
                </div>
              </div>

              {WEEKDAYS.map((day) => (
                <AvailabilityGrid
                  key={day.key}
                  weekday={day.label}
                  schedules={schedulesByWeekday[day.key] || []}
                  selectedScheduleIds={teacherScheduleIds}
                  onToggleSchedule={handleToggleAvailability}
                  disabled={isProcessing}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
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
              Tem certeza que deseja remover este horário da sua
              disponibilidade?
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
    </MainLayout>
  );
};

export default Availability;
