export interface CreateSpace {
  name: string;
  floor: number;
  capacity: number;
  blocked: boolean | null;
  space_type_id: number | null;
}
