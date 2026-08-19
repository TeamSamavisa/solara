import React from 'react';
import { cn } from '@/lib/utils';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

interface TeacherFormProps {
  isEditMode: boolean;
  formData: {
    registration?: string;
    full_name: string;
    email: string;
    password?: string;
    role?: 'admin' | 'principal' | 'coordinator' | 'teacher';
  };
  onSubmit: (e: React.FormEvent) => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRoleChange?: (value: string) => void;
  isSubmitting?: boolean;
  className?: string;
  showRoleSelect?: boolean;
}

export const TeacherForm: React.FC<TeacherFormProps> = ({
  isEditMode,
  formData,
  onSubmit,
  onChange,
  onRoleChange,
  isSubmitting = false,
  className,
  showRoleSelect = false,
}) => {
  return (
    <form
      onSubmit={onSubmit}
      className={cn('grid items-start gap-4', className)}
    >
      <div className="grid gap-2">
        <Label htmlFor="registration" className="dark:text-foreground">
          Registro Funcional
        </Label>
        <Input
          id="registration"
          name="registration"
          value={formData.registration || ''}
          onChange={onChange}
          placeholder="Ex: RF123456"
          className="dark:bg-input dark:border-border dark:text-foreground dark:placeholder:text-muted-foreground"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="full_name" className="dark:text-foreground">
          Nome Completo *
        </Label>
        <Input
          id="full_name"
          name="full_name"
          value={formData.full_name}
          onChange={onChange}
          placeholder="Ex: João da Silva"
          required
          className="dark:bg-input dark:border-border dark:text-foreground dark:placeholder:text-muted-foreground"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email" className="dark:text-foreground">
          Email *
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={onChange}
          placeholder="Ex: professor@escola.edu"
          required
          className="dark:bg-input dark:border-border dark:text-foreground dark:placeholder:text-muted-foreground"
        />
      </div>
      {showRoleSelect && (
        <div className="grid gap-2">
          <Label htmlFor="role" className="dark:text-foreground">
            Cargo *
          </Label>
          <Select
            value={formData.role || 'teacher'}
            onValueChange={onRoleChange}
          >
            <SelectTrigger className="dark:bg-input dark:border-border dark:text-foreground">
              <SelectValue placeholder="Selecione o cargo" />
            </SelectTrigger>
            <SelectContent className="dark:bg-popover dark:border-border">
              <SelectItem value="teacher" className="dark:text-foreground">
                Professor
              </SelectItem>
              <SelectItem value="coordinator" className="dark:text-foreground">
                Coordenador
              </SelectItem>
              <SelectItem value="principal" className="dark:text-foreground">
                Diretor
              </SelectItem>
              <SelectItem value="admin" className="dark:text-foreground">
                Administrador
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      {!isEditMode && (
        <div className="grid gap-2">
          <Label htmlFor="password" className="dark:text-foreground">
            Senha {showRoleSelect && '(Opcional - será gerada automaticamente)'}
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            value={formData.password || ''}
            onChange={onChange}
            placeholder={
              showRoleSelect
                ? 'Deixe em branco para gerar senha automática'
                : 'Digite uma senha'
            }
            required={!isEditMode && !showRoleSelect}
            minLength={6}
            className="dark:bg-input dark:border-border dark:text-foreground dark:placeholder:text-muted-foreground"
          />
          {showRoleSelect && (
            <p className="text-xs text-muted-foreground">
              Se deixar em branco, uma senha aleatória de 8 caracteres será
              gerada e exibida após a criação
            </p>
          )}
        </div>
      )}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-2">
        <Button
          type="submit"
          className="bg-[var(--solara-800)] hover:bg-[var(--solara-700)] dark:bg-primary dark:hover:bg-primary/90 dark:text-primary-foreground transition-colors"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? 'Salvando...'
            : isEditMode
              ? 'Atualizar'
              : 'Adicionar'}
        </Button>
      </div>
    </form>
  );
};
