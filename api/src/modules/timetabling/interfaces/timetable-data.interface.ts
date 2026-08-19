export interface SpaceTypeData {
  id: number;
  name: string;
}

export interface ClassroomData {
  id: number;
  name: string;
  floor: number;
  capacity: number;
  blocked: boolean;
  space_type_id: number;
}

export interface CourseTypeData {
  id: number;
  name: string;
}

export interface CourseData {
  id: number;
  name: string;
  course_type_id: number;
}

export interface ShiftData {
  id: number;
  name: string;
}

export interface TeacherData {
  id: number;
  full_name: string;
}

export interface SubjectData {
  id: number;
  name: string;
  required_space_type_id: number;
  course_id: number;
}

export interface ScheduleData {
  id: number;
  weekday: string;
  start_time: string;
  end_time: string;
}

export interface ClassGroupData {
  id: number;
  name: string;
  semester: string;
  module: string;
  student_count: number;
  course_id: number;
  shift_id: number;
}

export interface ClassAllocationData {
  id: number;
  class_group_id: number;
  subject_id: number;
  teacher_id: number;
  space_id: number | null;
  duration: number;
  schedules: ScheduleData[];
}

export interface TimetableInputData {
  space_types: SpaceTypeData[];
  classrooms: ClassroomData[];
  course_types: CourseTypeData[];
  courses: CourseData[];
  shifts: ShiftData[];
  teachers: TeacherData[];
  subjects: SubjectData[];
  schedules: ScheduleData[];
  class_groups: ClassGroupData[];
  class_allocations: ClassAllocationData[];
  teacher_schedules: Record<number, number[]>;
}

export interface TimeSlot {
  day: string;
  hour: number;
  schedule_id?: number;
}

export interface OptimizedAllocation {
  allocation_id: number;
  schedule_ids?: number[]; // Direct schedule IDs from optimizer
  class_group: {
    id: number;
    name: string;
    course: string;
    shift: string;
    shift_id?: number;
  };
  subject: {
    id: number;
    name: string;
  };
  teacher: {
    id: number;
    name: string;
  };
  classroom: {
    id: number;
    name: string;
    floor: number;
  };
  time_slots: TimeSlot[];
  duration: number;
}

export interface OptimizationStatistics {
  hard_constraints_satisfied: boolean;
  hard_constraints_cost: number;
  total_allocations: number;
  groups_empty_space?: {
    total: number;
    max_per_day: number;
    average_per_week: number;
  };
  teachers_empty_space?: {
    total: number;
    max_per_day: number;
    average_per_week: number;
  };
}

export interface OptimizationResult {
  status: 'success' | 'error';
  message: string;
  data?: {
    schedule: OptimizedAllocation[];
    statistics: OptimizationStatistics;
  };
  errors?: string[];
}
