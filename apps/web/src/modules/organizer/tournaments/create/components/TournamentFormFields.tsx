import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'
import {
  useController,
  type Control,
  type FieldError,
  type FieldPath,
  type FieldValues,
  type RegisterOptions,
  type UseFormRegisterReturn,
} from 'react-hook-form'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

type FieldShellProps = {
  label: string
  htmlFor: string
  error?: FieldError
  hint?: string
  children: ReactNode
}

function FieldShell({ label, htmlFor, error, hint, children }: FieldShellProps) {
  return (
    <div>
      <Label className="mb-2 block text-[11px] font-black uppercase tracking-[0.08em] text-[#cec4d2]" htmlFor={htmlFor}>
        {label}
      </Label>
      {children}
      {error ? (
        <p className="mt-1.5 text-xs text-[#ffb4ab]" role="alert">{error.message}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs leading-5 text-[#8f8495]">{hint}</p>
      ) : null}
    </div>
  )
}

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & {
  id: string
  label: string
  registration: UseFormRegisterReturn
  error?: FieldError
  hint?: string
}

export function TextField({ id, label, registration, error, hint, className, ...props }: TextFieldProps) {
  return (
    <FieldShell label={label} htmlFor={id} error={error} hint={hint}>
      <Input id={id} className={className} aria-invalid={Boolean(error)} {...props} {...registration} />
    </FieldShell>
  )
}

type SelectOption = {
  value: string
  label: string
}

type SelectFieldProps<TValues extends FieldValues> = {
  id: string
  label: string
  name: FieldPath<TValues>
  control: Control<TValues>
  options: readonly SelectOption[]
  rules?: RegisterOptions<TValues, FieldPath<TValues>>
}

export function SelectField<TValues extends FieldValues>({
  id,
  label,
  name,
  control,
  options,
  rules,
}: SelectFieldProps<TValues>) {
  const { field, fieldState } = useController({ name, control, rules })
  const selectedValue = typeof field.value === 'string' ? field.value : ''

  return (
    <FieldShell label={label} htmlFor={id} error={fieldState.error}>
      <Select name={field.name} value={selectedValue} onValueChange={field.onChange}>
        <SelectTrigger id={id} aria-invalid={Boolean(fieldState.error)} onBlur={field.onBlur}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldShell>
  )
}

type TextAreaFieldProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> & {
  id: string
  label: string
  registration: UseFormRegisterReturn
  error?: FieldError
  hint?: string
}

export function TextAreaField({ id, label, registration, error, hint, className, ...props }: TextAreaFieldProps) {
  return (
    <FieldShell label={label} htmlFor={id} error={error} hint={hint}>
      <Textarea id={id} className={className} aria-invalid={Boolean(error)} {...props} {...registration} />
    </FieldShell>
  )
}

type CheckFieldProps<TValues extends FieldValues> = {
  id: string
  label: string
  description?: string
  name: FieldPath<TValues>
  control: Control<TValues>
}

export function CheckField<TValues extends FieldValues>({
  id,
  label,
  description,
  name,
  control,
}: CheckFieldProps<TValues>) {
  const { field } = useController({ name, control })

  return (
    <Label className="flex cursor-pointer items-start gap-3 rounded-md border border-[#3d3741] bg-[#171519] p-3" htmlFor={id}>
      <Checkbox
        id={id}
        className="mt-0.5"
        checked={Boolean(field.value)}
        onCheckedChange={field.onChange}
        onBlur={field.onBlur}
      />
      <span>
        <span className="block text-sm font-bold text-[#eee8f1]">{label}</span>
        {description && <span className="mt-1 block text-xs leading-5 text-[#928899]">{description}</span>}
      </span>
    </Label>
  )
}
