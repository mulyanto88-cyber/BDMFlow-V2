import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ user: null })
}

export async function POST() {
  return NextResponse.json({ error: 'Auth belum tersedia.' }, { status: 503 })
}
