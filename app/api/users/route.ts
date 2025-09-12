import { NextRequest, NextResponse } from 'next/server';
import { addUser, findUserByEmail, updateUserById } from '@/routes/users';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const user = await addUser(body);
    return NextResponse.json(user, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create user';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let email = searchParams.get('email');
    if (!email) {
      const headerEmail = req.headers.get('x-user-email');
      if (headerEmail && headerEmail.trim().length > 0) email = headerEmail;
    }
    if (!email) return NextResponse.json({ error: 'email is required' }, { status: 400 });
    const user = await findUserByEmail(email);
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(user);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch user';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
    const updates = await req.json();
    const user = await updateUserById(id, updates);
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(user);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update user';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


