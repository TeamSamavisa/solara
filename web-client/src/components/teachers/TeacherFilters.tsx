import { Search } from '@/assets/icons';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface TeacherFiltersProps {
  filters: {
    full_name?: string;
    registration?: string;
    email?: string;
  };
  onFilterChange: (name: string, value: string) => void;
}

export const TeacherFilters = ({
  filters,
  onFilterChange,
}: TeacherFiltersProps) => {
  return (
    <div className="flex flex-col lg:flex-row gap-4">
      <div className="w-full lg:w-48">
        <Label htmlFor="registration" className="mb-2 block">
          Registro Funcional
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            id="registration"
            placeholder="Buscar por RF..."
            value={filters.registration || ''}
            onChange={(e) => onFilterChange('registration', e.target.value)}
            className="pl-10 w-full"
          />
        </div>
      </div>
      <div className="w-full lg:w-64">
        <Label htmlFor="full_name" className="mb-2 block">
          Nome
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            id="full_name"
            placeholder="Buscar por nome..."
            value={filters.full_name || ''}
            onChange={(e) => onFilterChange('full_name', e.target.value)}
            className="pl-10 w-full"
          />
        </div>
      </div>
      <div className="w-full lg:w-64">
        <Label htmlFor="email" className="mb-2 block">
          Email
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            id="email"
            placeholder="Buscar por email..."
            value={filters.email || ''}
            onChange={(e) => onFilterChange('email', e.target.value)}
            className="pl-10 w-full"
          />
        </div>
      </div>
    </div>
  );
};
