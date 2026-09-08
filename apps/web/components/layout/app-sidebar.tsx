"use client"

import { LogOutIcon, UserIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { logout } from "@/app/actions/auth"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import type { Role } from "@/lib/auth/roles"
import { isActiveNavItem, visibleNavGroups } from "@/lib/navigation"

export function AppSidebar({
  role,
  userName,
}: {
  role: Role
  userName?: string
}) {
  const pathname = usePathname()
  const groups = visibleNavGroups(role)

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip="Solara">
              <Link href="/dashboard">
                <Image
                  src="/solara.png"
                  alt=""
                  width={32}
                  height={32}
                  className="size-8 shrink-0 rounded-full object-cover"
                />
                <span className="text-lg font-bold">Solara</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {groups.map((group, index) => (
          <SidebarGroup key={group.label ?? `group-${index}`}>
            {group.label ? (
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            ) : null}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActiveNavItem(pathname, item.href)}
                      tooltip={item.label}
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator />
        <SidebarMenu>
          <SidebarMenuItem>
            <ThemeToggle />
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActiveNavItem(pathname, "/profile")}
              tooltip={userName ?? "Perfil"}
            >
              <Link href="/profile">
                <UserIcon />
                <span>{userName || "Perfil"}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <form action={logout}>
              <SidebarMenuButton
                type="submit"
                tooltip="Sair"
                className="w-full text-destructive hover:text-destructive"
              >
                <LogOutIcon />
                <span>Sair</span>
              </SidebarMenuButton>
            </form>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
