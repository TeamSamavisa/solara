"use client"

import type { EntityFieldsProps } from "@/components/shared/entity-dialog"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface BaseFieldProps extends EntityFieldsProps {
  name: string
  label: string
}

export function TextField({
  name,
  label,
  placeholder,
  defaultValue,
  required = true,
  state,
  pending,
  errorsFor,
  isInvalid,
}: BaseFieldProps & {
  placeholder?: string
  defaultValue?: string
  required?: boolean
}) {
  void state

  return (
    <Field data-invalid={isInvalid(name) || undefined}>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <Input
        id={name}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        aria-invalid={isInvalid(name)}
        disabled={pending}
        autoComplete="off"
        required={required}
      />
      <FieldError errors={errorsFor(name)} />
    </Field>
  )
}

export function NumberField({
  name,
  label,
  placeholder,
  defaultValue,
  min,
  required = true,
  state,
  pending,
  errorsFor,
  isInvalid,
}: BaseFieldProps & {
  placeholder?: string
  defaultValue?: number | null
  min?: number
  required?: boolean
}) {
  void state

  return (
    <Field data-invalid={isInvalid(name) || undefined}>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <Input
        id={name}
        name={name}
        type="number"
        step="1"
        min={min}
        defaultValue={defaultValue ?? undefined}
        placeholder={placeholder}
        aria-invalid={isInvalid(name)}
        disabled={pending}
        required={required}
      />
      <FieldError errors={errorsFor(name)} />
    </Field>
  )
}

export interface SelectOption {
  value: string
  label: string
}

export function SelectField({
  name,
  label,
  options,
  defaultValue,
  placeholder = "Selecione uma opção",
  required = true,
  state,
  pending,
  errorsFor,
  isInvalid,
}: BaseFieldProps & {
  options: SelectOption[]
  defaultValue?: string
  placeholder?: string
  required?: boolean
}) {
  void state

  return (
    <Field data-invalid={isInvalid(name) || undefined}>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      {/* Radix renders a hidden native control for `name`, so the value is
          submitted with the surrounding form. */}
      <Select name={name} defaultValue={defaultValue} required={required}>
        <SelectTrigger
          id={name}
          aria-invalid={isInvalid(name)}
          disabled={pending}
          className="w-full"
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FieldError errors={errorsFor(name)} />
    </Field>
  )
}
