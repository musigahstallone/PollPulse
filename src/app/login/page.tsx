'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { login } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login: authLogin } = useAuth();
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const data = await login({ studentId, password });
      authLogin(data.token);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
     <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <div className="absolute top-8 left-8">
            <Link href="/" className="flex items-center gap-2 text-primary">
                <ShieldCheck className="h-8 w-8" />
                <span className="text-2xl font-bold font-headline tracking-tighter">
                    PollPulse
                </span>
            </Link>
        </div>
        <Card className="w-full max-w-sm">
            <CardHeader className="text-center">
                <CardTitle className="text-2xl">Welcome Back!</CardTitle>
                <CardDescription>Enter your Student ID and password to log in.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="studentId">Student ID</Label>
                        <Input
                            id="studentId"
                            type="text"
                            placeholder="e.g., S12345"
                            value={studentId}
                            onChange={(e) => setStudentId(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Log In
                    </Button>
                </form>
                <div className="mt-4 text-center text-sm">
                    Don&apos;t have an account?{' '}
                    <Link href="/register" className="underline text-primary">
                        Register
                    </Link>
                </div>
            </CardContent>
        </Card>
     </div>
  );
}
