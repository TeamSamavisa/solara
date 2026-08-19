export interface CreateClassGroup {
  name: string;
  semester: string;
  module: string;
  student_count: number;
  shift_id: number | null;
  course_id: number | null;
}
