'use server';

/**
 * @fileOverview Provides personalized habit recommendations based on user tracking data.
 *
 * - getPersonalizedHabitRecommendations - A function that generates personalized habit recommendations.
 * - PersonalizedHabitRecommendationsInput - The input type for the getPersonalizedHabitRecommendations function.
 * - PersonalizedHabitRecommendationsOutput - The return type for the getPersonalizedHabitRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedHabitRecommendationsInputSchema = z.object({
  habitTrackingData: z
    .string()
    .describe(
      'A string containing the user habit tracking data, including habit names, completion timestamps, and any notes.'
    ),
  userGoals: z
    .string()
    .describe('A description of the user goals and motivations for habit tracking.'),
});
export type PersonalizedHabitRecommendationsInput = z.infer<
  typeof PersonalizedHabitRecommendationsInputSchema
>;

const PersonalizedHabitRecommendationsOutputSchema = z.object({
  recommendations: z
    .string()
    .describe(
      'A string containing personalized recommendations for optimizing habits, such as suggesting optimal times or identifying potential roadblocks.'
    ),
    patternDetection: z.string().describe('Identifies days users commonly miss habits and why.'),
    optimalTimeSuggestion: z.string().describe('Recommends best times for new habits based on history.'),
});
export type PersonalizedHabitRecommendationsOutput = z.infer<
  typeof PersonalizedHabitRecommendationsOutputSchema
>;

export async function getPersonalizedHabitRecommendations(
  input: PersonalizedHabitRecommendationsInput
): Promise<PersonalizedHabitRecommendationsOutput> {
  return personalizedHabitRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedHabitRecommendationsPrompt',
  input: {schema: PersonalizedHabitRecommendationsInputSchema},
  output: {schema: PersonalizedHabitRecommendationsOutputSchema},
  prompt: `You are an AI habit coach. Analyze the user's habit tracking data and goals to provide personalized recommendations.

Habit Tracking Data: {{{habitTrackingData}}}

User Goals: {{{userGoals}}}

1.  **Recommendations**: Provide specific and actionable recommendations to improve consistency and achieve their goals.
2.  **Pattern Detection**: Identify any patterns in the data, such as days when habits are commonly missed.
3.  **Optimal Time Suggestion**: Based on the user's successful completions, recommend the best times of day to perform their habits.
`,
});

const personalizedHabitRecommendationsFlow = ai.defineFlow(
  {
    name: 'personalizedHabitRecommendationsFlow',
    inputSchema: PersonalizedHabitRecommendationsInputSchema,
    outputSchema: PersonalizedHabitRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
