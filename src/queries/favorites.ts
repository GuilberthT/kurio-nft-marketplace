import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addFavorite, fetchFavorites, removeFavorite } from '@/api/favorites'
import { privateKey, useSession } from '@/auth/session'

function favoritesKey(userId: string) {
  return [...privateKey(userId), 'favorites'] as const
}

export function useFavorites() {
  const { user } = useSession()
  return useQuery({
    queryKey: favoritesKey(user?.id ?? 'anon'),
    queryFn: ({ signal }) => fetchFavorites(signal),
    enabled: Boolean(user),
  })
}

/**
 * Atualização otimista: o coração muda na hora, antes da resposta da API.
 * Se a API falhar, a lista volta ao que era (rollback).
 */
export function useToggleFavorite() {
  const queryClient = useQueryClient()
  const { user } = useSession()
  const key = favoritesKey(user?.id ?? 'anon')

  return useMutation({
    mutationFn: ({ nftId, favorite }: { nftId: string; favorite: boolean }) =>
      favorite ? addFavorite(nftId) : removeFavorite(nftId),
    onMutate: async ({ nftId, favorite }) => {
      // Cancela buscas em andamento para elas não sobrescreverem o valor otimista.
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<string[]>(key) ?? []
      const next = favorite ? [...new Set([...previous, nftId])] : previous.filter((id) => id !== nftId)
      queryClient.setQueryData(key, next)
      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (context) queryClient.setQueryData(key, context.previous)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  })
}