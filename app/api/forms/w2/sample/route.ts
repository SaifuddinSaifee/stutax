import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "forms", "Sample_W2.jpg");
    const data = await fs.readFile(filePath);
    const copy = new Uint8Array(data.length);
    copy.set(data);
    return new NextResponse(copy.buffer, {
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Disposition": "attachment; filename=\"Sample_W2.jpg\"",
        "Cache-Control": "public, max-age=3600, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Sample W-2 not found" }, { status: 404 });
  }
}


