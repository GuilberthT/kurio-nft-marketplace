import { Heart } from 'lucide-react'
import { useAuthDialog } from '@/auth/AuthDialogContext'
import { useSession } from '@/auth/session'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useFavorites, useToggleFavorite } from '@/queries/favorites'

export function FavoriteButton({ nftId }: { nftId: string }) {
  const { user } = useSession()
  const { openAuth } = useAuthDialog()
  const favorites = useFavorites()
  const toggle = useToggleFavorite()
  const isFavorite = favorites.data?.includes(nftId) ?? false

  function handleClick() {
    if (!user) {
      openAuth('login', 'Entre para salvar seus favoritos.')
      return
    }
    toggle.mutate({ nftId, favorite: !isFavorite })
  }

  return (
    <div className="flex flex-col items-end">
      <Button
        variant="outline"
        className="h-10"
        aria-pressed={isFavorite}
        onClick={handleClick}
        disabled={toggle.isPending}
      >
        <Heart aria-hidden className={cn(isFavorite && 'fill-primary text-primary')} />
        {isFavorite ? 'Favoritado' : 'Favoritar'}
      </Button>
      <p role="status" aria-live="polite" className="mt-1 min-h-4 text-xs text-destructive">
        {toggle.isError ? `${toggle.error.message} O favorito voltou ao estado anterior.` : ''}
      </p>
    </div>
  )
}