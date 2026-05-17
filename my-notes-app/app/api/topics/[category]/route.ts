import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { docClient } from '@/lib/dynamodb'
import { topicIdFromCategory } from '@/lib/topics'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ category: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { category: rawCategory } = await params
    const category = decodeURIComponent(rawCategory)
    const body = await req.json()
    const name = String(body.name || '').trim()
    const description = String(body.description || '').trim()

    if (!category || !name) {
      return NextResponse.json({ error: 'Topic name is required' }, { status: 400 })
    }

    const existing = await docClient.send(new ScanCommand({
      TableName: 'Notes',
      FilterExpression: 'itemType = :topic AND category = :category',
      ExpressionAttributeValues: {
        ':topic': 'topic',
        ':category': category,
      },
    }))

    const existingId = existing.Items?.[0]?.id
    const topic = {
      id: existingId || topicIdFromCategory(category),
      itemType: 'topic',
      category,
      name,
      description,
      updatedAt: new Date().toISOString(),
    }

    await docClient.send(new PutCommand({ TableName: 'Notes', Item: topic }))
    return NextResponse.json(topic)
  } catch (err) {
    console.error('PUT /api/topics/[category] error:', err)
    return NextResponse.json({ error: 'Failed to rename topic' }, { status: 500 })
  }
}
