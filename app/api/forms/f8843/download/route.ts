import { promises as fs } from "fs";
import { join } from "path";

export async function GET() {
  try {
    const filePath = join(process.cwd(), "forms", "f8843_2025_new.pdf");
    const fileBuffer = await fs.readFile(filePath);
    const body = new Uint8Array(fileBuffer);

    return new Response(body, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="f8843_2025_new.pdf"',
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("File not found", { status: 404 });
  }
}


