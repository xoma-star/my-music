import { NextResponse } from 'next/server';
import { getLibrary } from '@/lib/library';

export async function GET() {
  return NextResponse.json(getLibrary());
}
