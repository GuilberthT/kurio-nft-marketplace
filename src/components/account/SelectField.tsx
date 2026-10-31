import { useId, type ComponentProps } from 'react'
import { Label } from '@/components/ui/label'

interface SelectFieldProps extends ComponentProps<'select'> {
  label: string
  error?: string
  options: { value: string; label: string }[]
  placeholder: string
}

export function SelectField({ label, error, options, placeholder, ...props }: SelectFieldProps) {
  const id = useId()
  const errorId = `${id}-erro`
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {props.required && (
          <span aria-hidden="true" className="text-primary">
            {' '}*
          </span>
        )}
      </Label>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-destructive"
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={errorId} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}