import { Button } from '@/components/ui/button';
import { Check } from '@/assets/icons';
import type { Schedule } from '@/interfaces/schedule';

interface AvailabilityGridProps {
  weekday: string;
  schedules: Schedule[];
  selectedScheduleIds: Set<number>;
  onToggleSchedule: (scheduleId: number) => void;
  disabled?: boolean;
}

export const AvailabilityGrid = ({
  weekday,
  schedules,
  selectedScheduleIds,
  onToggleSchedule,
  disabled = false,
}: AvailabilityGridProps) => {
  if (schedules.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
        {weekday}
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
        {schedules.map((schedule) => {
          const isSelected = selectedScheduleIds.has(schedule.id);
          return (
            <Button
              key={schedule.id}
              onClick={() => onToggleSchedule(schedule.id)}
              disabled={disabled}
              variant={isSelected ? 'default' : 'outline'}
              className={`
                relative h-auto py-3 px-4 flex flex-col items-center justify-center
                transition-all duration-200 hover:scale-105
                ${
                  isSelected
                    ? 'bg-[var(--solara-800)] hover:bg-[var(--solara-700)] dark:bg-primary dark:hover:bg-primary/90 text-white shadow-md'
                    : 'bg-white dark:bg-card hover:bg-gray-50 dark:hover:bg-card/80 border-2 border-gray-300 dark:border-border text-gray-900 dark:text-gray-100'
                }
              `}
            >
              {isSelected && (
                <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1 shadow-md">
                  <Check className="size-3 text-white" />
                </div>
              )}
              <span className="text-sm font-semibold">
                {schedule.start_time.slice(0, 5)}
              </span>
              <span className="text-xs opacity-80">até</span>
              <span className="text-sm font-semibold">
                {schedule.end_time.slice(0, 5)}
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
};
