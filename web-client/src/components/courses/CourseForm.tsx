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
import type { CourseType } from '@/interfaces/course-type';

interface CourseFormProps {
  isEditMode: boolean;
  formData: {
    name: string;
    course_type_id: number | null;
  };
  course_types: CourseType[];
  onSubmit: (e: React.FormEvent) => void;
  onSelectChange: (name: string, value: string) => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isLoading?: boolean;
  isSubmitting?: boolean;
  className?: string;
}

export const CourseForm: React.FC<CourseFormProps> = ({
  isEditMode,
  formData,
  course_types,
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
          placeholder="Ex: Informática"
          required
          className="dark:bg-input dark:border-border dark:text-foreground dark:placeholder:text-muted-foreground"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="course_type_id">Tipo de Curso *</Label>
        <Select
          value={formData.course_type_id?.toString() || ''}
          onValueChange={(value) => onSelectChange('course_type_id', value)}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione um tipo de curso" />
          </SelectTrigger>
          <SelectContent>
            {course_types.map((course_type) => (
              <SelectItem
                key={course_type.id}
                value={course_type.id.toString()}
              >
                {course_type.name}
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
