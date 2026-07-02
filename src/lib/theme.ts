import 'server-only'
import { headers } from 'next/headers'

export type Theme = 'dark' | 'light' | 'pokemon'
export const THEMES: Theme[] = ['dark', 'light', 'pokemon']
export const DEFAULT_THEME: Theme = 'dark'

export async function getTheme(): Promise<Theme> {
  const headersList = await headers()
  const theme = headersList.get('x-theme')
  if (theme === 'dark' || theme === 'light' || theme === 'pokemon') return theme
  return DEFAULT_THEME
}
