"use client"
import Link from "next/link"

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function FormsPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-6 text-2xl font-semibold">Forms</h1>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Link href="/forms/w2" className="block">
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle>W-2 Form</CardTitle>
              <CardDescription>This is a paper your employer gives you every year that shows how much money you earned and how much tax was taken out of your paycheck. You use it when filing your taxes so the government knows what you already paid.</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Card className="transition-shadow hover:shadow-md">
          <CardHeader>
            <Link href="/forms/f8843" className="block">
              <CardTitle>Form 8843</CardTitle>
            </Link>
            <CardDescription>This is a form international students and certain visitors in the U.S. fill out to explain their visa status for tax purposes. Even if you didn’t earn any money, you usually still need to send it in to stay compliant.</CardDescription>
            <div className="pt-2 flex gap-2">
              <Button asChild>
                <Link href="/forms/f8843">View form</Link>
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={async () => {
                  try {
                    const res = await fetch('/api/forms/f8843/download', { cache: 'no-store' });
                    if (!res.ok) throw new Error('Failed to download');
                    const blob = await res.blob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'f8843_2025_new.pdf';
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    URL.revokeObjectURL(url);
                  } catch {
                    alert('Failed to download empty PDF');
                  }
                }}
              >
                Download Empty Form
              </Button>
            </div>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}


