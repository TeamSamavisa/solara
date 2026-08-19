import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { EyeIcon, EyeOffIcon, UserCog } from 'lucide-react';
import { useAuth } from '@/contexts/auth';
import { MainLayout } from '@/components/layouts/MainLayout';
import { useUpdateUser } from '@/hooks/mutations/mutationUsers';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();
  const updateUser = useUpdateUser();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    password: '',
    confirmPassword: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!user) return;

    // Validations
    if (!formData.full_name || !formData.email) {
      toast.error('Campos obrigatórios', {
        description: 'Nome e email são obrigatórios.',
      });
      setIsLoading(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Email inválido', {
        description: 'Por favor, insira um email válido.',
      });
      setIsLoading(false);
      return;
    }

    // Password validation
    if (formData.password && formData.password !== formData.confirmPassword) {
      toast.error('Senhas não conferem', {
        description: 'As senhas informadas não correspondem.',
      });
      setIsLoading(false);
      return;
    }

    try {
      const updates: {
        id: number;
        full_name: string;
        email: string;
        role?: 'admin' | 'principal' | 'coordinator' | 'teacher';
        registration?: string;
        password?: string;
      } = {
        id: user.id,
        full_name: formData.full_name,
        email: formData.email,
        role: user.role as 'admin' | 'principal' | 'coordinator' | 'teacher',
        registration: user.registration,
      };

      if (formData.password) {
        updates.password = formData.password;
      }

      await updateUser.mutateAsync(updates);

      toast.success('Perfil atualizado', {
        description: 'Suas informações foram atualizadas com sucesso.',
      });

      // Clear password fields
      setFormData((prev) => ({
        ...prev,
        password: '',
        confirmPassword: '',
      }));
    } catch (error) {
      toast.error('Erro ao atualizar', {
        description: 'Não foi possível atualizar seu perfil. Tente novamente.',
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (!user) {
    return (
      <MainLayout>
        <div className="flex h-full items-center justify-center">
          <p className="text-muted-foreground">
            Você precisa estar logado para acessar esta página.
          </p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-10">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <h1 className="text-3xl font-bold text-gray-100 font-playwrite">
              Perfil do Usuário
            </h1>
          </div>

          <div className="flex flex-col gap-6">
            <Card className="border border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle>Informações do Perfil</CardTitle>
                <CardDescription>
                  Gerencie suas informações pessoais
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4 mb-6">
                  <Avatar className="h-20 w-20 border-2 border-[var(--solara-900)]">
                    <AvatarFallback className="text-lg bg-[var(--solara-900)] text-white">
                      {getInitials(user.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-semibold text-xl">{user.full_name}</h2>
                    <p className="text-gray-500">{user.email}</p>
                    <p className="mt-1 text-sm capitalize bg-[var(--solara-900)] text-white px-3 py-1 rounded-full inline-block">
                      {user.role === 'admin' ? 'Administrador' : 'Professor'}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="full_name">Nome</Label>
                      <Input
                        id="full_name"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleInputChange}
                        disabled={isLoading}
                        className="focus:border-[var(--solara-900)] focus:ring-[var(--solara-900)]"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        disabled={isLoading}
                        className="focus:border-[var(--solara-900)] focus:ring-[var(--solara-900)]"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="password">Nova Senha</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Deixe em branco para manter a senha atual"
                          value={formData.password}
                          onChange={handleInputChange}
                          disabled={isLoading}
                          className="pr-10 focus:border-[var(--solara-900)] focus:ring-[var(--solara-900)]"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                          onClick={() => setShowPassword(!showPassword)}
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <EyeOffIcon className="h-4 w-4" />
                          ) : (
                            <EyeIcon className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="confirmPassword">
                        Confirmar Nova Senha
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirme a nova senha"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          disabled={isLoading}
                          className="pr-10 focus:border-[var(--solara-900)] focus:ring-[var(--solara-900)]"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          tabIndex={-1}
                        >
                          {showConfirmPassword ? (
                            <EyeOffIcon className="h-4 w-4" />
                          ) : (
                            <EyeIcon className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Button
                      type="submit"
                      className="bg-[var(--solara-900)] hover:bg-[var(--solara-800)] transition-colors w-full sm:w-auto text-white"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Atualizando...
                        </>
                      ) : (
                        <>
                          <UserCog className="mr-2 h-4 w-4" />
                          Atualizar Perfil
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Profile;
