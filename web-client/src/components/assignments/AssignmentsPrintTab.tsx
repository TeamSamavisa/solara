import React from 'react';
import { Calendar } from '@/assets/icons';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Course } from '@/interfaces/course';
import type { Shift } from '@/interfaces/shift';
import type { ClassGroup } from '@/interfaces/class-group';

const WEEKDAYS = [
  { key: 'monday', label: 'Segunda-feira' },
  { key: 'tuesday', label: 'Terça-feira' },
  { key: 'wednesday', label: 'Quarta-feira' },
  { key: 'thursday', label: 'Quinta-feira' },
  { key: 'friday', label: 'Sexta-feira' },
  { key: 'saturday', label: 'Sábado' },
];

interface AssignmentsPrintTabProps {
  courses: Course[] | undefined;
  classGroups: ClassGroup[] | undefined;
  shifts: Shift[] | undefined;
  selectedCourseId: string;
  selectedClassGroupId: string;
  selectedShiftId: string;
  selectedCourse: Course | undefined;
  selectedShift: Shift | undefined;
  timeSlots: string[];
  timetableData: Record<
    string,
    Record<
      string,
      Array<{
        subject: string;
        teacher: string;
        space: string;
        classGroup: string;
        violatesAvailability: boolean;
      }>
    >
  >;
  isLoadingCourses: boolean;
  isLoadingClassGroups: boolean;
  isLoadingShifts: boolean;
  isLoadingAssignments: boolean;
  onCourseChange: (value: string) => void;
  onClassGroupChange: (value: string) => void;
  onShiftChange: (value: string) => void;
  onPrint: () => void;
}

export const AssignmentsPrintTab: React.FC<AssignmentsPrintTabProps> = ({
  courses,
  classGroups,
  shifts,
  selectedCourseId,
  selectedClassGroupId,
  selectedShiftId,
  selectedCourse,
  selectedShift,
  timeSlots,
  timetableData,
  isLoadingCourses,
  isLoadingClassGroups,
  isLoadingShifts,
  isLoadingAssignments,
  onCourseChange,
  onClassGroupChange,
  onShiftChange,
  onPrint,
}) => {
  // Filter class groups based on selected course
  const filteredClassGroups = React.useMemo(() => {
    if (!selectedCourseId || !classGroups) return [];
    return classGroups.filter(
      (classGroup) =>
        classGroup.course_id === parseInt(selectedCourseId) ||
        classGroup.course?.id === parseInt(selectedCourseId),
    );
  }, [selectedCourseId, classGroups]);
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 print:hidden">
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Curso *
          </label>
          <Select value={selectedCourseId} onValueChange={onCourseChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione um curso" />
            </SelectTrigger>
            <SelectContent>
              {isLoadingCourses ? (
                <SelectItem value="loading" disabled>
                  Carregando...
                </SelectItem>
              ) : (
                courses?.map((course) => (
                  <SelectItem key={course.id} value={course.id.toString()}>
                    {course.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Turma *
          </label>
          <Select
            value={selectedClassGroupId}
            onValueChange={onClassGroupChange}
            disabled={!selectedCourseId}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione uma turma" />
            </SelectTrigger>
            <SelectContent>
              {isLoadingClassGroups ? (
                <SelectItem value="loading" disabled>
                  Carregando...
                </SelectItem>
              ) : filteredClassGroups.length === 0 ? (
                <SelectItem value="empty" disabled>
                  Nenhuma turma disponível
                </SelectItem>
              ) : (
                filteredClassGroups.map((classGroup) => (
                  <SelectItem
                    key={classGroup.id}
                    value={classGroup.id.toString()}
                  >
                    {classGroup.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Turno (Opcional)
          </label>
          <Select
            value={selectedShiftId || undefined}
            onValueChange={onShiftChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Todos os turnos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os turnos</SelectItem>
              {isLoadingShifts ? (
                <SelectItem value="loading" disabled>
                  Carregando...
                </SelectItem>
              ) : (
                shifts?.map((shift) => (
                  <SelectItem key={shift.id} value={shift.id.toString()}>
                    {shift.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end">
          <Button
            onClick={onPrint}
            disabled={
              !selectedCourseId || !selectedClassGroupId || isLoadingAssignments
            }
            className="w-full bg-[var(--solara-800)] hover:bg-[var(--solara-700)] dark:bg-primary dark:hover:bg-primary/90 transition-colors"
          >
            Imprimir Grade
          </Button>
        </div>
      </div>

      {selectedCourseId && selectedClassGroupId && (
        <>
          <div className="mb-6 printable-header">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              {selectedCourse?.name} -{' '}
              {
                filteredClassGroups.find(
                  (cg) => cg.id === parseInt(selectedClassGroupId),
                )?.name
              }
              {selectedShift && selectedShift.name !== 'Todos os turnos'
                ? ` - ${selectedShift.name}`
                : ''}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Grade Horária - {new Date().getFullYear()}
            </p>
          </div>

          {isLoadingAssignments ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                Carregando alocações...
              </p>
            </div>
          ) : timeSlots.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                Nenhuma alocação encontrada para este curso.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto printable-table">
              <Table className="min-w-full border-collapse">
                <TableHeader>
                  <TableRow>
                    <TableHead className="border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 font-bold text-center text-[10px] p-1 w-20">
                      Horário
                    </TableHead>
                    {WEEKDAYS.map((day) => (
                      <TableHead
                        key={day.key}
                        className="border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 font-bold text-center text-[10px] p-1 w-32"
                      >
                        {day.label}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timeSlots.map((slot) => (
                    <TableRow key={slot}>
                      <TableCell className="border border-gray-300 dark:border-gray-600 font-semibold text-center bg-gray-50 dark:bg-gray-800/50 whitespace-nowrap text-[9px] p-1 w-20">
                        {slot}
                      </TableCell>
                      {WEEKDAYS.map((day) => (
                        <TableCell
                          key={day.key}
                          className="border border-gray-300 dark:border-gray-600 p-0.5 align-top w-32 max-w-[128px] text-[9px]"
                        >
                          {timetableData[day.key]?.[slot]?.map((item, idx) => (
                            <div
                              key={idx}
                              className={`mb-0.5 last:mb-0 p-1 rounded text-[10px] text-wrap ${
                                item.violatesAvailability
                                  ? 'bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700'
                                  : 'bg-blue-50 dark:bg-blue-900/20'
                              }`}
                            >
                              <div className="font-semibold text-gray-800 dark:text-gray-200 mb-0.5 text-[10px] leading-tight">
                                {item.subject}
                              </div>
                              <div className="text-gray-600 dark:text-gray-400 text-[10px] leading-tight">
                                {item.teacher}
                              </div>
                              <div className="text-gray-600 dark:text-gray-400 text-[10px] leading-tight">
                                {item.space}
                              </div>
                              {item.violatesAvailability && (
                                <div className="text-red-600 dark:text-red-400 text-[10px] leading-tight mt-0.5 font-medium">
                                  ⚠ Viola disponibilidade
                                </div>
                              )}
                            </div>
                          ))}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}

      {(!selectedCourseId || !selectedClassGroupId) && (
        <div className="text-center py-12">
          <Calendar className="size-16 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400">
            {!selectedCourseId
              ? 'Selecione um curso e uma turma para visualizar a grade horária'
              : 'Selecione uma turma para visualizar a grade horária'}
          </p>
        </div>
      )}
    </div>
  );
};
