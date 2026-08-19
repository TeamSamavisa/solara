import React from 'react';
import { cn } from '@/lib/utils';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

interface ShiftFormProps {
  isEditMode: boolean;
  formData: {
    name: string;
  };
  onSubmit: (e: React.FormEvent) => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isSubmitting?: boolean;
  className?: string;
}

export const ShiftForm: React.FC<ShiftFormProps> = ({
  isEditMode,
  formData,
  onSubmit,
  onChange,
  isSubmitting = false,
  className,
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
          placeholder="Ex: Manhã"
          required
          className="dark:bg-input dark:border-border dark:text-foreground dark:placeholder:text-muted-foreground"
        />
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
