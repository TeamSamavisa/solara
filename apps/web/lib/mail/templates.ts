import { readFileSync } from "node:fs"
import path from "node:path"

import Handlebars from "handlebars"

/**
 * Handlebars templates live in `lib/mail/templates/*.hbs` and are read from
 * disk at runtime (they are not part of the bundle). Each one is compiled
 * once and then cached.
 */
const compiledTemplates = new Map<string, Handlebars.TemplateDelegate>()

export function renderEmailTemplate(
  name: string,
  context: Record<string, unknown>
): string {
  let template = compiledTemplates.get(name)

  if (!template) {
    const file = path.join(
      process.cwd(),
      "lib",
      "mail",
      "templates",
      `${name}.hbs`
    )
    template = Handlebars.compile(readFileSync(file, "utf-8"))
    compiledTemplates.set(name, template)
  }

  return template(context)
}
