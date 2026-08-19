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
import { Return, Book } from '@/assets/icons';
import { MainLayout } from '@/components/layouts/MainLayout';
import { useAuth } from '@/contexts/auth';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import type { CreateCourseType } from '@/interfaces/course-type/create-course-type';
import type { CourseType } from '@/interfaces/course-type';
import type { CourseTypeQuery } from '@/interfaces/course-type/course-type-query';
import { useCourseTypes } from '@/hooks/queries/useCourseTypes';
import {
  useCreateCourseType,
  useDeleteCourseType,
  useUpdateCourseType,
} from '@/hooks/mutations/mutationCourseTypes';
import type { UpdateCourseType } from '@/interfaces/course-type/update-course-type';
import { CourseTypeFilters } from '@/components/course-types/CourseTypeFilters';
import { CourseTypesList } from '@/components/course-types/CourseTypesList';
import { CourseTypesPagination } from '@/components/course-types/CourseTypesPagination';
import { CourseTypeForm } from '@/components/course-types/CourseTypeForm';

const INITIAL_FORM_DATA: CreateCourseType = {
  name: '',
};

const CourseTypes = () => {
  const { isAdmin } = useAuth();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedCourseType, setSelectedCourseType] =
    useState<CourseType | null>(null);
  const [formData, setFormData] = useState<CreateCourseType>(INITIAL_FORM_DATA);

  // Filters and pagination
  const [filters, setFilters] = useState<CourseTypeQuery>({
    page: 1,
    limit: 10,
  });

  // Debounce for filters
  const [debouncedFilters, setDebouncedFilters] =
    useState<CourseTypeQuery>(filters);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 500);

    return () => clearTimeout(timer);
  }, [filters]);

  // Queries and mutations
  const { data, isLoading } = useCourseTypes(debouncedFilters);
  const createCourseTypeMutation = useCreateCourseType();
  const updateCourseTypeMutation = useUpdateCourseType();
  const deleteCourseTypeMutation = useDeleteCourseType();

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
    setSelectedCourseType(null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setIsEditMode(false);
    setFormData(INITIAL_FORM_DATA);
    setSelectedCourseType(null);
  };

  const handleEdit = (course_type: CourseType) => {
    setIsEditMode(true);
    setSelectedCourseType(course_type);
    setFormData({
      name: course_type.name,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (course_type: CourseType) => {
    setSelectedCourseType(course_type);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedCourseType) return;

    try {
      await deleteCourseTypeMutation.mutateAsync(selectedCourseType.id);
      setIsDeleteDialogOpen(false);
      setSelectedCourseType(null);
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

    try {
      if (isEditMode && selectedCourseType) {
        const updateData: UpdateCourseType = {
          id: selectedCourseType.id,
          name: formData.name,
        };

        await updateCourseTypeMutation.mutateAsync(updateData);
      } else {
        const createData: CreateCourseType = {
          name: formData.name,
        };

        await createCourseTypeMutation.mutateAsync(createData);
      }

      handleCloseDialog();
    } catch (error) {
      // Error already handled by mutations
      console.error(error);
    }
  };

  const isSubmitting =
    createCourseTypeMutation.isPending || updateCourseTypeMutation.isPending;

  return (
    <MainLayout requireAdmin={false}>
      <div className="space-y-6">
        <div className="flex gap-6 items-center">
          <Link to="/dashboard">
            <Return className="size-10 text-gray-100 dark:text-gray-200 hover:-translate-x-1 transition-transform" />
          </Link>
          <div>
            <h1 className="flex items-center gap-6 text-3xl font-bold text-gray-100 dark:text-gray-50 font-playwrite">
              <Book className="size-8" /> Tipos de Cursos
            </h1>
            <p className="text-gray-50 dark:text-gray-300 mt-3">
              Gerenciar tipos de cursos
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-card rounded-lg p-4 shadow-sm dark:shadow-lg border dark:border-border transition-colors">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center mb-4 lg:justify-between">
            <div className="w-full lg:w-auto">
              <CourseTypeFilters
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
                  Adicionar Tipo de Curso
                </Button>
              )}
            </div>
          </div>

          <CourseTypesList
            course_types={data?.content || []}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isLoading={isLoading}
          />

          {data?.pagination && (
            <CourseTypesPagination
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
                {isEditMode
                  ? 'Editar Tipo de Curso'
                  : 'Adicionar Tipo de Curso'}
              </DialogTitle>
              <DialogDescription className="dark:text-muted-foreground">
                {isEditMode
                  ? 'Atualize as informações do tipo de curso.'
                  : 'Preencha o formulário para adicionar um tipo de curso.'}
              </DialogDescription>
            </DialogHeader>
            <CourseTypeForm
              isEditMode={isEditMode}
              formData={formData}
              onSubmit={handleSubmit}
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
                {isEditMode
                  ? 'Editar Tipo de Curso'
                  : 'Adicionar Tipo de Curso'}
              </DrawerTitle>
              <DrawerDescription className="dark:text-muted-foreground">
                {isEditMode
                  ? 'Atualize as informações do tipo de curso.'
                  : 'Preencha o formulário para adicionar tipo de curso.'}
              </DrawerDescription>
            </DrawerHeader>
            <CourseTypeForm
              isEditMode={isEditMode}
              formData={formData}
              onSubmit={handleSubmit}
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
              Tem certeza que deseja excluir o tipo de curso{' '}
              <span className="font-semibold dark:text-foreground">
                {selectedCourseType?.name}
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
              disabled={deleteCourseTypeMutation.isPending}
            >
              {deleteCourseTypeMutation.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default CourseTypes;
