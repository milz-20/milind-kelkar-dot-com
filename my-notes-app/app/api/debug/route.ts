import { NextResponse } from 'next/server'
import { docClient } from '@/lib/dynamodb'
import { ScanCommand } from '@aws-sdk/lib-dynamodb'

export async function GET() {
  const result = await docClient.send(new ScanCommand({ TableName: 'Notes' }))
  return NextResponse.json({
    count: result.Count,
    items: result.Items,
  })
}