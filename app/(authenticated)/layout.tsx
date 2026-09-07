import { AppSidebar } from "@/components/layout/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { getCurrentUser, verifySession } from "@/lib/auth/dal"

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await verifySession()
  const user = await getCurrentUser()

  return (
    // `SidebarMenuButton` renders a tooltip when collapsed, and this version of
    // `SidebarProvider` does not supply the provider itself.
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar role={session.role} userName={user?.full_name} />
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger />
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
