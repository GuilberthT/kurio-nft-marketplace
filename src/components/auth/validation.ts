export type FieldErrors<T extends string> = Partial<Record<T, string>>

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateEmail(value: string): string | undefined {
  if (!value.trim()) return 'Informe seu e-mail.'
  if (!EMAIL_PATTERN.test(value.trim())) return 'Informe um e-mail válido.'
  return undefined
}

export function validateNewPassword(value: string): string | undefined {
  if (value.length < 8) return 'A senha precisa de pelo menos 8 caracteres.'
  if (!/[a-zA-Z]/.test(value) || !/\d/.test(value)) return 'Use letras e números na senha.'
  return undefined
}

export function validateUsername(value: string): string | undefined {
  if (!/^[a-z0-9_]{3,20}$/.test(value.trim().toLowerCase())) {
    return 'Use de 3 a 20 letras, números ou _.'
  }
  return undefined
}

export function compactErrors<T extends string>(errors: FieldErrors<T>): FieldErrors<T> {
  return Object.fromEntries(Object.entries(errors).filter(([, message]) => Boolean(message))) as FieldErrors<T>
}

export function focusFirstInvalid(form: HTMLFormElement): void {
  form.querySelector<HTMLInputElement>('[aria-invalid="true"]')?.focus()
}