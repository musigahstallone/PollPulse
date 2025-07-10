'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { getPlatformSuggestions } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Lightbulb, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

const initialState = {
  suggestions: null,
  error: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lightbulb className="mr-2 h-4 w-4" />}
      Get Suggestions
    </Button>
  );
}

export default function PlatformImprover({ platformText }: { platformText: string }) {
  const [state, formAction] = useFormState(getPlatformSuggestions, initialState);
  const [currentPlatform, setCurrentPlatform] = useState(platformText);

  useEffect(() => {
    setCurrentPlatform(platformText);
  }, [platformText]);

  return (
    <div className="p-2 space-y-4">
      <form action={formAction} className="space-y-4">
        <Textarea
          name="platform"
          placeholder="Enter the candidate's platform here..."
          rows={6}
          value={currentPlatform}
          onChange={(e) => setCurrentPlatform(e.target.value)}
          className="bg-muted"
        />
        <SubmitButton />
      </form>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      {state.suggestions && (
        <Card className="mt-4 bg-background">
          <CardHeader>
            <CardTitle className="text-lg">AI Suggestions</CardTitle>
            <CardDescription>Here are some AI-powered suggestions to improve the platform:</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
              {state.suggestions}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
