import { useState, type SubmitEvent } from 'react'
import { ApiError } from '@/api/httpClient'
import { useLogin } from '@/auth/session'
import { Button } from '@/components/ui/button'
import { FormField } from './FormField'
import { compactErrors, focusFirstInvalid, validateEmail, type FieldErrors } from './validation'

type Field = 'email' | 'password'

export function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const login = useLogin()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FieldErrors<Field>>({})

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const nextErrors = compactErrors<Field>({
      email: validateEmail(email),
      password: password ? undefined : 'Informe sua senha.',
    })
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      requestAnimationFrame(() => focusFirstInvalid(form))
      return
    }
    login.mutate({ email: email.trim(), password }, { onSuccess })
  }

  const apiMessage = login.error instanceof ApiError ? login.error.message : login.error?.message

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-4">
      <FormField
        label="E-mail"
        hideLabel
        type="email"
        autoComplete="email"
        placeholder="contato@email.com"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        error={errors.email}
      />
      <FormField
        label="Senha"
        hideLabel
        type="password"
        autoComplete="current-password"
        placeholder="Senha"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        error={errors.password}
      />
      <p className="text-right">
        <span aria-disabled="true" title="Em breve" className="cursor-not-allowed text-sm text-primary/60">
          Esqueceu a senha?
        </span>
      </p>
      {apiMessage && (
        <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {apiMessage}
        </p>
      )}
      <Button type="submit" className="h-11 w-full font-bold" disabled={login.isPending}>
        {login.isPending ? 'Entrando…' : 'Entrar'}
      </Button>
    </form>
  )
}