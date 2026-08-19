import { Link, useLocation } from 'react-router';
import {
  Home,
  User,
  Logout,
  Users,
  Calendar,
  Book,
  Clock,
  Place,
  ClassGroupIcon,
  ShiftTime,
  GraduationCap,
  Science,
  Bot,
} from '@/assets/icons';
import { useAuth } from '@/contexts/auth';
import { useRecentActions } from '@/hooks/useRecentActions';
import { useRole } from '@/hooks/useRole';
import { cn } from '@/lib/utils';
import solara from '@/assets/images/solara.png';
import { ThemeToggle } from '@/components/ui/theme-toggle';

type NavItemProps = {
  to: string;
  label: string;
  icon?: React.ReactNode;
};

const NavItem = ({ to, label, icon }: NavItemProps) => {
  const location = useLocation();
  const { addRecentAction } = useRecentActions();
  const isActive = location.pathname === to;

  const handleClick = () => {
    addRecentAction(to);
  };

  return (
    <Link
      to={to}
      onClick={handleClick}
      className={cn(
        'flex items-center px-3 py-2 text-sm rounded-md transition-colors',
        isActive
          ? 'bg-[var(--solara-100)] dark:bg-sidebar-accent text-[var(--solara-900)] dark:text-sidebar-accent-foreground font-medium'
          : 'text-gray-600 dark:text-sidebar-foreground hover:text-[var(--solara-900)] dark:hover:text-sidebar-primary hover:bg-[var(--solara-50)] dark:hover:bg-sidebar-accent/50',
      )}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {label}
    </Link>
  );
};

export function SidebarNav() {
  const { signOut } = useAuth();
  const { hasRole, isAdmin } = useRole();

  return (
    <div className="w-64 h-screen bg-sidebar border-r border-sidebar-border p-4 flex flex-col">
      <div className="mb-8">
        <Link
          to="/dashboard"
          className="flex flex-col items-center gap-3 group"
        >
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 rounded-full transform group-hover:scale-105 transition-transform duration-300" />
            <img
              src={solara}
              alt="Solara Logo"
              className="relative w-full h-full object-cover rounded-full transform group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div className="text-center">
            <span className="text-2xl font-bold text-[var(--solara-600)] dark:text-[var(--solara-50)] font-playwrite">
              Solara
            </span>
          </div>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {/* basic navigation - all users */}
        <nav className="space-y-1">
          <NavItem
            to="/dashboard"
            label="Início"
            icon={<Home className="size-4" />}
          />
          <NavItem
            to="/availability"
            label="Disponibilidade"
            icon={<Calendar className="size-4" />}
          />
        </nav>

        {/* academic management - coordinator and director */}
        {hasRole('coordinator') && (
          <>
            <div className="pt-6 pb-2">
              <p className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Gestão Acadêmica
              </p>
            </div>
            <nav className="space-y-1">
              <NavItem
                to="/assignments"
                label="Alocações"
                icon={<Calendar className="size-4" />}
              />
              <NavItem
                to="/class_groups"
                label="Turmas"
                icon={<ClassGroupIcon className="size-4" />}
              />
              <NavItem
                to="/teachers"
                label="Professores"
                icon={<Users className="size-4" />}
              />
              <NavItem
                to="/subjects"
                label="Disciplinas"
                icon={<Science className="size-4" />}
              />
            </nav>
          </>
        )}

        {/* system administration - admin only */}
        {isAdmin && (
          <>
            <div className="pt-6 pb-2">
              <p className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Configurações
              </p>
            </div>
            <nav className="space-y-1">
              <NavItem
                to="/schedules"
                label="Horários"
                icon={<Clock className="size-4" />}
              />
              <NavItem
                to="/shifts"
                label="Turnos"
                icon={<ShiftTime className="size-4" />}
              />
            </nav>

            <div className="pt-6 pb-2">
              <p className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Cursos
              </p>
            </div>
            <nav className="space-y-1">
              <NavItem
                to="/courses"
                label="Cursos"
                icon={<GraduationCap className="size-4" />}
              />
              <NavItem
                to="/course-types"
                label="Tipos de Cursos"
                icon={<Book className="size-4" />}
              />
            </nav>

            <div className="pt-6 pb-2">
              <p className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Espaços
              </p>
            </div>
            <nav className="space-y-1">
              <NavItem
                to="/spaces"
                label="Espaços"
                icon={<Place className="size-4" />}
              />
              <NavItem
                to="/space_types"
                label="Tipos de Espaços"
                icon={<Place className="size-4" />}
              />
            </nav>

            <div className="pt-6 pb-2">
              <p className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Sistema
              </p>
            </div>
            <nav className="space-y-1">
              <NavItem
                to="/users"
                label="Usuários"
                icon={<Users className="size-4" />}
              />
            </nav>
          </>
        )}
      </div>

      <div className="flex-shrink-0 pt-4 space-y-2 border-t border-sidebar-border mt-4">
        <div className="px-3 py-2">
          <ThemeToggle />
        </div>
        <a
          href={import.meta.env.VITE_OPEN_WEBUI_URL || 'http://localhost:8080'}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center px-3 py-2 text-sm rounded-md transition-colors text-gray-600 dark:text-sidebar-foreground hover:text-[var(--solara-900)] dark:hover:text-sidebar-primary hover:bg-[var(--solara-50)] dark:hover:bg-sidebar-accent/50"
        >
          <span className="mr-2">
            <Bot className="size-4" />
          </span>
          Assistente IA
        </a>
        <NavItem
          to="/profile"
          label="Perfil"
          icon={<User className="size-4" />}
        />
        <button
          className="w-full flex items-center px-3 py-2 text-sm rounded-md text-sidebar-foreground hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
          onClick={() => signOut()}
        >
          <span className="mr-2">
            <Logout className="size-4" />
          </span>
          Sair
        </button>
      </div>
    </div>
  );
}
