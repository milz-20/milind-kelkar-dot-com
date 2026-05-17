export type Note = {
  id: string
  title: string
  preview: string
  content: string
  category: string
  tags: string[]
  date: string
}

export type Topic = {
  id: string
  category: string
  name: string
  description?: string
}

export const CATEGORIES = [
  'All',
  'AWS',
  'Java',
  'Computer Fundamentals',
  'Node.js',
  'Next.js',
  'Web Vulnerabilities',
  'DDD',
  'Design',
  'Other',
]
