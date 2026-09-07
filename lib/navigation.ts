import {
  BookOpen,
  Building2,
  CalendarClock,
  CalendarDays,
  Clock,
  FlaskConical,
  GraduationCap,
  Home,
  LayoutGrid,
  MapPin,
  SunMoon,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react"

import { hasRole, type Role } from "@/lib/auth/roles"

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

export interface NavGroup {
  /** Undefined for the ungrouped items at the top of the sidebar. */
  label?: string
  /** Minimum role, mirroring the route protection of the legacy router. */
  requiredRole: Role
  items: NavItem[]
}

/**
 * Ported from the legacy `SidebarNav`, with one deliberate change: the legacy
 * sidebar only showed the settings/courses/spaces groups to admins even though
 * its router allowed coordinators in, so those pages were reachable but never
 * linked. Visibility now follows the same rule as the authorization check.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    requiredRole: "teacher",
    items: [
      { href: "/dashboard", label: "Início", icon: Home },
      {
        href: "/availability",
        label: "Disponibilidade",
        icon: CalendarClock,
      },
    ],
  },
  {
    label: "Gestão Acadêmica",
    requiredRole: "coordinator",
    items: [
      { href: "/assignments", label: "Alocações", icon: CalendarDays },
      { href: "/class_groups", label: "Turmas", icon: LayoutGrid },
      { href: "/teachers", label: "Professores", icon: Users },
      { href: "/subjects", label: "Disciplinas", icon: FlaskConical },
    ],
  },
  {
    label: "Configurações",
    requiredRole: "coordinator",
    items: [
      { href: "/schedules", label: "Horários", icon: Clock },
      { href: "/shifts", label: "Turnos", icon: SunMoon },
    ],
  },
  {
    label: "Cursos",
    requiredRole: "coordinator",
    items: [
      { href: "/courses", label: "Cursos", icon: GraduationCap },
      { href: "/course-types", label: "Tipos de Cursos", icon: BookOpen },
    ],
  },
  {
    label: "Espaços",
    requiredRole: "coordinator",
    items: [
      { href: "/spaces", label: "Espaços", icon: MapPin },
      { href: "/space_types", label: "Tipos de Espaços", icon: Building2 },
    ],
  },
  {
    label: "Sistema",
    requiredRole: "admin",
    items: [{ href: "/users", label: "Usuários", icon: UsersRound }],
  },
]

export function visibleNavGroups(role: unknown): NavGroup[] {
  return NAV_GROUPS.filter((group) => hasRole(role, group.requiredRole))
}

/** Every route reachable from the sidebar for a given role. */
export function visibleNavHrefs(role: unknown): string[] {
  return visibleNavGroups(role).flatMap((group) =>
    group.items.map((item) => item.href),
  )
}

/**
 * Marks the deepest matching link as active so nested routes keep their parent
 * highlighted, while `/` never swallows every other route.
 */
export function isActiveNavItem(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}
