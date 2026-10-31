import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  changePassword,
  createWallet,
  removeAvatar,
  updateProfile,
  updateWallet,
  uploadAvatar,
} from '@/api/account'
import { privateKey, sessionKey, useSession } from '@/auth/session'
import type { Session, User } from '@/types/user'
import type { WalletInput } from '@/types/wallet'

/** Depois de salvar o perfil, a sessão em cache recebe o usuário atualizado (o cabeçalho muda na hora). */
function useUpdateUserInSession() {
  const queryClient = useQueryClient()
  return (user: User) => {
    queryClient.setQueryData<Session | null>(sessionKey, (session) => (session ? { ...session, user } : session))
  }
}

export function useUpdateProfile() {
  const updateUser = useUpdateUserInSession()
  return useMutation({ mutationFn: updateProfile, onSuccess: updateUser })
}

export function useUploadAvatar() {
  const updateUser = useUpdateUserInSession()
  return useMutation({ mutationFn: uploadAvatar, onSuccess: updateUser })
}

export function useRemoveAvatar() {
  const updateUser = useUpdateUserInSession()
  return useMutation({ mutationFn: () => removeAvatar(), onSuccess: updateUser })
}

export function useChangePassword() {
  return useMutation({ mutationFn: changePassword })
}

/** As carteiras usam a mesma chave do checkout: salvar aqui atualiza a lista do pagamento. */
function useInvalidateWallets() {
  const queryClient = useQueryClient()
  const { user } = useSession()
  return () => queryClient.invalidateQueries({ queryKey: [...privateKey(user?.id ?? 'anon'), 'wallets'] })
}

export function useCreateWallet() {
  const invalidate = useInvalidateWallets()
  return useMutation({ mutationFn: (input: WalletInput) => createWallet(input), onSuccess: invalidate })
}

export function useUpdateWallet() {
  const invalidate = useInvalidateWallets()
  return useMutation({
    mutationFn: ({ id, ...input }: Omit<WalletInput, 'kind'> & { id: string }) => updateWallet(id, input),
    onSuccess: invalidate,
  })
}