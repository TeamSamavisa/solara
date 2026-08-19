import { useState, useEffect } from 'react';
import {
  Calendar,
  User,
  Student,
  Book,
  Clock,
  Assignment,
  Teacher,
  Users,
} from '@/assets/icons';
import type { IconType } from 'react-icons/lib';

interface StoredPath {
  path: string;
  timestamp: number;
}

interface RouteConfig {
  label: string;
  icon: IconType;
}

const MAX_RECENT_ACTIONS = 6;
const STORAGE_KEY = '@solara:recent-actions';

const routeConfig: Record<string, RouteConfig> = {
  '/assignments': {
    label: 'Alocações',
    icon: Assignment,
  },
  '/availability': {
    label: 'Disponibilidade',
    icon: Calendar,
  },
  '/class_groups': {
    label: 'Turmas',
    icon: Student,
  },
  '/subjects': {
    label: 'Disciplinas',
    icon: Book,
  },
  '/teachers': {
    label: 'Professores',
    icon: Teacher,
  },
  '/users': {
    label: 'Usuários',
    icon: Users,
  },
  '/schedules': {
    label: 'Horários',
    icon: Clock,
  },
  '/shifts': {
    label: 'Turnos',
    icon: Clock,
  },
  '/spaces': {
    label: 'Espaços',
    icon: Assignment,
  },
  '/space_types': {
    label: 'Tipos de Espaços',
    icon: Assignment,
  },
  '/courses': {
    label: 'Cursos',
    icon: Student,
  },
  '/course-types': {
    label: 'Tipos de Cursos',
    icon: Book,
  },
  '/profile': {
    label: 'Perfil',
    icon: User,
  },
};

const ignoredRoutes = ['/dashboard', '/'];

export function useRecentActions() {
  const [recentPaths, setRecentPaths] = useState<StoredPath[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recentPaths));
  }, [recentPaths]);

  const addRecentAction = (path: string) => {
    if (ignoredRoutes.includes(path) || !routeConfig[path]) {
      return;
    }

    setRecentPaths((prev) => {
      const filtered = prev.filter((p) => p.path !== path);
      const newPaths = [{ path, timestamp: Date.now() }, ...filtered].slice(
        0,
        MAX_RECENT_ACTIONS,
      );

      if (JSON.stringify(prev) === JSON.stringify(newPaths)) {
        return prev;
      }

      return newPaths;
    });
  };

  const recentActions = recentPaths
    .filter(({ path }) => routeConfig[path])
    .map(({ path, timestamp }) => ({
      path,
      timestamp,
      ...routeConfig[path],
    }));

  return {
    recentActions,
    addRecentAction,
  };
}
