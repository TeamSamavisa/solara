import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router';
import { Calendar, Return } from '@/assets/icons';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MainLayout } from '@/components/layouts/MainLayout';
import { useRole } from '@/hooks/useRole';
import { AssignmentsListTab } from '@/components/assignments/AssignmentsListTab';
import { AssignmentsOptimizeTab } from '@/components/assignments/AssignmentsOptimizeTab';
import { AssignmentsPrintTab } from '@/components/assignments/AssignmentsPrintTab';
import { AssignmentForm } from '@/components/assignments/AssignmentForm';
import { useAssignments } from '@/hooks/queries/useAssignments';
import { useSubjects } from '@/hooks/queries/useSubjects';
import { useSchedules } from '@/hooks/queries/useSchedules';
import { useSpaces } from '@/hooks/queries/useSpaces';
import { useUsers } from '@/hooks/queries/useUsers';
import { useClassGroups } from '@/hooks/queries/useClassGroups';
import { useCourses } from '@/hooks/queries/useCourses';
import { useShifts } from '@/hooks/queries/useShifts';
import { useOptimizeTimetable } from '@/hooks/mutations/mutationAssignments';
import { useLastTask } from '@/hooks/queries/useTasks';
import {
  useCreateAssignment,
  useUpdateAssignment,
  useDeleteAssignment,
} from '@/hooks/mutations/mutationAssignments';
import type {
  Assignment,
  AssignmentQuery,
  CreateAssignment,
} from '@/interfaces/assignment';

const INITIAL_FORM_DATA: {
  teacher_id: number | null;
  subject_id: number | null;
  schedule_ids: number[];
  space_id: number | null;
  class_group_id: number | null;
  duration: number;
} = {
  teacher_id: null,
  subject_id: null,
  schedule_ids: [],
  space_id: null,
  class_group_id: null,
  duration: 2,
};

const Assignments = () => {
  const { hasRole, isAdmin } = useRole();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);
  const [formData, setFormData] =
    useState<typeof INITIAL_FORM_DATA>(INITIAL_FORM_DATA);

  // Select filters for print tab
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedClassGroupId, setSelectedClassGroupId] = useState<string>('');
  const [selectedShiftId, setSelectedShiftId] = useState<string>('');

  // Filters and pagination
  const [filters, setFilters] = useState<AssignmentQuery>({
    page: 1,
    limit: 10,
  });

  // debounce for the filters
  const [debouncedFilters, setDebouncedFilters] =
    useState<AssignmentQuery>(filters);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 500);

    return () => clearTimeout(timer);
  }, [filters]);

  // Queries and mutations
  const { data: assignmentsData, isLoading } = useAssignments(debouncedFilters);
  const { data: assignmentsDataFull, isLoading: isLoadingAssignmentsFull } =
    useAssignments({ limit: 100 });
  const { data: subjectsData } = useSubjects({ limit: 10 });
  const { data: schedulesData } = useSchedules({ limit: 10 });
  const { data: spacesData } = useSpaces({ limit: 10 });
  const { data: teachersData } = useUsers({ limit: 10 });
  const { data: classGroupsData } = useClassGroups({ limit: 10 });
  const { data: coursesData, isLoading: isLoadingCourses } = useCourses({
    limit: 100,
  });
  const { data: shiftsData, isLoading: isLoadingShifts } = useShifts({
    limit: 100,
  });

  // Mutation for optimization
  const { mutate: optimizeTimetable, isPending } = useOptimizeTimetable();
  const { data: lastTask } = useLastTask();

  const createMutation = useCreateAssignment();
  const updateMutation = useUpdateAssignment();
  const deleteMutation = useDeleteAssignment();

  const isProcessing = isPending || lastTask?.status === 'PROCESSING';

  const handleFilterChange = (name: string, value: string) => {
    setFilters((prev: AssignmentQuery) => ({
      ...prev,
      [name]: value,
      page: 1,
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev: AssignmentQuery) => ({
      ...prev,
      page,
    }));
  };

  const handleOpenDialog = () => {
    setIsEditMode(false);
    setFormData(INITIAL_FORM_DATA);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setFormData(INITIAL_FORM_DATA);
    setSelectedAssignment(null);
  };

  const handleEdit = (assignment: Assignment) => {
    setIsEditMode(true);
    setSelectedAssignment(assignment);
    setFormData({
      teacher_id: assignment.teacher_id,
      subject_id: assignment.subject_id,
      schedule_ids: assignment.schedules?.map((s) => s.id) || [],
      space_id: assignment.space_id,
      class_group_id: assignment.class_group_id,
      duration: assignment.duration || 2,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!selectedAssignment) return;
    deleteMutation.mutate(selectedAssignment.id);
    setIsDeleteDialogOpen(false);
    setSelectedAssignment(null);
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: parseInt(value),
    }));
  };

  const handleScheduleToggle = (scheduleId: number) => {
    setFormData((prev) => {
      const isSelected = prev.schedule_ids.includes(scheduleId);
      return {
        ...prev,
        schedule_ids: isSelected
          ? prev.schedule_ids.filter((id) => id !== scheduleId)
          : [...prev.schedule_ids, scheduleId],
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.teacher_id ||
      !formData.subject_id ||
      !formData.class_group_id
    ) {
      return;
    }

    const assignmentData: CreateAssignment = {
      teacher_id: formData.teacher_id,
      subject_id: formData.subject_id,
      schedule_ids:
        formData.schedule_ids.length > 0 ? formData.schedule_ids : undefined,
      space_id: formData.space_id || null,
      class_group_id: formData.class_group_id,
      duration: formData.duration,
    };

    if (isEditMode && selectedAssignment) {
      updateMutation.mutate(
        { id: selectedAssignment.id, ...assignmentData },
        {
          onSuccess: () => {
            handleCloseDialog();
          },
        },
      );
    } else {
      createMutation.mutate(assignmentData, {
        onSuccess: () => {
          handleCloseDialog();
        },
      });
    }
  };

  // Functions and logic for optimization tab
  const handleOptimize = () => {
    optimizeTimetable();
  };

  // Functions and logic for print tab
  const formatTime = (time: string) => {
    return time.substring(0, 5);
  };

  const filteredAssignments = useMemo(() => {
    if (
      !assignmentsDataFull?.content ||
      !selectedCourseId ||
      !selectedClassGroupId
    )
      return [];

    const filtered = assignmentsDataFull.content.filter(
      (assignment: Assignment) => {
        const courseId =
          assignment['classGroup.course.id'] ||
          assignment.classGroup?.course_id ||
          assignment.classGroup?.course?.id;

        const classGroupId =
          assignment.class_group_id || assignment.classGroup?.id;

        const shiftId =
          assignment['classGroup.shift.id'] ||
          assignment.classGroup?.shift_id ||
          assignment.classGroup?.shift?.id;

        const matchesCourse = courseId === parseInt(selectedCourseId);
        const matchesClassGroup =
          classGroupId === parseInt(selectedClassGroupId);
        const matchesShift =
          !selectedShiftId ||
          selectedShiftId === 'all' ||
          shiftId === parseInt(selectedShiftId);

        return matchesCourse && matchesClassGroup && matchesShift;
      },
    );

    return filtered;
  }, [
    assignmentsDataFull,
    selectedCourseId,
    selectedClassGroupId,
    selectedShiftId,
  ]);

  const timeSlots = useMemo(() => {
    if (!filteredAssignments.length) return [];

    const slots = new Set<string>();
    filteredAssignments.forEach((assignment: Assignment) => {
      if (assignment.schedules && assignment.schedules.length > 0) {
        assignment.schedules.forEach((schedule) => {
          const startTime = schedule.start_time;
          const endTime = schedule.end_time;
          if (startTime && endTime) {
            slots.add(`${formatTime(startTime)} - ${formatTime(endTime)}`);
          }
        });
      }
    });

    return Array.from(slots).sort();
  }, [filteredAssignments]);

  const timetableData = useMemo(() => {
    const WEEKDAYS = [
      { key: 'monday', label: 'Segunda-feira' },
      { key: 'tuesday', label: 'Terça-feira' },
      { key: 'wednesday', label: 'Quarta-feira' },
      { key: 'thursday', label: 'Quinta-feira' },
      { key: 'friday', label: 'Sexta-feira' },
      { key: 'saturday', label: 'Sábado' },
    ];

    const grid: Record<
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
    > = {};

    WEEKDAYS.forEach((day) => {
      grid[day.key] = {};
      timeSlots.forEach((slot) => {
        grid[day.key][slot] = [];
      });
    });

    filteredAssignments.forEach((assignment: Assignment) => {
      if (assignment.schedules && assignment.schedules.length > 0) {
        assignment.schedules.forEach((schedule) => {
          const weekday = schedule.weekday.toLowerCase();
          const startTime = schedule.start_time;
          const endTime = schedule.end_time;
          const timeSlot =
            startTime && endTime
              ? `${formatTime(startTime)} - ${formatTime(endTime)}`
              : null;

          if (weekday && timeSlot && grid[weekday]?.[timeSlot]) {
            grid[weekday][timeSlot].push({
              subject:
                assignment.subject?.name || assignment['subject.name'] || 'N/A',
              teacher:
                assignment.teacher?.full_name ||
                assignment['teacher.full_name'] ||
                'N/A',
              space:
                assignment.space?.name || assignment['space.name'] || 'N/A',
              classGroup:
                assignment.classGroup?.name ||
                assignment['classGroup.name'] ||
                'N/A',
              violatesAvailability: Boolean(assignment.violates_availability),
            });
          }
        });
      }
    });

    return grid;
  }, [filteredAssignments, timeSlots]);

  const handlePrint = () => {
    window.print();
  };

  const selectedCourse = coursesData?.content?.find(
    (course) => course.id === parseInt(selectedCourseId),
  );

  const selectedShift = shiftsData?.content?.find(
    (shift) => shift.id === parseInt(selectedShiftId),
  );

  return (
    <MainLayout requireAdmin={false}>
      <div className="space-y-6">
        <div className="flex gap-6 items-center">
          <Link to="/dashboard">
            <Return className="size-10 text-gray-100 dark:text-gray-200 hover:-translate-x-1 transition-transform" />
          </Link>
          <div>
            <h1 className="flex items-center gap-6 text-3xl font-bold text-gray-100 dark:text-gray-50 font-playwrite">
              <Calendar className="size-8" /> Alocações
            </h1>
            <p className="text-gray-50 dark:text-gray-300 mt-3">
              Gerenciar alocações de horários
            </p>
          </div>
        </div>

        <Tabs defaultValue="list">
          <div>
            <TabsList className="ml-auto flex rounded-b-none">
              <TabsTrigger value="list">Listagem</TabsTrigger>
              {hasRole('principal') && (
                <>
                  <TabsTrigger value="optimize">Otimização</TabsTrigger>
                  <TabsTrigger value="print">Impressão</TabsTrigger>
                </>
              )}
            </TabsList>
            <div className="bg-white dark:bg-card rounded-lg rounded-tr-none shadow-sm dark:shadow-lg border dark:border-border transition-colors">
              {/* Listing Tab */}
              <TabsContent value="list" className="m-0 rounded-t-none">
                <AssignmentsListTab
                  assignmentsData={assignmentsData}
                  isLoading={isLoading}
                  isAdmin={isAdmin}
                  onFilterChange={handleFilterChange}
                  onPageChange={handlePageChange}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onOpenDialog={handleOpenDialog}
                />
              </TabsContent>

              {/* Optimization Tab */}
              {hasRole('principal') && (
                <TabsContent value="optimize" className="m-0 rounded-t-none">
                  <AssignmentsOptimizeTab
                    lastTask={lastTask ?? undefined}
                    isProcessing={isProcessing}
                    onOptimize={handleOptimize}
                  />
                </TabsContent>
              )}

              {/* Print Tab */}
              {hasRole('principal') && (
                <TabsContent
                  value="print"
                  className="print-container m-0 rounded-t-none"
                >
                  <AssignmentsPrintTab
                    courses={coursesData?.content}
                    classGroups={classGroupsData?.content}
                    shifts={shiftsData?.content}
                    selectedCourseId={selectedCourseId}
                    selectedClassGroupId={selectedClassGroupId}
                    selectedShiftId={selectedShiftId}
                    selectedCourse={selectedCourse}
                    selectedShift={selectedShift}
                    timeSlots={timeSlots}
                    timetableData={timetableData}
                    isLoadingCourses={isLoadingCourses}
                    isLoadingClassGroups={false}
                    isLoadingShifts={isLoadingShifts}
                    isLoadingAssignments={isLoadingAssignmentsFull}
                    onCourseChange={setSelectedCourseId}
                    onClassGroupChange={setSelectedClassGroupId}
                    onShiftChange={(value) => setSelectedShiftId(value || '')}
                    onPrint={handlePrint}
                  />
                </TabsContent>
              )}
            </div>
          </div>
        </Tabs>
      </div>

      <style>{`
        @media print {
          @page {
            size: landscape;
            margin: 1cm;
          }
          
          * {
            background: transparent !important;
            background-image: none !important;
          }
          
          body, html {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          
          body * {
            visibility: hidden !important;
          }
          
          .print-container,
          .print-container * {
            visibility: visible !important;
          }
          
          .print-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
          
          .print\\:hidden,
          button,
          aside,
          nav,
          header {
            display: none !important;
            visibility: hidden !important;
          }
          
          .printable-header {
            margin-bottom: 20px !important;
            page-break-inside: avoid;
          }
          
          .printable-header h2 {
            color: #000 !important;
            font-size: 24px !important;
            margin-bottom: 8px !important;
          }
          
          .printable-header p {
            color: #666 !important;
            font-size: 14px !important;
          }
          
          .printable-table {
            overflow: visible !important;
            width: 100% !important;
          }
          
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            page-break-inside: auto;
          }
          
          thead {
            display: table-header-group;
          }
          
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          
          th, td {
            border: 1px solid #d1d5db !important;
            padding: 2px !important;
            font-size: 8px !important;
          }
          
          th {
            background: #f3f4f6 !important;
            font-weight: bold !important;
            text-align: center !important;
            color: #000 !important;
            padding: 3px !important;
            width: 128px !important;
            max-width: 128px !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          th:first-child {
            width: 80px !important;
            max-width: 80px !important;
          }
          
          td {
            color: #000 !important;
            vertical-align: top !important;
            width: 128px !important;
            max-width: 128px !important;
            overflow: hidden !important;
          }
          
          td:first-child {
            width: 80px !important;
            max-width: 80px !important;
          }
          
          .bg-blue-50 {
            background: #eff6ff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .bg-red-100 {
            background: #fee2e2 !important;
            border: 1px solid #fca5a5 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .text-red-600 {
            color: #dc2626 !important;
          }
          
          .bg-gray-50 {
            background: #f9fafb !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      {/* form dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="dark:bg-card dark:border-border max-h-[90vh] overflow-y-auto">
          <AssignmentForm
            isEditMode={isEditMode}
            formData={formData}
            subjects={subjectsData?.content || []}
            schedules={schedulesData?.content || []}
            spaces={spacesData?.content || []}
            teachers={teachersData?.content || []}
            classGroups={classGroupsData?.content || []}
            onSubmit={handleSubmit}
            onSelectChange={handleSelectChange}
            onScheduleToggle={handleScheduleToggle}
            onClose={handleCloseDialog}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* deletion confirmation dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="dark:bg-card dark:border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-foreground">
              Confirmar exclusão
            </AlertDialogTitle>
            <AlertDialogDescription className="dark:text-muted-foreground">
              Tem certeza que deseja excluir esta alocação? Esta ação não pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-secondary/80">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 dark:bg-destructive dark:hover:bg-destructive/80 transition-colors"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default Assignments;
