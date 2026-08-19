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
import { Return, GraduationCap } from '@/assets/icons';
import { MainLayout } from '@/components/layouts/MainLayout';
import { useAuth } from '@/contexts/auth';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import type { CreateCourse } from '@/interfaces/course/create-course';
import type { Course } from '@/interfaces/course';
import type { CourseQuery } from '@/interfaces/course/course-query';
import { useCourses } from '@/hooks/queries/useCourses';
import {
  useCreateCourse,
  useDeleteCourse,
  useUpdateCourse,
} from '@/hooks/mutations/mutationCourses';
import type { UpdateCourse } from '@/interfaces/course/update-course';
import { CourseFilters } from '@/components/courses/CourseFilters';
import { CoursesList } from '@/components/courses/CoursesList';
import { CoursesPagination } from '@/components/courses/CoursesPagination';
import { CourseForm } from '@/components/courses/CourseForm';
import { useCourseTypes } from '@/hooks/queries/useCourseTypes';

const INITIAL_FORM_DATA: CreateCourse = {
  name: '',
  course_type_id: null,
};

const Courses = () => {
  const { isAdmin } = useAuth();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState<CreateCourse>(INITIAL_FORM_DATA);

  // Filters and pagination
  const [filters, setFilters] = useState<CourseQuery>({
    page: 1,
    limit: 10,
  });

  // Debounce for filters
  const [debouncedFilters, setDebouncedFilters] =
    useState<CourseQuery>(filters);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 500);

    return () => clearTimeout(timer);
  }, [filters]);

  // Queries and mutations
  const { data, isLoading } = useCourses(debouncedFilters);
  const { data: courseTypesData } = useCourseTypes({ limit: 10 });
  const createCourseMutation = useCreateCourse();
  const updateCourseMutation = useUpdateCourse();
  const deleteCourseMutation = useDeleteCourse();

  const handleFilterChange = (name: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      page: 1,
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
    setSelectedCourse(null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setIsEditMode(false);
    setFormData(INITIAL_FORM_DATA);
    setSelectedCourse(null);
  };

  const handleEdit = (course: Course) => {
    setIsEditMode(true);
    setSelectedCourse(course);
    setFormData({
      name: course.name,
      course_type_id: course.course_type_id,
    });
    setIsDialogOpen(true);
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDelete = (course: Course) => {
    setSelectedCourse(course);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedCourse) return;

    try {
      await deleteCourseMutation.mutateAsync(selectedCourse.id);
      setIsDeleteDialogOpen(false);
      setSelectedCourse(null);
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

    if (!formData.course_type_id) {
      toast.error('Erro', {
        description: 'O tipo de curso é obrigatório',
      });
      return;
    }

    try {
      if (isEditMode && selectedCourse) {
        const updateData: UpdateCourse = {
          id: selectedCourse.id,
          name: formData.name,
          course_type_id: Number(formData.course_type_id),
        };

        await updateCourseMutation.mutateAsync(updateData);
      } else {
        const createData: CreateCourse = {
          name: formData.name,
          course_type_id: Number(formData.course_type_id),
        };

        await createCourseMutation.mutateAsync(createData);
      }

      handleCloseDialog();
    } catch (error) {
      // Error already handled by mutations
      console.error(error);
    }
  };

  const isSubmitting =
    createCourseMutation.isPending || updateCourseMutation.isPending;

  return (
    <MainLayout requireAdmin={false}>
      <div className="space-y-6">
        <div className="flex gap-6 items-center">
          <Link to="/dashboard">
            <Return className="size-10 text-gray-100 dark:text-gray-200 hover:-translate-x-1 transition-transform" />
          </Link>
          <div>
            <h1 className="flex items-center gap-6 text-3xl font-bold text-gray-100 dark:text-gray-50 font-playwrite">
              <GraduationCap className="size-8" /> Cursos
            </h1>
            <p className="text-gray-50 dark:text-gray-300 mt-3">
              Gerenciar cursos
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-card rounded-lg p-4 shadow-sm dark:shadow-lg border dark:border-border transition-colors">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center mb-4 lg:justify-between">
            <div className="w-full lg:w-auto">
              <CourseFilters
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
                  Adicionar Curso
                </Button>
              )}
            </div>
          </div>

          <CoursesList
            courses={data?.content || []}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isLoading={isLoading}
          />

          {data?.pagination && (
            <CoursesPagination
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
                {isEditMode ? 'Editar Curso' : 'Adicionar Curso'}
              </DialogTitle>
              <DialogDescription className="dark:text-muted-foreground">
                {isEditMode
                  ? 'Atualize as informações do curso.'
                  : 'Preencha o formulário para adicionar um curso.'}
              </DialogDescription>
            </DialogHeader>
            <CourseForm
              isEditMode={isEditMode}
              formData={formData}
              course_types={courseTypesData?.content || []}
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
                {isEditMode ? 'Editar Curso' : 'Adicionar Curso'}
              </DrawerTitle>
              <DrawerDescription className="dark:text-muted-foreground">
                {isEditMode
                  ? 'Atualize as informações do curso.'
                  : 'Preencha o formulário para adicionar um curso.'}
              </DrawerDescription>
            </DrawerHeader>
            <CourseForm
              isEditMode={isEditMode}
              formData={formData}
              course_types={courseTypesData?.content || []}
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
              Tem certeza que deseja excluir o curso{' '}
              <span className="font-semibold dark:text-foreground">
                {selectedCourse?.name}
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
              disabled={deleteCourseMutation.isPending}
            >
              {deleteCourseMutation.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default Courses;
