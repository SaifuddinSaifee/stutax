import { NextRequest, NextResponse } from 'next/server';
import { fillPdfFields, loadPdfFromDisk } from '@/lib/pdf';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => ({}));
    // Expecting { values: Record<string, unknown> }
    const values: Record<string, unknown> = payload?.values ?? {};
    const pdf = await loadPdfFromDisk('forms/f8843_2025_new.pdf');
    const bytes = await fillPdfFields(pdf, values);

    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="f8843_filled.pdf"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fill PDF' }, { status: 500 });
  }
}


