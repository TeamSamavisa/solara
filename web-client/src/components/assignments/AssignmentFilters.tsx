import { Search } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface AssignmentFiltersProps {
  filters: {
    teacherName?: string;
    subjectName?: string;
    className?: string;
  };
  onFilterChange: (name: string, value: string) => void;
}

export const AssignmentFilters = ({
  filters,
  onFilterChange,
}: AssignmentFiltersProps) => {
  return (
    <div className="flex flex-col lg:flex-row gap-4">
      <div className="w-full lg:w-64">
        <Label htmlFor="teacherName" className="mb-2 block">
          Professor
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            id="teacherName"
            placeholder="Buscar por professor..."
            value={filters.teacherName || ''}
            onChange={(e) => onFilterChange('teacherName', e.target.value)}
            className="pl-10 w-full"
          />
        </div>
      </div>
      <div className="w-full lg:w-64">
        <Label htmlFor="subjectName" className="mb-2 block">
          Disciplina
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            id="subjectName"
            placeholder="Buscar por disciplina..."
            value={filters.subjectName || ''}
            onChange={(e) => onFilterChange('subjectName', e.target.value)}
            className="pl-10 w-full"
          />
        </div>
      </div>
      <div className="w-full lg:w-64">
        <Label htmlFor="className" className="mb-2 block">
          Turma
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            id="className"
            placeholder="Buscar por turma..."
            value={filters.className || ''}
            onChange={(e) => onFilterChange('className', e.target.value)}
            className="pl-10 w-full"
          />
        </div>
      </div>
    </div>
  );
};
