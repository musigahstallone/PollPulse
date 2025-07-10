'use server';

/**
 * @fileOverview A platform improvement suggestion AI agent.
 *
 * - platformImprovementSuggestions - A function that handles the platform improvement process.
 * - PlatformImprovementSuggestionsInput - The input type for the platformImprovementSuggestions function.
 * - PlatformImprovementSuggestionsOutput - The return type for the platformImprovementSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PlatformImprovementSuggestionsInputSchema = z.object({
  platform: z
    .string()
    .describe('The candidate platform that needs improvement.'),
});
export type PlatformImprovementSuggestionsInput = z.infer<typeof PlatformImprovementSuggestionsInputSchema>;

const PlatformImprovementSuggestionsOutputSchema = z.object({
  suggestions: z
    .string()
    .describe('Suggestions for improving the candidate platform.'),
});
export type PlatformImprovementSuggestionsOutput = z.infer<typeof PlatformImprovementSuggestionsOutputSchema>;

export async function platformImprovementSuggestions(input: PlatformImprovementSuggestionsInput): Promise<PlatformImprovementSuggestionsOutput> {
  return platformImprovementSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'platformImprovementSuggestionsPrompt',
  input: {schema: PlatformImprovementSuggestionsInputSchema},
  output: {schema: PlatformImprovementSuggestionsOutputSchema},
  prompt: `You are a political campaign expert specializing in refining candidate platforms.

  You will use the following platform as the primary source of information. Provide suggestions for improving the platform for clarity, completeness, and persuasiveness.

Platform: {{{platform}}}`,
});

const platformImprovementSuggestionsFlow = ai.defineFlow(
  {
    name: 'platformImprovementSuggestionsFlow',
    inputSchema: PlatformImprovementSuggestionsInputSchema,
    outputSchema: PlatformImprovementSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
