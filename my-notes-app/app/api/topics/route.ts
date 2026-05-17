import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getServerSession } from 'next-auth'
import { PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { docClient } from '@/lib/dynamodb'
import { Topic } from '@/lib/notes'
import { mergeTopics, topicIdFromCategory } from '@/lib/topics'

export async function GET() {
  try {
    const result = await docClient.send(new ScanCommand({ TableName: 'Notes' }))
    const items = result.Items ?? []
    const storedTopics = items
      .filter(item => item.itemType === 'topic')
      .map(item => ({
        id: item.id,
        category: item.category,
        name: item.name,
        description: item.description,
      })) as Topic[]
    const noteCategories = items
      .filter(item => item.itemType !== 'topic')
      .map(item => String(item.category || ''))

    return NextResponse.json(mergeTopics(storedTopics, noteCategories))
  } catch (err) {
    console.error('GET /api/topics error:', err)
    return NextResponse.json({ error: 'Failed to fetch topics' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const name = String(body.name || '').trim()
    const description = String(body.description || '').trim()

    if (!name) {
      return NextResponse.json({ error: 'Topic name is required' }, { status: 400 })
    }

    const topic: Topic & { itemType: string; createdAt: string } = {
      id: `${topicIdFromCategory(name)}-${randomUUID().slice(0, 8)}`,
      itemType: 'topic',
      category: name,
      name,
      description,
      createdAt: new Date().toISOString(),
    }

    await docClient.send(new PutCommand({ TableName: 'Notes', Item: topic }))
    return NextResponse.json(topic, { status: 201 })
  } catch (err) {
    console.error('POST /api/topics error:', err)
    return NextResponse.json({ error: 'Failed to create topic' }, { status: 500 })
  }
}
