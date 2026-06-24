export function getWeekNumber(date: Date): { week: number; year: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return { week, year: d.getUTCFullYear() }
}

export function getCurrentWeek() {
  return getWeekNumber(new Date())
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = Math.floor((now - then) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return formatDate(dateStr)
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

export const CATEGORY_COLORS: Record<string, string> = {
  'Best Hide': 'text-purple-400 bg-purple-400/10',
  'Best Camouflage': 'text-blue-400 bg-blue-400/10',
  'Funniest Hide': 'text-pink-400 bg-pink-400/10',
  'Best Beginner Hide': 'text-green-400 bg-green-400/10',
  'Impossible Hide': 'text-red-400 bg-red-400/10',
}

export const MAPS = [
  'Hide-and-Seek Mansion',
  'Sewer',
  'Backrooms',
  'Indoor Country',
  'Penguin Hotel',
  'Sugar Land',
  'Osaka',
  'Apartment',
  'Art Gallery',
  'Swimming Pool',
  'Minecraft House',
  'Minecraft',
  'Simpsons Family House',
  'CS2 Mirage',
  'Meeting Room',
  'Bikini Bottom',
  'Minepops',
  'Restaurant Building',
  'Viking Dining',
  'The Market',
] as const
export const CATEGORIES = [
  'Best Hide',
  'Best Camouflage',
  'Funniest Hide',
  'Best Beginner Hide',
  'Impossible Hide',
] as const
