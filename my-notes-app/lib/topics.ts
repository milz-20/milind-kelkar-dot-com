import { CATEGORIES, Topic } from './notes'

export const DEFAULT_TOPICS: Topic[] = CATEGORIES
  .filter(category => category !== 'All')
  .map(category => ({
    id: `topic:${category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    category,
    name: category === 'Design' ? 'System Design' : category,
  }))

export function topicIdFromCategory(category: string) {
  const slug = category
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return `topic:${slug || 'untitled'}`
}

export function mergeTopics(storedTopics: Topic[], noteCategories: string[] = []) {
  const byCategory = new Map<string, Topic>()

  DEFAULT_TOPICS.forEach(topic => byCategory.set(topic.category, topic))

  noteCategories
    .filter(Boolean)
    .forEach(category => {
      if (!byCategory.has(category)) {
        byCategory.set(category, {
          id: topicIdFromCategory(category),
          category,
          name: category,
        })
      }
    })

  storedTopics.forEach(topic => {
    byCategory.set(topic.category, {
      ...topic,
      name: topic.name || topic.category,
    })
  })

  const defaultOrder = new Map(DEFAULT_TOPICS.map((topic, index) => [topic.category, index]))

  return Array.from(byCategory.values()).sort((a, b) => {
    const aOrder = defaultOrder.get(a.category) ?? 1000
    const bOrder = defaultOrder.get(b.category) ?? 1000
    if (aOrder !== bOrder) return aOrder - bOrder
    return a.name.localeCompare(b.name)
  })
}
