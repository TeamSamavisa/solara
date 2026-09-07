"use client"

import { useState } from "react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface SelectFilterOption {
  value: string
  label: string
}

/**
 * Radix does not allow an item with an empty value, so "no filter" is carried
 * by this sentinel and simply omitted from the submitted form.
 */
const ALL = "__all__"

/**
 * Filter select for the list screens.
 *
 * The value is submitted through a hidden input that only exists when a real
 * option is picked, which keeps the URL free of a placeholder value and lets
 * the server treat "no filter" as an absent param.
 */
export function SelectFilter({
  name,
  options,
  defaultValue,
  placeholder = "Selecione uma opção",
  allLabel = "Todos",
  id,
  className,
}: {
  name: string
  options: readonly SelectFilterOption[]
  defaultValue?: string
  placeholder?: string
  allLabel?: string
  id?: string
  className?: string
}) {
  const [value, setValue] = useState(defaultValue || ALL)

  return (
    <>
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger id={id} className={className}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{allLabel}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {value !== ALL ? (
        <input type="hidden" name={name} value={value} />
      ) : null}
    </>
  )
}
