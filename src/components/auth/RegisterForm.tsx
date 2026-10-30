import { flushSync } from 'react-dom'
import { useState, type SubmitEvent } from 'react'
import { ApiError } from '@/api/httpClient'
import { useRegister } from '@/auth/session'
import { Button } from '@/components/ui/button'
import { FormField } from './FormField'
import {
  compactErrors,
  focusFirstInvalid,
  validateEmail,
  validateNewPassword,
  validateUsername,
  type FieldErrors,
} from './validation'

type Field = 'username' | 'email' | 'password' | 'confirm'

export function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const register = useRegister()
  const [values, setValues] = useState<Record<Field, string>>({ username: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState<FieldErrors<Field>>({})

  function update(field: Field, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const nextErrors = compactErrors<Field>({
      username: validateUsername(values.username),
      email: validateEmail(values.email),
      password: validateNewPassword(values.password),
      confirm: values.confirm === values.password ? undefined : 'As senhas não conferem.',
    })
    flushSync(() => setErrors(nextErrors))
    if (Object.keys(nextErrors).length > 0) {
      focusFirstInvalid(form)
      return
    }

    register.mutate(
      { username: values.username.trim().toLowerCase(), email: values.email.trim(), password: values.password },
      {
        onSuccess,
        onError: (error) => {
          if (error instanceof ApiError && error.fieldErrors) {
            flushSync(() => setErrors(error.fieldErrors as FieldErrors<Field>))
            focusFirstInvalid(form)
          }
        },
      },
    )
  }

  const generalError =
    register.error && !(register.error instanceof ApiError && register.error.fieldErrors) ? register.error.message : null

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-4">
      <FormField
        label="Nome de usuário"
        hideLabel
        autoComplete="username"
        placeholder="Nome de usuário"
        value={values.username}
        onChange={(event) => update('username', event.target.value)}
        error={errors.username}
      />
      <FormField
        label="E-mail"
        hideLabel
        type="email"
        autoComplete="email"
        placeholder="Digite seu e-mail"
        value={values.email}
        onChange={(event) => update('email', event.target.value)}
        error={errors.email}
      />
      <FormField
        label="Senha"
        hideLabel
        type="password"
        autoComplete="new-password"
        placeholder="Senha"
        value={values.password}
        onChange={(event) => update('password', event.target.value)}
        error={errors.password}
      />
      <FormField
        label="Confirmar senha"
        hideLabel
        type="password"
        autoComplete="new-password"
        placeholder="Confirmar senha"
        value={values.confirm}
        onChange={(event) => update('confirm', event.target.value)}
        error={errors.confirm}
      />
      {generalError && (
        <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {generalError}
        </p>
      )}
      <Button type="submit" className="h-11 w-full font-bold" disabled={register.isPending}>
        {register.isPending ? 'Criando conta…' : 'Criar conta'}
      </Button>
    </form>
  )
}