import { NextRequest, NextResponse } from 'next/server'
import { docClient } from '@/lib/dynamodb'
import { GetCommand, DeleteCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('Fetching note with id:', id)
    const result = await docClient.send(new GetCommand({
      TableName: 'Notes',
      Key: { id },
    }))
    if (!result.Item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(result.Item)
  } catch (err) {
    console.error('GET /api/notes/[id] error:', err)
    return NextResponse.json({ error: 'Failed to fetch note' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await docClient.send(new DeleteCommand({
      TableName: 'Notes',
      Key: { id },
    }))
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/notes/[id] error:', err)
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { title, content, category, tags } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    await docClient.send(new UpdateCommand({
      TableName: 'Notes',
      Key: { id },
      UpdateExpression: 'SET title = :title, content = :content, preview = :preview, category = :category, tags = :tags',
      ExpressionAttributeValues: {
        ':title': title.trim(),
        ':content': content,
        ':preview': content.replace(/<[^>]*>/g, '').slice(0, 160).trim(),
        ':category': category || 'Other',
        ':tags': tags ?? [],
      },
    }))

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('PUT /api/notes/[id] error:', err)
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 })
  }
}