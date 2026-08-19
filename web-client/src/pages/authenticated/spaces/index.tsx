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
import type { CreateSpace } from '@/interfaces/space/create-space';
import type { Space } from '@/interfaces/space';
import type { SpaceQuery } from '@/interfaces/space/space-query';
import { useSpaces } from '@/hooks/queries/useSpaces';
import {
  useCreateSpace,
  useDeleteSpace,
  useUpdateSpace,
} from '@/hooks/mutations/mutationSpaces';
import type { UpdateSpace } from '@/interfaces/space/update-space';
import { SpaceFilters } from '@/components/spaces/SpaceFilters';
import { SpaceList } from '@/components/spaces/SpacesList';
import { SpacesPagination } from '@/components/spaces/SpacesPagination';
import { SpaceForm } from '@/components/spaces/SpaceForm';
import { useSpaceTypes } from '@/hooks/queries/useSpaceTypes';

const INITIAL_FORM_DATA: CreateSpace = {
  name: '',
  floor: 0,
  capacity: 0,
  blocked: null,
  space_type_id: null,
};

const Spaces = () => {
  const { isAdmin } = useAuth();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
  const [formData, setFormData] = useState<CreateSpace>(INITIAL_FORM_DATA);

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
  const { data, isLoading } = useSpaces(debouncedFilters);
  const { data: spaceTypesData } = useSpaceTypes({ limit: 10 });
  const createSpaceMutation = useCreateSpace();
  const updateSpaceMutation = useUpdateSpace();
  const deleteSpaceMutation = useDeleteSpace();

  const handleFilterChange = (name: string, value: string) => {
    setFilters((prev) => {
      if (value === '' || value === '0') {
        const newFilters = { ...prev };
        delete newFilters[name as keyof SpaceQuery];
        return { ...newFilters, page: 1 };
      }

      return {
        ...prev,
        [name]: name === 'floor' ? Number(value) : value,
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
    setSelectedSpace(null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setIsEditMode(false);
    setFormData(INITIAL_FORM_DATA);
    setSelectedSpace(null);
  };

  const handleEdit = (space: Space) => {
    setIsEditMode(true);
    setSelectedSpace(space);
    setFormData({
      name: space.name,
      floor: space.floor,
      capacity: space.capacity,
      blocked: space.blocked,
      space_type_id: space.space_type_id,
    });
    setIsDialogOpen(true);
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'blocked' ? value === 'true' : parseInt(value),
    }));
  };

  const handleDelete = (space: Space) => {
    setSelectedSpace(space);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedSpace) return;

    try {
      await deleteSpaceMutation.mutateAsync(selectedSpace.id);
      setIsDeleteDialogOpen(false);
      setSelectedSpace(null);
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

    if (formData.floor === null) {
      toast.error('Erro', {
        description: 'O andar/piso é obrigatório',
      });
      return;
    }

    if (formData.capacity === null) {
      toast.error('Erro', {
        description: 'A capacidade é obrigatória',
      });
      return;
    }

    if (formData.blocked === null) {
      toast.error('Erro', {
        description: 'Bloqueado é obrigatório',
      });
      return;
    }

    if (formData.space_type_id === null) {
      toast.error('Erro', {
        description: 'O tipo de espaço é obrigatório',
      });
      return;
    }

    try {
      if (isEditMode && selectedSpace) {
        const updateData: UpdateSpace = {
          id: selectedSpace.id,
          name: formData.name,
          floor: Number(formData.floor),
          capacity: Number(formData.capacity),
          blocked: Boolean(formData.blocked),
          space_type_id: Number(formData.space_type_id),
        };

        await updateSpaceMutation.mutateAsync(updateData);
      } else {
        const createData: CreateSpace = {
          name: formData.name,
          floor: Number(formData.floor),
          capacity: Number(formData.capacity),
          blocked: Boolean(formData.blocked),
          space_type_id: Number(formData.space_type_id),
        };

        await createSpaceMutation.mutateAsync(createData);
      }

      handleCloseDialog();
    } catch (error) {
      // Error already handled by mutations
      console.error(error);
    }
  };

  const isSubmitting =
    createSpaceMutation.isPending || updateSpaceMutation.isPending;

  return (
    <MainLayout requireAdmin={false}>
      <div className="space-y-6">
        <div className="flex gap-6 items-center">
          <Link to="/dashboard">
            <Return className="size-10 text-gray-100 dark:text-gray-200 hover:-translate-x-1 transition-transform" />
          </Link>
          <div>
            <h1 className="flex items-center gap-6 text-3xl font-bold text-gray-100 dark:text-gray-50 font-playwrite">
              <Place className="size-8" /> Espaços
            </h1>
            <p className="text-gray-50 dark:text-gray-300 mt-3">
              Gerenciar espaços
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-card rounded-lg p-4 shadow-sm dark:shadow-lg border dark:border-border transition-colors">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center mb-4 lg:justify-between">
            <div className="w-full lg:w-auto">
              <SpaceFilters
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
                  Adicionar Espaço
                </Button>
              )}
            </div>
          </div>

          <SpaceList
            spaces={data?.content || []}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isLoading={isLoading}
          />

          {data?.pagination && (
            <SpacesPagination
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
                {isEditMode ? 'Editar Espaço' : 'Adicionar Espaço'}
              </DialogTitle>
              <DialogDescription className="dark:text-muted-foreground">
                {isEditMode
                  ? 'Atualize as informações do espaço.'
                  : 'Preencha o formulário para adicionar um espaço.'}
              </DialogDescription>
            </DialogHeader>
            <SpaceForm
              isEditMode={isEditMode}
              formData={formData}
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
                {isEditMode ? 'Editar Espaço' : 'Adicionar Espaço'}
              </DrawerTitle>
              <DrawerDescription className="dark:text-muted-foreground">
                {isEditMode
                  ? 'Atualize as informações do espaço.'
                  : 'Preencha o formulário para adicionar um espaço.'}
              </DrawerDescription>
            </DrawerHeader>
            <SpaceForm
              isEditMode={isEditMode}
              formData={formData}
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
              Tem certeza que deseja excluir o espaço{' '}
              <span className="font-semibold dark:text-foreground">
                {selectedSpace?.name}
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
              disabled={deleteSpaceMutation.isPending}
            >
              {deleteSpaceMutation.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default Spaces;
