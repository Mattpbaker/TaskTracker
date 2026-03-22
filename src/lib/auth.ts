import { cookies } from 'next/headers'

const COOKIE_NAME = 'tasktracker_auth'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export function verifyPassword(input: string): boolean {
  return input === process.env.SITE_PASSWORD
}

export async function setAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, 'true', {
    httpOnly: true,
    sameSite: 'strict',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  })
}

export async function getAuthCookie(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get(COOKIE_NAME)?.value
}
