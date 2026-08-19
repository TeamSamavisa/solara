import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
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
import { Button } from '@/components/ui/button';
import { Return, Clock } from '@/assets/icons';
import { MainLayout } from '@/components/layouts/MainLayout';
import { useAuth } from '@/contexts/auth';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import type { CreateSchedule } from '@/interfaces/schedule/create-schedule';
import type { Schedule } from '@/interfaces/schedule';
import type { ScheduleQuery } from '@/interfaces/schedule/schedule-query';
import { useSchedules } from '@/hooks/queries/useSchedules';
import {
  useCreateSchedule,
  useDeleteSchedule,
  useUpdateSchedule,
} from '@/hooks/mutations/mutationSchedules';
import type { UpdateSchedule } from '@/interfaces/schedule/update-schedule';
import { SchedulesFilters } from '@/components/schedules/ScheduleFilters';
import { ScheduleList } from '@/components/schedules/SchedulesList';
import { SchedulesPagination } from '@/components/schedules/SchedulePagination';
import { ScheduleForm } from '@/components/schedules/ScheduleForm';

const INITIAL_FORM_DATA: CreateSchedule = {
  weekday: '',
  start_time: '',
  end_time: '',
  shift_id: 0,
};

const Schedules = () => {
  const { isAdmin } = useAuth();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(
    null,
  );
  const [formData, setFormData] = useState<CreateSchedule>(INITIAL_FORM_DATA);

  // Filters and pagination
  const [filters, setFilters] = useState<ScheduleQuery>({
    page: 1,
    limit: 10,
  });

  // Debounce for filters
  const [debouncedFilters, setDebouncedFilters] =
    useState<ScheduleQuery>(filters);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 500);

    return () => clearTimeout(timer);
  }, [filters]);

  // Queries and mutations
  const { data, isLoading } = useSchedules(debouncedFilters);
  const createScheduleMutation = useCreateSchedule();
  const updateScheduleMutation = useUpdateSchedule();
  const deleteScheduleMutation = useDeleteSchedule();

  const handleFilterChange = (name: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      page: 1, // Reset to first page on filter
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({
      ...prev,
      page,
    }));
  };

  const handleOpenDialog = () => {
    setIsEditMode(false);
    setFormData(INITIAL_FORM_DATA);
    setSelectedSchedule(null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setIsEditMode(false);
    setFormData(INITIAL_FORM_DATA);
    setSelectedSchedule(null);
  };

  const handleEdit = (schedule: Schedule) => {
    setIsEditMode(true);
    setSelectedSchedule(schedule);
    setFormData({
      weekday: schedule.weekday,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      shift_id: schedule.shift_id,
    });
    setIsDialogOpen(true);
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDelete = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedSchedule) return;

    try {
      await deleteScheduleMutation.mutateAsync(selectedSchedule.id);
      setIsDeleteDialogOpen(false);
      setSelectedSchedule(null);
    } catch (error) {
      // Error already handled by mutation
      console.error(error);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value === '' ? '' : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.weekday.trim() ||
      !formData.start_time.trim() ||
      !formData.end_time.trim() ||
      !formData.shift_id
    ) {
      toast.error('Erro', {
        description: 'Todos os campos são obrigatórios',
      });
      return;
    }

    try {
      if (isEditMode && selectedSchedule) {
        const updateData: UpdateSchedule = {
          id: selectedSchedule.id,
          weekday: formData.weekday,
          start_time: formData.start_time,
          end_time: formData.end_time,
          shift_id: Number(formData.shift_id),
        };

        await updateScheduleMutation.mutateAsync(updateData);
      } else {
        const createData: CreateSchedule = {
          weekday: formData.weekday,
          start_time: formData.start_time,
          end_time: formData.end_time,
          shift_id: Number(formData.shift_id),
        };

        await createScheduleMutation.mutateAsync(createData);
      }

      handleCloseDialog();
    } catch (error) {
      // Error already handled by mutations
      console.error(error);
    }
  };

  const isSubmitting =
    createScheduleMutation.isPending || updateScheduleMutation.isPending;

  return (
    <MainLayout requireAdmin={false}>
      <div className="space-y-6">
        <div className="flex gap-6 items-center">
          <Link to="/dashboard">
            <Return className="size-10 text-gray-100 dark:text-gray-200 hover:-translate-x-1 transition-transform" />
          </Link>
          <div>
            <h1 className="flex items-center gap-6 text-3xl font-bold text-gray-100 dark:text-gray-50 font-playwrite">
              <Clock className="size-8" /> Horários
            </h1>
            <p className="text-gray-50 dark:text-gray-300 mt-3">
              Gerenciar horários
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-card rounded-lg p-4 shadow-sm dark:shadow-lg border dark:border-border transition-colors">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center mb-4 lg:justify-between">
            <div className="w-full lg:w-auto">
              <SchedulesFilters
                filters={filters}
                onFilterChange={handleFilterChange}
              />
            </div>

            <div className="flex items-center justify-between lg:justify-start gap-4 w-full lg:w-auto">
              {isAdmin && (
                <Button
                  onClick={handleOpenDialog}
                  className="bg-[var(--solara-800)] hover:bg-[var(--solara-700)] dark:bg-primary dark:hover:bg-primary/90 transition-colors"
                >
                  Adicionar Horário
                </Button>
              )}
            </div>
          </div>

          <ScheduleList
            schedules={data?.content || []}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isLoading={isLoading}
          />

          {data?.pagination && (
            <SchedulesPagination
              currentPage={data.pagination.currentPage}
              totalPages={data.pagination.totalPages}
              totalItems={data.pagination.totalItems}
              itemsPerPage={data.pagination.itemsPerPage}
              hasNextPage={data.pagination.hasNextPage}
              hasPrevPage={data.pagination.hasPrevPage}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </div>

      {/* Responsive Form Dialog/Drawer */}
      {isDesktop ? (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="dark:text-foreground">
                {isEditMode ? 'Editar Horário' : 'Adicionar Horário'}
              </DialogTitle>
              <DialogDescription className="dark:text-muted-foreground">
                {isEditMode
                  ? 'Atualize as informações do horário.'
                  : 'Preencha o formulário para adicionar um horário.'}
              </DialogDescription>
            </DialogHeader>
            <ScheduleForm
              isEditMode={isEditMode}
              formData={formData}
              onSubmit={handleSubmit}
              onSelectChange={handleSelectChange}
              onChange={handleFormChange}
              isSubmitting={isSubmitting}
            />
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DrawerContent>
            <DrawerHeader className="text-left">
              <DrawerTitle className="dark:text-foreground">
                {isEditMode ? 'Editar Horário' : 'Adicionar Horário'}
              </DrawerTitle>
              <DrawerDescription className="dark:text-muted-foreground">
                {isEditMode
                  ? 'Atualize as informações do horário.'
                  : 'Preencha o formulário para adicionar um horário.'}
              </DrawerDescription>
            </DrawerHeader>
            <ScheduleForm
              isEditMode={isEditMode}
              formData={formData}
              onSubmit={handleSubmit}
              onSelectChange={handleSelectChange}
              onChange={handleFormChange}
              isSubmitting={isSubmitting}
              className="px-4"
            />
            <DrawerFooter className="pt-2">
              <DrawerClose asChild>
                <Button
                  variant="outline"
                  className="dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-secondary/80 dark:border-border"
                  onClick={handleCloseDialog}
                >
                  Cancelar
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="dark:bg-card dark:border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-foreground">
              Confirmar exclusão
            </AlertDialogTitle>
            <AlertDialogDescription className="dark:text-muted-foreground">
              Tem certeza que deseja excluir o espaço{' '}
              <span className="font-semibold dark:text-foreground">
                {selectedSchedule?.weekday} {selectedSchedule?.start_time}{' '}
                {selectedSchedule?.end_time}
              </span>
              ? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-secondary/80">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 dark:bg-destructive dark:hover:bg-destructive/80 transition-colors"
              disabled={deleteScheduleMutation.isPending}
            >
              {deleteScheduleMutation.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default Schedules;
