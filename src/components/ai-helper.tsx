"use client";

import { useState } from "react";
import { BrainCircuit, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getMotivationalTipsAndInsights, MotivationalTipsAndInsightsOutput } from "@/ai/flows/motivational-tips-and-insights";
import { getPersonalizedHabitRecommendations } from "@/ai/flows/personalized-habit-recommendations";
import type { Habit } from "@/lib/types";

interface AIHelperProps {
  habits: Habit[];
  streaks: { current: number; longest: number };
}

export function AIHelper({ habits, streaks }: AIHelperProps) {
  const [motivation, setMotivation] = useState<MotivationalTipsAndInsightsOutput | null>(null);
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [userGoals, setUserGoals] = useState("");
  const [isMotivationLoading, setIsMotivationLoading] = useState(false);
  const [isRecommendationLoading, setIsRecommendationLoading] = useState(false);
  const { toast } = useToast();

  const handleGetMotivation = async () => {
    setIsMotivationLoading(true);
    setMotivation(null);
    try {
      const habitsCompleted = habits.reduce((acc, h) => acc + h.completed_dates.length, 0);
      // Mock data for demo purposes
      const missedDays = 5;
      const averageCompletionRate = 75;

      const result = await getMotivationalTipsAndInsights({
        habitsCompleted,
        currentStreak: streaks.current,
        longestStreak: streaks.longest,
        missedDays,
        averageCompletionRate,
      });
      setMotivation(result);
    } catch (error) {
      console.error("Error getting motivational tip:", error);
      toast({
        variant: "destructive",
        title: "AI Error",
        description: "Could not generate motivational tip. Please try again.",
      });
    } finally {
      setIsMotivationLoading(false);
    }
  };

  const handleGetRecommendations = async () => {
    if (!userGoals) {
      toast({
        variant: "destructive",
        title: "No Goals Provided",
        description: "Please describe your goals before requesting recommendations.",
      });
      return;
    }

    setIsRecommendationLoading(true);
    setRecommendation(null);
    try {
      const habitTrackingData = JSON.stringify(
        habits.map((h) => ({ name: h.name, frequency: h.frequency, completions: h.completed_dates.length }))
      );

      const result = await getPersonalizedHabitRecommendations({
        habitTrackingData,
        userGoals,
      });
      setRecommendation(result.recommendations);
    } catch (error) {
      console.error("Error getting recommendations:", error);
      toast({
        variant: "destructive",
        title: "AI Error",
        description: "Could not generate recommendations. Please try again.",
      });
    } finally {
      setIsRecommendationLoading(false);
    }
  };

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI-Powered Motivation
          </CardTitle>
          <CardDescription>
            Get a personalized motivational tip and insight based on your recent activity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleGetMotivation} disabled={isMotivationLoading}>
            {isMotivationLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Generate Insight
          </Button>
          {motivation && (
            <div className="mt-4 space-y-4 rounded-lg border bg-secondary/50 p-4">
              <div>
                <h4 className="font-semibold">Motivational Tip:</h4>
                <p className="text-sm text-muted-foreground">{motivation.motivationalTip}</p>
              </div>
              <div>
                <h4 className="font-semibold">Insight:</h4>
                <p className="text-sm text-muted-foreground">{motivation.insight}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-primary" />
            Personalized Recommendations
          </CardTitle>
          <CardDescription>
            Describe your goals and let our AI provide recommendations to optimize your habit-building journey.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea
              placeholder="e.g., I want to improve my physical health and read more non-fiction books."
              value={userGoals}
              onChange={(e) => setUserGoals(e.target.value)}
              className="min-h-[80px]"
            />
            <Button onClick={handleGetRecommendations} disabled={isRecommendationLoading}>
              {isRecommendationLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <BrainCircuit className="mr-2 h-4 w-4" />
              )}
              Get Recommendations
            </Button>
            {recommendation && (
              <div className="mt-4 rounded-lg border bg-secondary/50 p-4">
                <h4 className="font-semibold">AI Recommendations:</h4>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{recommendation}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
