export interface User {
    id: string
    name: string
    username: string
    email: string
    avatarUrl?: string
}

export interface Session {
    user: User
    token: string
    expiresAt: string
}