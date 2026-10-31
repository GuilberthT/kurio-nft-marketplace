/** Mensagem de sucesso ou erro de um formulário, anunciada para leitores de tela. */
export function FormStatus({ success, error }: { success?: string; error?: string | null }) {
  if (error) {
    return (
      <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {error}
      </p>
    )
  }
  return (
    <p role="status" className="min-h-5 text-sm text-primary">
      {success}
    </p>
  )
}