import { NextRequest, NextResponse } from 'next/server'
import { docClient } from '@/lib/dynamodb'
import { ScanCommand, PutCommand } from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'crypto'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function GET() {
  try {
    const result = await docClient.send(new ScanCommand({ TableName: 'Notes' }))
    const notes = (result.Items ?? [])
      .filter(item => item.itemType !== 'topic')
      .sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    return NextResponse.json(notes)
  } catch (err) {
    console.error('GET /api/notes error:', err)
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await req.json()
    const { title, content, category, tags } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const note = {
      id: randomUUID(),
      title: title.trim(),
      content,
      preview: content.replace(/<[^>]*>/g, '').slice(0, 160).trim(),
      category: category || 'Other',
      tags: tags ?? [],
      date: new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
      }),
    }

    await docClient.send(new PutCommand({ TableName: 'Notes', Item: note }))
    return NextResponse.json(note, { status: 201 })
  } catch (err) {
    console.error('POST /api/notes error:', err)
    return NextResponse.json({ error: 'Failed to save note' }, { status: 500 })
  }
}
