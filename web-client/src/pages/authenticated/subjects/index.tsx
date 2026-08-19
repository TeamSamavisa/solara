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
import { Return, Science } from '@/assets/icons';
import { MainLayout } from '@/components/layouts/MainLayout';
import { useAuth } from '@/contexts/auth';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import type { CreateSubject } from '@/interfaces/subject/create-subject';
import type { Subject } from '@/interfaces/subject';
import type { SubjectQuery } from '@/interfaces/subject/subject-query';
import { useSubjects } from '@/hooks/queries/useSubjects';
import {
  useCreateSubject,
  useDeleteSubject,
  useUpdateSubject,
} from '@/hooks/mutations/mutationSubjects';
import type { UpdateSubject } from '@/interfaces/subject/update-subject';
import { SubjectFilters } from '@/components/subjects/SubjectFilters';
import { SubjectList } from '@/components/subjects/SubjectsList';
import { SubjectsPagination } from '@/components/subjects/SubjectsPagination';
import { SubjectForm } from '@/components/subjects/SubjectForm';
import { useSpaceTypes } from '@/hooks/queries/useSpaceTypes';
import { useCourses } from '@/hooks/queries/useCourses';

const INITIAL_FORM_DATA: CreateSubject = {
  name: '',
  course_id: null,
  required_space_type_id: null,
};

const Subjects = () => {
  const { isAdmin } = useAuth();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState<CreateSubject>(INITIAL_FORM_DATA);

  // Filters and pagination
  const [filters, setFilters] = useState<SubjectQuery>({
    page: 1,
    limit: 10,
  });

  // Debounce for filters
  const [debouncedFilters, setDebouncedFilters] =
    useState<SubjectQuery>(filters);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 500);

    return () => clearTimeout(timer);
  }, [filters]);

  // Queries and mutations
  const { data, isLoading } = useSubjects(debouncedFilters);
  const { data: coursesData } = useCourses({ limit: 10 });
  const { data: spaceTypesData } = useSpaceTypes({ limit: 10 });
  const createSubjectMutation = useCreateSubject();
  const updateSubjectMutation = useUpdateSubject();
  const deleteSubjectMutation = useDeleteSubject();

  const handleFilterChange = (name: string, value: string) => {
    setFilters((prev) => {
      if (value === '' || value === '0') {
        const newFilters = { ...prev };
        delete newFilters[name as keyof SubjectQuery];
        return { ...newFilters, page: 1 };
      }

      return {
        ...prev,
        [name]: value,
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
    setSelectedSubject(null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setIsEditMode(false);
    setFormData(INITIAL_FORM_DATA);
    setSelectedSubject(null);
  };

  const handleEdit = (subject: Subject) => {
    setIsEditMode(true);
    setSelectedSubject(subject);
    setFormData({
      name: subject.name,
      course_id: subject.course_id,
      required_space_type_id: subject.required_space_type_id,
    });
    setIsDialogOpen(true);
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: parseInt(value, 10),
    }));
  };

  const handleDelete = (subject: Subject) => {
    setSelectedSubject(subject);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedSubject) return;

    try {
      await deleteSubjectMutation.mutateAsync(selectedSubject.id);
      setIsDeleteDialogOpen(false);
      setSelectedSubject(null);
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

    if (formData.course_id === null) {
      toast.error('Erro', {
        description: 'O curso é obrigatório',
      });
      return;
    }

    if (formData.required_space_type_id === null) {
      toast.error('Erro', {
        description: 'O tipo de espaço é obrigatório',
      });
      return;
    }

    try {
      if (isEditMode && selectedSubject) {
        const updateData: UpdateSubject = {
          id: selectedSubject.id,
          name: formData.name,
          course_id: Number(formData.course_id),
          required_space_type_id: Number(formData.required_space_type_id),
        };

        await updateSubjectMutation.mutateAsync(updateData);
      } else {
        const createData: CreateSubject = {
          name: formData.name,
          course_id: Number(formData.course_id),
          required_space_type_id: Number(formData.required_space_type_id),
        };

        await createSubjectMutation.mutateAsync(createData);
      }

      handleCloseDialog();
    } catch (error) {
      // Error already handled by mutations
      console.error(error);
    }
  };

  const isSubmitting =
    createSubjectMutation.isPending || updateSubjectMutation.isPending;

  return (
    <MainLayout requireAdmin={false}>
      <div className="space-y-6">
        <div className="flex gap-6 items-center">
          <Link to="/dashboard">
            <Return className="size-10 text-gray-100 dark:text-gray-200 hover:-translate-x-1 transition-transform" />
          </Link>
          <div>
            <h1 className="flex items-center gap-6 text-3xl font-bold text-gray-100 dark:text-gray-50 font-playwrite">
              <Science className="size-8" /> Disciplinas
            </h1>
            <p className="text-gray-50 dark:text-gray-300 mt-3">
              Gerenciar disciplinas
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-card rounded-lg p-4 shadow-sm dark:shadow-lg border dark:border-border transition-colors">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center mb-4 lg:justify-between">
            <div className="w-full lg:w-auto">
              <SubjectFilters
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
                  Adicionar Disciplina
                </Button>
              )}
            </div>
          </div>

          <SubjectList
            subjects={data?.content || []}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isLoading={isLoading}
          />

          {data?.pagination && (
            <SubjectsPagination
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
                {isEditMode ? 'Editar Disciplina' : 'Adicionar Disciplina'}
              </DialogTitle>
              <DialogDescription className="dark:text-muted-foreground">
                {isEditMode
                  ? 'Atualize as informações da disciplina.'
                  : 'Preencha o formulário para adicionar uma disciplina.'}
              </DialogDescription>
            </DialogHeader>
            <SubjectForm
              isEditMode={isEditMode}
              formData={formData}
              courses={coursesData?.content || []}
              space_types={spaceTypesData?.content || []}
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
                {isEditMode ? 'Editar Disciplina' : 'Adicionar Disciplina'}
              </DrawerTitle>
              <DrawerDescription className="dark:text-muted-foreground">
                {isEditMode
                  ? 'Atualize as informações da disciplina.'
                  : 'Preencha o formulário para adicionar uma disciplina.'}
              </DrawerDescription>
            </DrawerHeader>
            <SubjectForm
              isEditMode={isEditMode}
              formData={formData}
              courses={coursesData?.content || []}
              space_types={spaceTypesData?.content || []}
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
              Tem certeza que deseja excluir a disciplina{' '}
              <span className="font-semibold dark:text-foreground">
                {selectedSubject?.name}
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
              disabled={deleteSubjectMutation.isPending}
            >
              {deleteSubjectMutation.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default Subjects;
