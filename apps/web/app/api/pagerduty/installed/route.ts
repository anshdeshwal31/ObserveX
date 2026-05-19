import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const received = Object.fromEntries(searchParams.entries())

  return NextResponse.json({
    ok: true,
    received,
    message: 'PagerDuty install redirect received',
  })
}
