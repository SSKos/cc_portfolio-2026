import { auth } from './auth'
import { NextResponse } from 'next/server'

/**
 * Проверяет сессию. Вызывать в каждом admin API-роуте.
 *
 * @example
 * const { error } = await requireSession()
 * if (error) return error
 */
export async function requireSession() {
  const session = await auth()
  if (!session?.user) {
    return {
      session: null,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    } as const
  }
  return { session, error: null } as const
}
