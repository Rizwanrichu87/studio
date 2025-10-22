'use server';

/**
 * @fileOverview Detects and alerts about overlapping habit schedules.
 *
 * - detectHabitCollisions - A function that identifies habits with conflicting schedules.
 * - HabitCollisionDetectionInput - The input type for the detectHabitCollisions function.
 * - HabitCollisionDetectionOutput - The return type for the detectHabitCollisions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const HabitCollisionDetectionInputSchema = z.object({
  habits: z
    .string()
    .describe(
      'A JSON string representing the user\'s habits, including names, frequencies, and reminder times.'
    ),
});
export type HabitCollisionDetectionInput = z.infer<
  typeof HabitCollisionDetectionInputSchema
>;

const HabitCollisionDetectionOutputSchema = z.object({
  collisions: z
    .array(
      z.object({
        habitA: z.string(),
        habitB: z.string(),
        reason: z.string(),
      })
    )
    .describe('A list of detected collisions between habits.'),
});
export type HabitCollisionDetectionOutput = z.infer<
  typeof HabitCollisionDetectionOutputSchema
>;

export async function detectHabitCollisions(
  input: HabitCollisionDetectionInput
): Promise<HabitCollisionDetectionOutput> {
  return habitCollisionDetectionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'habitCollisionDetectionPrompt',
  input: {schema: HabitCollisionDetectionInputSchema},
  output: {schema: HabitCollisionDetectionOutputSchema},
  prompt: `You are an AI assistant that helps users identify conflicting habits.
Analyze the following list of habits and their schedules to find any potential collisions.
A collision occurs if two habits have reminder times that are too close together on the same day.

Habits Data: {{{habits}}}

Identify pairs of habits that might overlap and provide a brief reason for the collision.
Return an empty array if there are no collisions.`,
});

const habitCollisionDetectionFlow = ai.defineFlow(
  {
    name: 'habitCollisionDetectionFlow',
    inputSchema: HabitCollisionDetectionInputSchema,
    outputSchema: HabitCollisionDetectionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
