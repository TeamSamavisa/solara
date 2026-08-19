export interface CreateAssignment {
  schedule_ids?: number[];
  teacher_id: number;
  subject_id: number;
  space_id?: number | null;
  class_group_id: number;
  duration?: number;
}
