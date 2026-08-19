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
import { Return, Users } from '@/assets/icons';
import { TeacherFilters } from '@/components/teachers/TeacherFilters';
import { TeachersList } from '@/components/teachers/TeachersList';
import { TeachersPagination } from '@/components/teachers/TeachersPagination';
import { TeacherForm } from '@/components/teachers/TeacherForm';
import { TeacherAvailabilityDialog } from '@/components/teachers/TeacherAvailabilityDialog';
import { MainLayout } from '@/components/layouts/MainLayout';
import { useUsers } from '@/hooks/queries/useUsers';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import {
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
} from '@/hooks/mutations/mutationUsers';
import type { User } from '@/interfaces/user';
import type { CreateUser } from '@/interfaces/user/create-user';
import type { UpdateUser } from '@/interfaces/user/update-user';
import type { UserQuery } from '@/interfaces/user/user-query';

const INITIAL_FORM_DATA: CreateUser = {
  full_name: '',
  email: '',
  password: '',
  registration: '',
  role: 'teacher',
};

const UsersPage = () => {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAvailabilityDialogOpen, setIsAvailabilityDialogOpen] =
    useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<CreateUser>(INITIAL_FORM_DATA);

  // Filters and pagination
  const [filters, setFilters] = useState<UserQuery>({
    page: 1,
    limit: 10,
    full_name: '',
    registration: '',
    email: '',
  });

  // Debounce for filters
  const [debouncedFilters, setDebouncedFilters] = useState<UserQuery>(filters);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 500);

    return () => clearTimeout(timer);
  }, [filters]);

  // Queries and mutations
  const { data, isLoading } = useUsers(debouncedFilters);
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();

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
    setSelectedUser(null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setIsEditMode(false);
    setFormData(INITIAL_FORM_DATA);
    setSelectedUser(null);
  };

  const handleEdit = (user: User) => {
    setIsEditMode(true);
    setSelectedUser(user);
    setFormData({
      full_name: user.full_name,
      email: user.email,
      registration: user.registration || '',
      password: '',
      role: user.role as 'admin' | 'principal' | 'coordinator' | 'teacher',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleViewAvailability = (user: User) => {
    setSelectedUser(user);
    setIsAvailabilityDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;

    try {
      await deleteUserMutation.mutateAsync(selectedUser.id);
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error(error);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRoleChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      role: value as 'admin' | 'principal' | 'coordinator' | 'teacher',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.full_name.trim() || !formData.email.trim()) {
      toast.error('Erro', {
        description: 'Nome e email são obrigatórios',
      });
      return;
    }

    try {
      if (isEditMode && selectedUser) {
        const updateData: UpdateUser = {
          id: selectedUser.id,
          full_name: formData.full_name,
          email: formData.email,
          registration: formData.registration || undefined,
          role: formData.role,
        };

        if (formData.password && formData.password.trim()) {
          updateData.password = formData.password;
        }

        await updateUserMutation.mutateAsync(updateData);
      } else {
        const createData: CreateUser = {
          full_name: formData.full_name,
          email: formData.email,
          password: formData.password || undefined,
          registration: formData.registration || undefined,
          role: formData.role || 'teacher',
        };

        const result = await createUserMutation.mutateAsync(createData);

        // Show temporary password if generated
        if (
          result &&
          typeof result === 'object' &&
          'temporaryPassword' in result
        ) {
          const tempPassword = (result as { temporaryPassword: string })
            .temporaryPassword;
          toast.info('Senha temporária gerada', {
            description: `Senha: ${tempPassword}`,
            duration: 10000,
          });
        }
      }

      handleCloseDialog();
    } catch (error) {
      console.error(error);
    }
  };

  const isSubmitting =
    createUserMutation.isPending || updateUserMutation.isPending;

  return (
    <MainLayout requireAdmin={true}>
      <div className="space-y-6">
        <div className="flex gap-6 items-center">
          <Link to="/dashboard">
            <Return className="size-10 text-gray-100 dark:text-gray-200 hover:-translate-x-1 transition-transform" />
          </Link>
          <div>
            <h1 className="flex items-center gap-6 text-3xl font-bold text-gray-100 dark:text-gray-50 font-playwrite">
              <Users className="size-8" /> Usuários
            </h1>
            <p className="text-gray-50 dark:text-gray-300 mt-3">
              Gerenciar todos os usuários do sistema
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-card rounded-lg p-4 shadow-sm dark:shadow-lg border dark:border-border transition-colors">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center mb-4 lg:justify-between">
            <div className="w-full lg:w-auto">
              <TeacherFilters
                filters={filters}
                onFilterChange={handleFilterChange}
              />
            </div>

            <div className="flex items-center justify-between lg:justify-start gap-4 w-full lg:w-auto">
              <Button
                onClick={handleOpenDialog}
                className="bg-[var(--solara-800)] hover:bg-[var(--solara-700)] dark:bg-primary dark:hover:bg-primary/90 transition-colors"
              >
                Adicionar Usuário
              </Button>
            </div>
          </div>

          <TeachersList
            teachers={data?.content || []}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onViewAvailability={handleViewAvailability}
            isLoading={isLoading}
          />

          {data?.pagination && (
            <TeachersPagination
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

      {isDesktop ? (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="dark:text-foreground">
                {isEditMode ? 'Editar Usuário' : 'Adicionar Usuário'}
              </DialogTitle>
              <DialogDescription className="dark:text-muted-foreground">
                {isEditMode
                  ? 'Atualize as informações do usuário.'
                  : 'Preencha o formulário para adicionar um usuário.'}
              </DialogDescription>
            </DialogHeader>
            <TeacherForm
              isEditMode={isEditMode}
              formData={formData}
              onSubmit={handleSubmit}
              onChange={handleFormChange}
              onRoleChange={handleRoleChange}
              isSubmitting={isSubmitting}
              showRoleSelect={true}
            />
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DrawerContent>
            <DrawerHeader className="text-left">
              <DrawerTitle className="dark:text-foreground">
                {isEditMode ? 'Editar Usuário' : 'Adicionar Usuário'}
              </DrawerTitle>
              <DrawerDescription className="dark:text-muted-foreground">
                {isEditMode
                  ? 'Atualize as informações do usuário.'
                  : 'Preencha o formulário para adicionar um usuário.'}
              </DrawerDescription>
            </DrawerHeader>
            <TeacherForm
              isEditMode={isEditMode}
              formData={formData}
              onSubmit={handleSubmit}
              onChange={handleFormChange}
              onRoleChange={handleRoleChange}
              isSubmitting={isSubmitting}
              showRoleSelect={true}
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

      {/* User Availability Dialog */}
      <TeacherAvailabilityDialog
        teacher={selectedUser}
        isOpen={isAvailabilityDialogOpen}
        onClose={() => {
          setIsAvailabilityDialogOpen(false);
          setSelectedUser(null);
        }}
        isDesktop={isDesktop}
        allowEdit={true}
      />

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
              Tem certeza que deseja excluir o usuário{' '}
              <span className="font-semibold dark:text-foreground">
                {selectedUser?.full_name}
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
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default UsersPage;
