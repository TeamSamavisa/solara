import { Search } from '@/assets/icons';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface SchedulesProps {
  filters: {
    weekday?: string;
  };
  onFilterChange: (name: string, value: string) => void;
}

export const SchedulesFilters = ({
  filters,
  onFilterChange,
}: SchedulesProps) => {
  return (
    <div className="flex flex-col lg:flex-row gap-4">
      <div className="w-full lg:w-64">
        <Label htmlFor="name" className="mb-2 block">
          Dia da Semana
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            id="weekday"
            placeholder="Buscar por dia da semana..."
            value={filters.weekday || ''}
            onChange={(e) => onFilterChange('weekday', e.target.value)}
            className="pl-10 w-full"
          />
        </div>
      </div>
    </div>
  );
};
