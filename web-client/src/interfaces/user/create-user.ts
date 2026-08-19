export interface CreateUser {
  full_name: string;
  email: string;
  password?: string;
  registration?: string;
  role?: 'admin' | 'principal' | 'coordinator' | 'teacher';
}
