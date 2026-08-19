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
import { Return, Place } from '@/assets/icons';
import { MainLayout } from '@/components/layouts/MainLayout';
import { useAuth } from '@/contexts/auth';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import type { SpaceQuery } from '@/interfaces/space/space-query';
import { useSpaceTypes } from '@/hooks/queries/useSpaceTypes';
import type { CreateSpaceType } from '@/interfaces/space-type/create-space-type';
import type { SpaceType } from '@/interfaces/space-type';
import {
  useCreateSpaceType,
  useDeleteSpaceType,
  useUpdateSpaceType,
} from '@/hooks/mutations/mutationSpaceTypes';
import type { UpdateSpaceType } from '@/interfaces/space-type/update-space-type';
import { SpaceTypeFilters } from '@/components/space_types/SpaceTypeFilters';
import { SpaceTypeList } from '@/components/space_types/SpaceTypesList';
import { SpaceTypesPagination } from '@/components/space_types/SpaceTypesPagination';
import { SpaceTypeForm } from '@/components/space_types/SpaceTypeForms';

const INITIAL_FORM_DATA: CreateSpaceType = {
  name: '',
};

const SpaceTypes = () => {
  const { isAdmin } = useAuth();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedSpaceType, setSelectedSpaceType] = useState<SpaceType | null>(
    null,
  );
  const [formData, setFormData] = useState<CreateSpaceType>(INITIAL_FORM_DATA);

  // Filters and pagination
  const [filters, setFilters] = useState<SpaceQuery>({
    page: 1,
    limit: 10,
  });

  // Debounce for filters
  const [debouncedFilters, setDebouncedFilters] = useState<SpaceQuery>(filters);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 500);

    return () => clearTimeout(timer);
  }, [filters]);

  // Queries and mutations
  const { data, isLoading } = useSpaceTypes(debouncedFilters);
  const createSpaceTypeMutation = useCreateSpaceType();
  const updateSpaceTypeMutation = useUpdateSpaceType();
  const deleteSpaceTypeMutation = useDeleteSpaceType();

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
    setSelectedSpaceType(null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setIsEditMode(false);
    setFormData(INITIAL_FORM_DATA);
    setSelectedSpaceType(null);
  };

  const handleEdit = (space_type: SpaceType) => {
    setIsEditMode(true);
    setSelectedSpaceType(space_type);
    setFormData({
      name: space_type.name,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (space_type: SpaceType) => {
    setSelectedSpaceType(space_type);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedSpaceType) return;

    try {
      await deleteSpaceTypeMutation.mutateAsync(selectedSpaceType.id);
      setIsDeleteDialogOpen(false);
      setSelectedSpaceType(null);
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
      if (isEditMode && selectedSpaceType) {
        const updateData: UpdateSpaceType = {
          id: selectedSpaceType.id,
          name: formData.name,
        };

        await updateSpaceTypeMutation.mutateAsync(updateData);
      } else {
        const createData: CreateSpaceType = {
          name: formData.name,
        };

        await createSpaceTypeMutation.mutateAsync(createData);
      }

      handleCloseDialog();
    } catch (error) {
      // Error already handled by mutations
      console.error(error);
    }
  };

  const isSubmitting =
    createSpaceTypeMutation.isPending || updateSpaceTypeMutation.isPending;

  return (
    <MainLayout requireAdmin={false}>
      <div className="space-y-6">
        <div className="flex gap-6 items-center">
          <Link to="/dashboard">
            <Return className="size-10 text-gray-100 dark:text-gray-200 hover:-translate-x-1 transition-transform" />
          </Link>
          <div>
            <h1 className="flex items-center gap-6 text-3xl font-bold text-gray-100 dark:text-gray-50 font-playwrite">
              <Place className="size-8" /> Tipos de Espaços
            </h1>
            <p className="text-gray-50 dark:text-gray-300 mt-3">
              Gerenciar tipos de espaços
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-card rounded-lg p-4 shadow-sm dark:shadow-lg border dark:border-border transition-colors">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center mb-4 lg:justify-between">
            <div className="w-full lg:w-auto">
              <SpaceTypeFilters
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
                  Adicionar Tipo de Espaço
                </Button>
              )}
            </div>
          </div>

          <SpaceTypeList
            space_types={data?.content || []}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isLoading={isLoading}
          />

          {data?.pagination && (
            <SpaceTypesPagination
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
                  ? 'Editar Tipo de Espaço'
                  : 'Adicionar Tipo de Espaço'}
              </DialogTitle>
              <DialogDescription className="dark:text-muted-foreground">
                {isEditMode
                  ? 'Atualize as informações do espaço.'
                  : 'Preencha o formulário para adicionar um tipo de espaço.'}
              </DialogDescription>
            </DialogHeader>
            <SpaceTypeForm
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
                  ? 'Editar Tipo de Espaço'
                  : 'Adicionar Tipo de Espaço'}
              </DrawerTitle>
              <DrawerDescription className="dark:text-muted-foreground">
                {isEditMode
                  ? 'Atualize as informações do espaço.'
                  : 'Preencha o formulário para adicionar um espaço.'}
              </DrawerDescription>
            </DrawerHeader>
            <SpaceTypeForm
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
              Tem certeza que deseja excluir o tipo de espaço{' '}
              <span className="font-semibold dark:text-foreground">
                {selectedSpaceType?.name}
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
              disabled={deleteSpaceTypeMutation.isPending}
            >
              {deleteSpaceTypeMutation.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default SpaceTypes;
