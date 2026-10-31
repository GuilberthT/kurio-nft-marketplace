import { useRef, useState, type ChangeEvent, type SubmitEvent } from 'react'
import { flushSync } from 'react-dom'
import { ImageIcon } from 'lucide-react'
import { ApiError } from '@/api/httpClient'
import { resizeAvatar } from '@/account/resizeAvatar'
import { useChangePassword, useRemoveAvatar, useUpdateProfile, useUploadAvatar } from '@/account/useAccount'
import { useSession } from '@/auth/session'
import { FormStatus } from '@/components/account/FormStatus'
import { FormField } from '@/components/auth/FormField'
import {
  compactErrors,
  focusFirstInvalid,
  validateEmail,
  validateNewPassword,
  validateUsername,
  type FieldErrors,
} from '@/components/auth/validation'
import { Button } from '@/components/ui/button'
import type { User } from '@/types/user'

export function ProfilePage() {
  const { user } = useSession()
  if (!user) return null
  return (
    <div className="space-y-12">
      <ProfileForm key={user.id} user={user} />
      <PasswordForm />
    </div>
  )
}

type ProfileField = 'name' | 'username' | 'email'

function ProfileForm({ user }: { user: User }) {
  const update = useUpdateProfile()
  const [values, setValues] = useState({ name: user.name, username: user.username, email: user.email })
  const [errors, setErrors] = useState<FieldErrors<ProfileField>>({})

  function change(field: ProfileField, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }))
    update.reset()
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const nextErrors = compactErrors<ProfileField>({
      name: values.name.trim().length >= 2 ? undefined : 'Informe o nome de exibição.',
      username: validateUsername(values.username),
      email: validateEmail(values.email),
    })
    flushSync(() => setErrors(nextErrors))
    if (Object.keys(nextErrors).length > 0) {
      focusFirstInvalid(form)
      return
    }
    update.mutate(
      { name: values.name.trim(), username: values.username.trim().toLowerCase(), email: values.email.trim() },
      {
        onError: (error) => {
          if (error instanceof ApiError && error.fieldErrors) {
            flushSync(() => setErrors(error.fieldErrors as FieldErrors<ProfileField>))
            focusFirstInvalid(form)
          }
        },
      },
    )
  }

  const generalError = update.error && !(update.error instanceof ApiError && update.error.fieldErrors) ? update.error.message : null

  return (
    <section aria-labelledby="perfil-titulo">
      <h2 id="perfil-titulo" className="text-lg font-bold">
        Perfil do colecionador
      </h2>
      <div className="mt-6 grid gap-8 md:grid-cols-[1fr_auto]">
        <form noValidate onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2">
          <FormField label="Nome de exibição" required autoComplete="name" value={values.name} onChange={(e) => change('name', e.target.value)} error={errors.name} />
          <FormField label="Nome de usuário" required autoComplete="username" value={values.username} onChange={(e) => change('username', e.target.value)} error={errors.username} />
          <FormField label="E-mail" required type="email" autoComplete="email" value={values.email} onChange={(e) => change('email', e.target.value)} error={errors.email} />
          <div className="flex flex-col justify-end gap-2 sm:col-span-2">
            <FormStatus success={update.isSuccess ? 'Perfil atualizado.' : undefined} error={generalError} />
            <Button type="submit" className="w-fit px-8 font-bold" disabled={update.isPending}>
              {update.isPending ? 'Salvando…' : 'Salvar perfil'}
            </Button>
          </div>
        </form>
        <AvatarField user={user} />
      </div>
    </section>
  )
}

function AvatarField({ user }: { user: User }) {
  const upload = useUploadAvatar()
  const remove = useRemoveAvatar()
  const input = useRef<HTMLInputElement>(null)
  const [localError, setLocalError] = useState<string | null>(null)

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setLocalError(null)
    try {
      upload.mutate(await resizeAvatar(file))
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'Não foi possível ler a imagem.')
    }
  }

  const busy = upload.isPending || remove.isPending
  const error = localError ?? upload.error?.message ?? remove.error?.message ?? null

  return (
    <div>
      <p className="text-sm font-medium">Avatar</p>
      <div className="mt-3 flex items-center gap-4">
        <div className="flex size-14 items-center justify-center overflow-hidden rounded-full border border-border bg-secondary">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={`Avatar de ${user.name}`} width={56} height={56} className="size-full object-cover" />
          ) : (
            <ImageIcon aria-hidden className="size-6 text-primary" />
          )}
        </div>
        <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" aria-label="Escolher imagem do avatar" onChange={(e) => void handleFile(e)} tabIndex={-1} />
        <Button type="button" className="font-bold" onClick={() => input.current?.click()} disabled={busy}>
          {upload.isPending ? 'Enviando…' : 'Alterar'}
        </Button>
        {user.avatarUrl && (
          <Button type="button" variant="ghost" onClick={() => remove.mutate()} disabled={busy}>
            Remover
          </Button>
        )}
      </div>
      <div className="mt-2">
        <FormStatus
          success={upload.isSuccess ? 'Avatar atualizado.' : remove.isSuccess ? 'Avatar removido.' : undefined}
          error={error}
        />
      </div>
    </div>
  )
}

type PasswordField = 'currentPassword' | 'newPassword' | 'confirm'
const EMPTY_PASSWORDS: Record<PasswordField, string> = { currentPassword: '', newPassword: '', confirm: '' }

function PasswordForm() {
  const change = useChangePassword()
  const [values, setValues] = useState(EMPTY_PASSWORDS)
  const [errors, setErrors] = useState<FieldErrors<PasswordField>>({})

  function update(field: PasswordField, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }))
    change.reset()
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const nextErrors = compactErrors<PasswordField>({
      currentPassword: values.currentPassword ? undefined : 'Informe a senha atual.',
      newPassword: validateNewPassword(values.newPassword),
      confirm: values.confirm === values.newPassword ? undefined : 'As senhas não conferem.',
    })
    flushSync(() => setErrors(nextErrors))
    if (Object.keys(nextErrors).length > 0) {
      focusFirstInvalid(form)
      return
    }
    change.mutate(
      { currentPassword: values.currentPassword, newPassword: values.newPassword },
      {
        onSuccess: () => setValues(EMPTY_PASSWORDS),
        onError: (error) => {
          if (error instanceof ApiError && error.fieldErrors) {
            flushSync(() => setErrors(error.fieldErrors as FieldErrors<PasswordField>))
            focusFirstInvalid(form)
          }
        },
      },
    )
  }

  return (
    <section aria-labelledby="senha-titulo">
      <h2 id="senha-titulo" className="text-lg font-bold">
        Alterar senha
      </h2>
      <form noValidate onSubmit={handleSubmit} className="mt-6 grid max-w-md gap-5">
        <FormField label="Senha atual" type="password" autoComplete="current-password" value={values.currentPassword} onChange={(e) => update('currentPassword', e.target.value)} error={errors.currentPassword} />
        <FormField label="Nova senha" type="password" autoComplete="new-password" value={values.newPassword} onChange={(e) => update('newPassword', e.target.value)} error={errors.newPassword} />
        <FormField label="Confirmar nova senha" type="password" autoComplete="new-password" value={values.confirm} onChange={(e) => update('confirm', e.target.value)} error={errors.confirm} />
        <FormStatus success={change.isSuccess ? 'Senha alterada.' : undefined} />
        <Button type="submit" className="w-fit px-8 font-bold" disabled={change.isPending}>
          {change.isPending ? 'Salvando…' : 'Alterar senha'}
        </Button>
      </form>
    </section>
  )
}