import type { User } from '@/types/user'

export interface UserRecord extends User {
  passwordHash: string
}

export const USER_FIXTURES: UserRecord[] = [
  {
    id: 'user-ana',
    name: 'Ana Souza',
    username: 'ana',
    email: 'ana@kurio.test',
    passwordHash: 'a50e4b97cd6c50391271bb9fdc4f7559824ef627ac54b42c546c18a0209781a1',
  },
  {
    id: 'user-bruno',
    name: 'Bruno Lima',
    username: 'bruno',
    email: 'bruno@kurio.test',
    passwordHash: 'ec4d2980a15559178e7409a8b37b04151b51f524660ffdf47f82b7ab2c854cef',
  },
]