"use client"

import { PrinterIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

/** `window.print()` needs the client, so the button is isolated here. */
export function PrintButton() {
  return (
    <Button type="button" variant="secondary" onClick={() => window.print()}>
      <PrinterIcon /> Imprimir
    </Button>
  )
}
