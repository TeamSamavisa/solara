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
import type { Shift } from '@/interfaces/shift';
import type { Course } from '@/interfaces/course';

interface ClassGroupFormProps {
  isEditMode: boolean;
  formData: {
    name: string;
    semester: string;
    module: string;
    student_count: number;
    shift_id: number | null;
    course_id: number | null;
  };
  shifts: Shift[];
  courses: Course[];
  onSubmit: (e: React.FormEvent) => void;
  onSelectChange: (name: string, value: string) => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isLoading?: boolean;
  isSubmitting?: boolean;
  className?: string;
}

export const ClassGroupForm: React.FC<ClassGroupFormProps> = ({
  isEditMode,
  formData,
  shifts,
  courses,
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
          placeholder="Ex: Turma ADS Módulo 1"
          required
          className="dark:bg-input dark:border-border dark:text-foreground dark:placeholder:text-muted-foreground"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="semester" className="dark:text-foreground">
          Semestre *
        </Label>
        <Input
          id="semester"
          name="semester"
          value={formData.semester || ''}
          onChange={onChange}
          placeholder="Ex: 1º semestre"
          required
          className="dark:bg-input dark:border-border dark:text-foreground dark:placeholder:text-muted-foreground"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="module" className="dark:text-foreground">
          Módulo *
        </Label>
        <Input
          id="module"
          name="module"
          value={formData.module || ''}
          onChange={onChange}
          placeholder="Ex: Módulo 1"
          required
          className="dark:bg-input dark:border-border dark:text-foreground dark:placeholder:text-muted-foreground"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="student_count" className="dark:text-foreground">
          Nº de Alunos *
        </Label>
        <Input
          type="number"
          id="student_count"
          name="student_count"
          value={formData.student_count === 0 ? '' : formData.student_count}
          onChange={onChange}
          placeholder="Ex: 40"
          required
          className="dark:bg-input dark:border-border dark:text-foreground dark:placeholder:text-muted-foreground"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="shift_id">Turno *</Label>
        <Select
          value={formData.shift_id?.toString() || ''}
          onValueChange={(value) => onSelectChange('shift_id', value)}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione um turno" />
          </SelectTrigger>
          <SelectContent>
            {shifts.map((shift) => (
              <SelectItem key={shift.id} value={shift.id.toString()}>
                {shift.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="course_id">Curso *</Label>
        <Select
          value={formData.course_id?.toString() || ''}
          onValueChange={(value) => onSelectChange('course_id', value)}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione um curso" />
          </SelectTrigger>
          <SelectContent>
            {courses.map((course) => (
              <SelectItem key={course.id} value={course.id.toString()}>
                {course.name}
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
