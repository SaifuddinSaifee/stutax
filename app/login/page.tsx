'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSession } from '@/hooks/use-session';

type Step = 'email' | 'register' | 'done';

export default function LoginPage() {
  const [step, setStep] = useState<Step>('email');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [suffix, setSuffix] = useState('');
  const [dob, setDob] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { setEmail: setSessionEmail } = useSession();

  async function checkEmail() {
    setError(null);
    if (!email) {
      setError('Please enter your email');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/users?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        // Found user -> consider them "logged in"
        setStep('done');
        setSessionEmail(email);
        router.push('/profile');
        return;
      }
      if (res.status === 404) {
        setStep('register');
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? 'Something went wrong');
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  async function register() {
    setError(null);
    if (!firstName || !lastName || !dob || !email) {
      setError('Please fill all fields');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, middleName, lastName, suffix, dateOfBirth: dob, email }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? 'Failed to register');
      }
      setStep('done');
      setSessionEmail(email);
      router.push('/profile');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="mb-4 text-2xl font-semibold">Login</h1>
      {error && (
        <div className="mb-4 text-sm text-red-600">{error}</div>
      )}
      {step === 'email' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <Button disabled={loading} onClick={checkEmail}>
            {loading ? 'Checking…' : 'Continue'}
          </Button>
        </div>
      )}

      {step === 'register' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="first-name">First name</Label>
            <Input id="first-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="middle-name">Middle name (optional)</Label>
            <Input id="middle-name" value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last-name">Last name</Label>
            <Input id="last-name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="suffix">Suffix (optional)</Label>
            <Input id="suffix" value={suffix} onChange={(e) => setSuffix(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dob">Date of birth</Label>
            <Input id="dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-email">Email</Label>
            <Input id="reg-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" disabled={loading} onClick={() => setStep('email')}>
              Back
            </Button>
            <Button disabled={loading} onClick={register}>
              {loading ? 'Submitting…' : 'Create account'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}


