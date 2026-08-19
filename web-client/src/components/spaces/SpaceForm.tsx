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
import type { SpaceType } from '@/interfaces/space-type';

interface SpaceFormProps {
  isEditMode: boolean;
  formData: {
    name: string;
    floor: number;
    capacity: number;
    blocked: boolean | null;
    space_type_id: number | null;
  };
  space_types: SpaceType[];
  onSubmit: (e: React.FormEvent) => void;
  onSelectChange: (name: string, value: string) => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isLoading?: boolean;
  isSubmitting?: boolean;
  className?: string;
}

export const SpaceForm: React.FC<SpaceFormProps> = ({
  isEditMode,
  formData,
  space_types,
  onSubmit,
  onSelectChange,
  onChange,
  isSubmitting = false,
  className,
  isLoading,
}) => {
  return (
    <form
      onSubmit={onSubmit}
      className={cn('grid items-start gap-4', className)}
    >
      <div className="grid gap-2">
        <Label htmlFor="name" className="dark:text-foreground">
          Nome *
        </Label>
        <Input
          id="name"
          name="name"
          value={formData.name || ''}
          onChange={onChange}
          placeholder="Ex: Lab 1"
          required
          className="dark:bg-input dark:border-border dark:text-foreground dark:placeholder:text-muted-foreground"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="floor" className="dark:text-foreground">
          Andar/Piso *
        </Label>
        <Input
          type="number"
          id="floor"
          name="floor"
          value={formData.floor === 0 ? '' : formData.floor}
          onChange={onChange}
          placeholder="Ex: 1"
          required
          className="dark:bg-input dark:border-border dark:text-foreground dark:placeholder:text-muted-foreground"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="capacity" className="dark:text-foreground">
          Capacidade *
        </Label>
        <Input
          type="number"
          id="capacity"
          name="capacity"
          value={formData.capacity === 0 ? '' : formData.capacity}
          onChange={onChange}
          placeholder="Ex: 40"
          required
          className="dark:bg-input dark:border-border dark:text-foreground dark:placeholder:text-muted-foreground"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="blocked">Bloqueado? *</Label>
        <Select
          value={
            formData.blocked === null ? '' : formData.blocked ? 'true' : 'false'
          }
          onValueChange={(value) => onSelectChange('blocked', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione uma opção" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Sim</SelectItem>
            <SelectItem value="false">Não</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="space_type_id">Tipo de Espaço *</Label>
        <Select
          value={formData.space_type_id?.toString() || ''}
          onValueChange={(value) => onSelectChange('space_type_id', value)}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione um tipo de espaço" />
          </SelectTrigger>
          <SelectContent>
            {space_types.map((space_type) => (
              <SelectItem key={space_type.id} value={space_type.id.toString()}>
                {space_type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
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
