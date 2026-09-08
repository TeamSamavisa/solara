import { Button } from "@/components/ui/button"

/** Server-rendered GET form: filtering stays on the server and works without JS. */
export function FilterForm({ children }: { children: React.ReactNode }) {
  return (
    <form className="flex flex-wrap items-end gap-2" role="search">
      {children}
      <Button type="submit" variant="secondary">
        Filtrar
      </Button>
    </form>
  )
}

export function PageHeader({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="mt-1 text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  )
}
