import { NextResponse } from 'next/server';
import { loadPdfFromDisk, listAcroFormFields } from '@/lib/pdf';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const pdf = await loadPdfFromDisk('forms/f8843_2025_new.pdf');
    const fields = await listAcroFormFields(pdf);
    return NextResponse.json({ fields });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to read PDF fields' }, { status: 500 });
  }
}


