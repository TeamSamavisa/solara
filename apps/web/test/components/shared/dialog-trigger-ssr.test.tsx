import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

import { renderToStaticMarkup } from "react-dom/server"

import { DeleteDialog } from "@/components/shared/delete-dialog"
import { EntityDialog } from "@/components/shared/entity-dialog"

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: jest.fn() }),
  usePathname: () => "/shifts",
}))

const action = jest.fn()

/**
 * These render on the server, which is where the trigger regression showed up:
 * a JSX trigger built in a server component reaches Radix's `asChild` as an
 * unresolved lazy reference and makes server rendering throw.
 */
describe("dialog triggers under server rendering", () => {
  it("renders the trigger of an entity dialog", () => {
    const html = renderToStaticMarkup(
      <EntityDialog
        trigger={{ icon: "add", label: "Adicionar Turno" }}
        title="Adicionar Turno"
        description="Preencha o formulário."
        submitLabel="Adicionar"
        action={action}
        renderFields={() => null}
      />
    )

    expect(html).toContain("Adicionar Turno")
  })

  it("renders the trigger of a delete dialog", () => {
    const html = renderToStaticMarkup(
      <DeleteDialog
        id={1}
        name="Matutino"
        entityLabel="o turno"
        action={action}
        trigger={{ icon: "delete", ariaLabel: "Excluir Matutino" }}
      />
    )

    expect(html).toContain('aria-label="Excluir Matutino"')
  })
})

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)

    if (entry.isDirectory()) sourceFiles(full, out)
    else if (entry.name.endsWith(".tsx")) out.push(full)
  }

  return out
}

describe("trigger props", () => {
  it("are never passed as JSX, so they stay serializable across the RSC boundary", () => {
    const offenders = [...sourceFiles("components"), ...sourceFiles("app")]
      .filter((file) => /trigger=\{\s*</.test(readFileSync(file, "utf8")))
      .map((file) => file.replace(/\\/g, "/"))

    expect(offenders).toEqual([])
  })
})
