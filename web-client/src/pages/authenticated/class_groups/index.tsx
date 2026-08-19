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
import { Return, ClassGroupIcon } from '@/assets/icons';
import { MainLayout } from '@/components/layouts/MainLayout';
import { useAuth } from '@/contexts/auth';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import type { CreateClassGroup } from '@/interfaces/class-group/create-class-group';
import type { ClassGroup } from '@/interfaces/class-group';
import type { ClassGroupQuery } from '@/interfaces/class-group/class-group-query';
import { useShifts } from '@/hooks/queries/useShifts';
import { useCourses } from '@/hooks/queries/useCourses';
import {
  useCreateClassGroup,
  useDeleteClassGroup,
  useUpdateClassGroup,
} from '@/hooks/mutations/mutationClassGroups';
import type { UpdateClassGroup } from '@/interfaces/class-group/update-class-group';
import { ClassGroupFilters } from '@/components/class_groups/ClassGroupFilters';
import { ClassGroupList } from '@/components/class_groups/ClassGroupList';
import { useClassGroups } from '@/hooks/queries/useClassGroups';
import { ClassGroupsPagination } from '@/components/class_groups/ClassGroupsPagination';
import { ClassGroupForm } from '@/components/class_groups/ClassGroupForm';

const INITIAL_FORM_DATA: CreateClassGroup = {
  name: '',
  semester: '',
  module: '',
  student_count: 0,
  shift_id: null,
  course_id: null,
};

const ClassGroups = () => {
  const { isAdmin } = useAuth();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedClassGroup, setSelectedClassGroup] =
    useState<ClassGroup | null>(null);
  const [formData, setFormData] = useState<CreateClassGroup>(INITIAL_FORM_DATA);

  // Filters and pagination
  const [filters, setFilters] = useState<ClassGroupQuery>({
    page: 1,
    limit: 10,
  });

  // Debounce for filters
  const [debouncedFilters, setDebouncedFilters] =
    useState<ClassGroupQuery>(filters);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 500);

    return () => clearTimeout(timer);
  }, [filters]);

  // Queries and mutations
  const { data, isLoading } = useClassGroups(debouncedFilters);
  const { data: shiftsData } = useShifts({ limit: 10 });
  const { data: cousesData } = useCourses({ limit: 10 });
  const createClassGroupMutation = useCreateClassGroup();
  const updateClassGroupMutation = useUpdateClassGroup();
  const deleteClassGroupMutation = useDeleteClassGroup();

  const handleFilterChange = (name: string, value: string) => {
    setFilters((prev) => {
      if (value === '' || value === '0') {
        const newFilters = { ...prev };
        delete newFilters[name as keyof ClassGroupQuery];
        return { ...newFilters, page: 1 };
      }

      return {
        ...prev,
        [name]: name === 'student_count' ? Number(value) : value,
        page: 1,
      };
    });
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
    setSelectedClassGroup(null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setIsEditMode(false);
    setFormData(INITIAL_FORM_DATA);
    setSelectedClassGroup(null);
  };

  const handleEdit = (class_group: ClassGroup) => {
    setIsEditMode(true);
    setSelectedClassGroup(class_group);
    setFormData({
      name: class_group.name,
      semester: class_group.semester,
      module: class_group.module,
      student_count: class_group.student_count,
      shift_id: class_group.shift_id,
      course_id: class_group.course_id,
    });
    setIsDialogOpen(true);
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: parseInt(value),
    }));
  };

  const handleDelete = (class_group: ClassGroup) => {
    setSelectedClassGroup(class_group);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedClassGroup) return;

    try {
      await deleteClassGroupMutation.mutateAsync(selectedClassGroup.id);
      setIsDeleteDialogOpen(false);
      setSelectedClassGroup(null);
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

    if (!formData.name.trim()) {
      toast.error('Erro', {
        description: 'O nome é obrigatório',
      });
      return;
    }

    if (!formData.semester.trim()) {
      toast.error('Erro', {
        description: 'O semestre é obrigatório',
      });
      return;
    }

    if (!formData.module.trim()) {
      toast.error('Erro', {
        description: 'O módulo é obrigatório',
      });
      return;
    }

    if (formData.student_count === null) {
      toast.error('Erro', {
        description: 'O nº de alunos é obrigatório',
      });
      return;
    }

    if (formData.shift_id === null) {
      toast.error('Erro', {
        description: 'O turno é obrigatório',
      });
      return;
    }

    if (formData.course_id === null) {
      toast.error('Erro', {
        description: 'O curso é obrigatório',
      });
      return;
    }

    try {
      if (isEditMode && selectedClassGroup) {
        const updateData: UpdateClassGroup = {
          id: selectedClassGroup.id,
          name: formData.name,
          semester: formData.semester,
          module: formData.module,
          student_count: Number(formData.student_count),
          shift_id: Number(formData.shift_id),
          course_id: Number(formData.course_id),
        };

        await updateClassGroupMutation.mutateAsync(updateData);
      } else {
        const createData: CreateClassGroup = {
          name: formData.name,
          semester: formData.semester,
          module: formData.module,
          student_count: Number(formData.student_count),
          shift_id: Number(formData.shift_id),
          course_id: Number(formData.course_id),
        };

        await createClassGroupMutation.mutateAsync(createData);
      }

      handleCloseDialog();
    } catch (error) {
      // Error already handled by mutations
      console.error(error);
    }
  };

  const isSubmitting =
    createClassGroupMutation.isPending || updateClassGroupMutation.isPending;

  return (
    <MainLayout requireAdmin={false}>
      <div className="space-y-6">
        <div className="flex gap-6 items-center">
          <Link to="/dashboard">
            <Return className="size-10 text-gray-100 dark:text-gray-200 hover:-translate-x-1 transition-transform" />
          </Link>
          <div>
            <h1 className="flex items-center gap-6 text-3xl font-bold text-gray-100 dark:text-gray-50 font-playwrite">
              <ClassGroupIcon className="size-8" /> Turmas
            </h1>
            <p className="text-gray-50 dark:text-gray-300 mt-3">
              Gerenciar turmas
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-card rounded-lg p-4 shadow-sm dark:shadow-lg border dark:border-border transition-colors">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center mb-4 lg:justify-between">
            <div className="w-full lg:w-auto">
              <ClassGroupFilters
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
                  Adicionar Turma
                </Button>
              )}
            </div>
          </div>

          <ClassGroupList
            class_groups={data?.content || []}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isLoading={isLoading}
          />

          {data?.pagination && (
            <ClassGroupsPagination
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
                {isEditMode ? 'Editar Turma' : 'Adicionar Turma'}
              </DialogTitle>
              <DialogDescription className="dark:text-muted-foreground">
                {isEditMode
                  ? 'Atualize as informações da turma.'
                  : 'Preencha o formulário para adicionar uma turma.'}
              </DialogDescription>
            </DialogHeader>
            <ClassGroupForm
              isEditMode={isEditMode}
              formData={formData}
              shifts={shiftsData?.content || []}
              courses={cousesData?.content || []}
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
                {isEditMode ? 'Editar Turma' : 'Adicionar Turma'}
              </DrawerTitle>
              <DrawerDescription className="dark:text-muted-foreground">
                {isEditMode
                  ? 'Atualize as informações da turma.'
                  : 'Preencha o formulário para adicionar uma turma.'}
              </DrawerDescription>
            </DrawerHeader>
            <ClassGroupForm
              isEditMode={isEditMode}
              formData={formData}
              shifts={shiftsData?.content || []}
              courses={cousesData?.content || []}
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
              Tem certeza que deseja excluir a turma{' '}
              <span className="font-semibold dark:text-foreground">
                {selectedClassGroup?.name}
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
              disabled={deleteClassGroupMutation.isPending}
            >
              {deleteClassGroupMutation.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default ClassGroups;
