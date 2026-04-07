import { NextResponse } from 'next/server';
import manifest from '../../../../public/manifest.json';

export async function GET() {
  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
