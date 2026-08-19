import AuthLayout from '@/components/layouts/AuthLayout';
import ProtectedRoute from '@/components/layouts/ProtectedRoute';
import RoleProtectedRoute from '@/components/layouts/RoleProtectedRoute';
import Login from '@/pages/auth';
import Dashboard from '@/pages/authenticated/dashboard';
import Profile from '@/pages/authenticated/profile';
import Teachers from '@/pages/authenticated/teachers';
import Users from '@/pages/authenticated/users';
import Assignments from '@/pages/authenticated/assignments';
import Availability from '@/pages/authenticated/availability';
import Unauthorized from '@/pages/error/401';
import Forbidden from '@/pages/error/403';
import NotFound from '@/pages/error/404';
import { useRoutes } from 'react-router';
import CourseTypes from '@/pages/authenticated/course-types';
import Courses from '@/pages/authenticated/courses';
import Spaces from '@/pages/authenticated/spaces';
import SpaceTypes from '@/pages/authenticated/space_types';
import Schedules from '@/pages/authenticated/schedules';
import ClassGroups from '@/pages/authenticated/class_groups';
import Shifts from '@/pages/authenticated/shifts';
import Subjects from '@/pages/authenticated/subjects';

export function Routes() {
  return useRoutes([
    {
      path: 'login',
      element: <AuthLayout />,
      children: [{ index: true, element: <Login /> }],
    },
    {
      element: <ProtectedRoute />,
      children: [
        // routes accessible to all authenticated users
        { path: 'dashboard', element: <Dashboard /> },
        { path: 'availability', element: <Availability /> },
        { path: 'profile', element: <Profile /> },

        // routes for coordinator and above (coordinator, principal, admin)
        {
          element: <RoleProtectedRoute requiredRole="coordinator" />,
          children: [
            { path: 'teachers', element: <Teachers /> },
            { path: 'spaces', element: <Spaces /> },
            { path: 'space_types', element: <SpaceTypes /> },
            { path: 'schedules', element: <Schedules /> },
            { path: 'assignments', element: <Assignments /> },
            { path: 'course-types', element: <CourseTypes /> },
            { path: 'courses', element: <Courses /> },
            { path: 'class_groups', element: <ClassGroups /> },
            { path: 'shifts', element: <Shifts /> },
            { path: 'subjects', element: <Subjects /> },
          ],
        },

        // routes to main and above (principal, admin)
        {
          element: <RoleProtectedRoute requiredRole="principal" />,
          children: [],
        },

        // routes for admin only
        {
          element: <RoleProtectedRoute requiredRole="admin" />,
          children: [{ path: 'users', element: <Users /> }],
        },
      ],
    },
    {
      path: '*',
      element: <NotFound />,
    },
    {
      path: 'error',
      children: [
        { path: '401', element: <Unauthorized /> },
        { path: '403', element: <Forbidden /> },
        { path: '404', element: <NotFound /> },
      ],
    },
  ]);
}
