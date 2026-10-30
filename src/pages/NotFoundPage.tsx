import { Link } from '@tanstack/react-router'
import { StatePanel } from '@/components/feedback/StatePanel'
import { buttonVariants } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="py-16">
      <StatePanel
        title="Página não encontrada"
        description="O endereço que você abriu não existe ou foi removido."
        action={
          <Link to="/" className={buttonVariants()}>
            Voltar ao início
          </Link>
        }
      />
    </div>
  )
}