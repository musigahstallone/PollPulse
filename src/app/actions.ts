'use server';

import {
  platformImprovementSuggestions,
  type PlatformImprovementSuggestionsInput,
} from '@/ai/flows/platform-improvement-suggestions';
import { z } from 'zod';

const formSchema = z.object({
  platform: z.string().min(10, 'Platform description must be at least 10 characters.'),
});


export async function getPlatformSuggestions(prevState: any, formData: FormData) {
  const validatedFields = formSchema.safeParse({
    platform: formData.get('platform'),
  });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors.platform?.[0] || "Invalid input."
    };
  }

  try {
    const input: PlatformImprovementSuggestionsInput = { platform: validatedFields.data.platform };
    const result = await platformImprovementSuggestions(input);
    return { suggestions: result.suggestions, error: null };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to get suggestions from AI. Please try again later.', suggestions: null };
  }
}
