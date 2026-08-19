import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, X } from 'lucide-react';
import type { Subject } from '@/interfaces/subject';
import type { Space } from '@/interfaces/space';
import type { Schedule } from '@/interfaces/schedule';
import type { User } from '@/interfaces/user';
import type { ClassGroup } from '@/interfaces/class-group';

interface AssignmentFormProps {
  isEditMode: boolean;
  formData: {
    teacher_id: number | null;
    subject_id: number | null;
    schedule_ids: number[];
    space_id: number | null;
    class_group_id: number | null;
    duration: number;
  };
  subjects: Subject[];
  schedules: Schedule[];
  spaces: Space[];
  teachers: User[];
  classGroups: ClassGroup[];
  onSubmit: (e: React.FormEvent) => void;
  onSelectChange: (name: string, value: string) => void;
  onScheduleToggle: (scheduleId: number) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export const AssignmentForm = ({
  isEditMode,
  formData,
  subjects,
  schedules,
  spaces,
  teachers,
  classGroups,
  onSubmit,
  onSelectChange,
  onScheduleToggle,
  onClose,
  isLoading,
}: AssignmentFormProps) => {
  const translateWeekDay = (weekday: string) => {
    const days: Record<string, string> = {
      monday: 'Segunda',
      tuesday: 'Terça',
      wednesday: 'Quarta',
      thursday: 'Quinta',
      friday: 'Sexta',
      saturday: 'Sábado',
      sunday: 'Domingo',
    };
    return days[weekday.toLowerCase()] || weekday;
  };

  const getSelectedSchedules = () => {
    return schedules.filter((s) => formData.schedule_ids.includes(s.id));
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <DialogHeader>
        <DialogTitle>
          {isEditMode ? 'Editar Alocação' : 'Nova Alocação'}
        </DialogTitle>
        <DialogDescription>
          {isEditMode
            ? 'Edite os detalhes da alocação'
            : 'Preencha os dados para criar uma nova alocação'}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        {/* Teacher */}
        <div className="grid gap-2">
          <Label htmlFor="teacher_id">Professor*</Label>
          <Select
            value={formData.teacher_id?.toString() || ''}
            onValueChange={(value) => onSelectChange('teacher_id', value)}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um professor" />
            </SelectTrigger>
            <SelectContent>
              {teachers.map((teacher) => (
                <SelectItem key={teacher.id} value={teacher.id.toString()}>
                  {teacher.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Subject */}
        <div className="grid gap-2">
          <Label htmlFor="subject_id">Disciplina*</Label>
          <Select
            value={formData.subject_id?.toString() || ''}
            onValueChange={(value) => onSelectChange('subject_id', value)}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma disciplina" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id.toString()}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Schedules */}
        <div className="grid gap-2">
          <Label>Horários</Label>
          <div className="border rounded-md p-3 max-h-60 overflow-y-auto space-y-2">
            {schedules.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum horário disponível
              </p>
            ) : (
              schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="flex items-center space-x-2 py-1"
                >
                  <Checkbox
                    id={`schedule-${schedule.id}`}
                    checked={formData.schedule_ids.includes(schedule.id)}
                    onCheckedChange={() => onScheduleToggle(schedule.id)}
                    disabled={isLoading}
                  />
                  <label
                    htmlFor={`schedule-${schedule.id}`}
                    className="text-sm cursor-pointer flex-1"
                  >
                    {translateWeekDay(schedule.weekday)}:{' '}
                    {schedule.start_time.slice(0, 5)} -{' '}
                    {schedule.end_time.slice(0, 5)}
                  </label>
                </div>
              ))
            )}
          </div>
          {getSelectedSchedules().length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {getSelectedSchedules().map((schedule) => (
                <div
                  key={schedule.id}
                  className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-xs"
                >
                  <span>
                    {translateWeekDay(schedule.weekday)}:{' '}
                    {schedule.start_time.slice(0, 5)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onScheduleToggle(schedule.id)}
                    disabled={isLoading}
                    className="hover:bg-primary/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Space */}
        <div className="grid gap-2">
          <Label htmlFor="space_id">Espaço</Label>
          <Select
            value={formData.space_id?.toString() || ''}
            onValueChange={(value) => onSelectChange('space_id', value)}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um espaço" />
            </SelectTrigger>
            <SelectContent>
              {spaces.map((space) => (
                <SelectItem key={space.id} value={space.id.toString()}>
                  {space.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Class Group */}
        <div className="grid gap-2">
          <Label htmlFor="class_group_id">Turma*</Label>
          <Select
            value={formData.class_group_id?.toString() || ''}
            onValueChange={(value) => onSelectChange('class_group_id', value)}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma turma" />
            </SelectTrigger>
            <SelectContent>
              {classGroups.map((classGroup) => (
                <SelectItem
                  key={classGroup.id}
                  value={classGroup.id.toString()}
                >
                  {classGroup.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Duration */}
        <div className="grid gap-2">
          <Label htmlFor="duration">Duração (horas)*</Label>
          <Select
            value={formData.duration?.toString() || '2'}
            onValueChange={(value) => onSelectChange('duration', value)}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a duração" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 hora</SelectItem>
              <SelectItem value="2">2 horas</SelectItem>
              <SelectItem value="3">3 horas</SelectItem>
              <SelectItem value="4">4 horas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          className="bg-red-900 hover:bg-red-800"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditMode ? 'Salvando...' : 'Criando...'}
            </>
          ) : isEditMode ? (
            'Salvar'
          ) : (
            'Criar'
          )}
        </Button>
      </DialogFooter>
    </form>
  );
};
