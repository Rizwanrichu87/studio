'use server';

/**
 * @fileOverview Predicts the probability of a user achieving their habit goals.
 *
 * - predictSuccess - A function that predicts the likelihood of success.
 * - SuccessPredictionInput - The input type for the predictSuccess function.
 * - SuccessPredictionOutput - The return type for the predictSuccess function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuccessPredictionInputSchema = z.object({
  habitTrackingData: z
    .string()
    .describe(
      'A JSON string representing the user\'s habit tracking data, including completion rates and streaks.'
    ),
  userGoals: z.string().describe('The user\'s stated goals.'),
});
export type SuccessPredictionInput = z.infer<typeof SuccessPredictionInputSchema>;

const SuccessPredictionOutputSchema = z.object({
  successProbability: z
    .number()
    .min(0)
    .max(100)
    .describe('The predicted probability of success, from 0 to 100.'),
  predictionReason: z
    .string()
    .describe('The reasoning behind the success prediction.'),
});
export type SuccessPredictionOutput = z.infer<typeof SuccessPredictionOutputSchema>;

export async function predictSuccess(
  input: SuccessPredictionInput
): Promise<SuccessPredictionOutput> {
  return successPredictionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'successPredictionPrompt',
  input: {schema: SuccessPredictionInputSchema},
  output: {schema: SuccessPredictionOutputSchema},
  prompt: `You are an AI analyst specializing in behavioral patterns.
Based on the provided habit tracking data and user goals, predict the probability of the user successfully achieving their goals.

Habit Data: {{{habitTrackingData}}}
User Goals: {{{userGoals}}}

Provide a success probability percentage and a brief explanation for your prediction, considering factors like consistency, streak length, and completion rate.
`,
});

const successPredictionFlow = ai.defineFlow(
  {
    name: 'successPredictionFlow',
    inputSchema: SuccessPredictionInputSchema,
    outputSchema: SuccessPredictionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
