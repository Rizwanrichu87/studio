'use server';
/**
 * @fileOverview Provides motivational tips and insights to users based on their habit tracking progress.
 *
 * This file exports:
 * - `getMotivationalTipsAndInsights`: A function to generate personalized motivational tips and insights.
 * - `MotivationalTipsAndInsightsInput`: The input type for the `getMotivationalTipsAndInsights` function.
 * - `MotivationalTipsAndInsightsOutput`: The output type for the `getMotivationalTipsAndInsights` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MotivationalTipsAndInsightsInputSchema = z.object({
  habitsCompleted: z
    .number()
    .describe('The total number of habits completed by the user.'),
  currentStreak: z
    .number()
    .describe('The current streak of consecutive days the user has maintained their habits.'),
  longestStreak: z
    .number()
    .describe('The longest streak of consecutive days the user has ever maintained their habits.'),
  missedDays: z
    .number()
    .describe('The number of days the user has missed completing their habits.'),
  averageCompletionRate: z
    .number()
    .describe('The average completion rate of habits over the past week (0-100).'),
});
export type MotivationalTipsAndInsightsInput = z.infer<
  typeof MotivationalTipsAndInsightsInputSchema
>;

const MotivationalTipsAndInsightsOutputSchema = z.object({
  motivationalTip: z
    .string()
    .describe('A personalized motivational tip for the user.'),
  insight: z
    .string()
    .describe('An insight based on the user activity and patterns.'),
});
export type MotivationalTipsAndInsightsOutput = z.infer<
  typeof MotivationalTipsAndInsightsOutputSchema
>;

export async function getMotivationalTipsAndInsights(
  input: MotivationalTipsAndInsightsInput
): Promise<MotivationalTipsAndInsightsOutput> {
  return motivationalTipsAndInsightsFlow(input);
}

const motivationalTipsAndInsightsPrompt = ai.definePrompt({
  name: 'motivationalTipsAndInsightsPrompt',
  input: {schema: MotivationalTipsAndInsightsInputSchema},
  output: {schema: MotivationalTipsAndInsightsOutputSchema},
  prompt: `You are an AI assistant designed to provide motivational tips and insights to users to help them maintain their habits.

  Based on the following user data, generate a motivational tip and an insight:

  Habits Completed: {{{habitsCompleted}}}
  Current Streak: {{{currentStreak}}}
  Longest Streak: {{{longestStreak}}}
  Missed Days: {{{missedDays}}}
  Average Completion Rate: {{{averageCompletionRate}}}%

  Motivational Tip: A short, encouraging tip to keep the user motivated.
  Insight: An observation or suggestion based on the user's patterns and progress.
  `,
});

const motivationalTipsAndInsightsFlow = ai.defineFlow(
  {
    name: 'motivationalTipsAndInsightsFlow',
    inputSchema: MotivationalTipsAndInsightsInputSchema,
    outputSchema: MotivationalTipsAndInsightsOutputSchema,
  },
  async input => {
    const {output} = await motivationalTipsAndInsightsPrompt(input);
    return output!;
  }
);
