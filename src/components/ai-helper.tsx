"use client";

import { useState } from "react";
import { BrainCircuit, Loader2, Sparkles, AlertTriangle, TrendingUp, Search } from "lucide-react";
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
import { getPersonalizedHabitRecommendations, PersonalizedHabitRecommendationsOutput } from "@/ai/flows/personalized-habit-recommendations";
import { predictSuccess, SuccessPredictionOutput } from "@/ai/flows/success-prediction";
import { detectHabitCollisions, HabitCollisionDetectionOutput } from "@/ai/flows/habit-collision-detection";
import type { Habit } from "@/lib/types";
import { Progress } from "./ui/progress";

interface AIHelperProps {
  habits: Habit[];
  streaks: { current: number; longest: number };
}

export function AIHelper({ habits, streaks }: AIHelperProps) {
  const [motivation, setMotivation] = useState<MotivationalTipsAndInsightsOutput | null>(null);
  const [recommendation, setRecommendation] = useState<PersonalizedHabitRecommendationsOutput | null>(null);
  const [successPrediction, setSuccessPrediction] = useState<SuccessPredictionOutput | null>(null);
  const [habitCollisions, setHabitCollisions] = useState<HabitCollisionDetectionOutput | null>(null);
  const [userGoals, setUserGoals] = useState("");
  const [isLoading, setIsLoading] = useState({
    motivation: false,
    recommendation: false,
    prediction: false,
    collision: false,
  });
  const { toast } = useToast();

  const handleGetMotivation = async () => {
    setIsLoading(prev => ({ ...prev, motivation: true }));
    setMotivation(null);
    try {
      const habitsCompleted = habits.reduce((acc, h) => acc + Object.values(h.completions).reduce((a, b) => a + b, 0), 0);
      const missedDays = 5; // Mock data
      const averageCompletionRate = 75; // Mock data

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
      toast({ variant: "destructive", title: "AI Error", description: "Could not generate motivational tip." });
    } finally {
      setIsLoading(prev => ({ ...prev, motivation: false }));
    }
  };

  const handleGetRecommendations = async () => {
    if (!userGoals) {
      toast({ variant: "destructive", title: "No Goals Provided", description: "Please describe your goals." });
      return;
    }
    setIsLoading(prev => ({ ...prev, recommendation: true }));
    setRecommendation(null);
    try {
      const habitTrackingData = JSON.stringify(habits.map(h => ({ name: h.name, completions: h.completions })));
      const result = await getPersonalizedHabitRecommendations({ habitTrackingData, userGoals });
      setRecommendation(result);
    } catch (error) {
      console.error("Error getting recommendations:", error);
      toast({ variant: "destructive", title: "AI Error", description: "Could not generate recommendations." });
    } finally {
      setIsLoading(prev => ({ ...prev, recommendation: false }));
    }
  };

  const handlePredictSuccess = async () => {
    if (!userGoals) {
      toast({ variant: "destructive", title: "No Goals Provided", description: "Please describe your goals." });
      return;
    }
    setIsLoading(prev => ({ ...prev, prediction: true }));
    setSuccessPrediction(null);
    try {
      const totalCompletions = habits.reduce((acc, h) => acc + Object.values(h.completions).reduce((a, b) => a + b, 0), 0);
      const totalTargets = habits.reduce((acc, h) => acc + (Object.keys(h.completions).length * (h.targetCompletions || 1)), 0);

      const habitTrackingData = JSON.stringify({
        streaks,
        completionRate: totalTargets > 0 ? (totalCompletions / totalTargets) * 100 : 0,
      });
      const result = await predictSuccess({ habitTrackingData, userGoals });
      setSuccessPrediction(result);
    } catch (error) {
      console.error("Error predicting success:", error);
      toast({ variant: "destructive", title: "AI Error", description: "Could not generate prediction." });
    } finally {
      setIsLoading(prev => ({ ...prev, prediction: false }));
    }
  };

  const handleDetectCollisions = async () => {
    setIsLoading(prev => ({ ...prev, collision: true }));
    setHabitCollisions(null);
    try {
      const habitsWithReminders = habits.filter(h => h.reminderTime).map(h => ({ name: h.name, reminderTime: h.reminderTime, frequency: h.frequency }));
      const result = await detectHabitCollisions({ habits: JSON.stringify(habitsWithReminders) });
      setHabitCollisions(result);
    } catch (error) {
      console.error("Error detecting collisions:", error);
      toast({ variant: "destructive", title: "AI Error", description: "Could not detect collisions." });
    } finally {
      setIsLoading(prev => ({ ...prev, collision: false }));
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
          <CardDescription>Get personalized tips and insights based on your activity.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleGetMotivation} disabled={isLoading.motivation}>
            {isLoading.motivation ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Generate Motivation
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
            AI Coach
          </CardTitle>
          <CardDescription>Describe your goals and let our AI provide recommendations.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea
              placeholder="e.g., I want to improve my physical health and read more."
              value={userGoals}
              onChange={(e) => setUserGoals(e.target.value)}
              className="min-h-[80px]"
            />
            <Button onClick={handleGetRecommendations} disabled={isLoading.recommendation}>
              {isLoading.recommendation ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
              Get Recommendations
            </Button>
            {recommendation && (
              <div className="mt-4 space-y-4 rounded-lg border bg-secondary/50 p-4">
                <div>
                  <h4 className="font-semibold">Recommendations:</h4>
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">{recommendation.recommendations}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Pattern Detection:</h4>
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">{recommendation.patternDetection}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Optimal Time Suggestion:</h4>
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">{recommendation.optimalTimeSuggestion}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Success Prediction
          </CardTitle>
          <CardDescription>Predict the probability of achieving your goals.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handlePredictSuccess} disabled={isLoading.prediction || !userGoals}>
            {isLoading.prediction ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <TrendingUp className="mr-2 h-4 w-4" />}
            Predict Success
          </Button>
           {successPrediction && (
              <div className="mt-4 space-y-4 rounded-lg border bg-secondary/50 p-4">
                 <div>
                    <h4 className="font-semibold">Success Probability: {Math.round(successPrediction.successProbability)}%</h4>
                    <Progress value={successPrediction.successProbability} className="mt-2" />
                </div>
                <div>
                  <h4 className="font-semibold">Reasoning:</h4>
                  <p className="text-sm text-muted-foreground">{successPrediction.predictionReason}</p>
                </div>
              </div>
            )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-primary" />
            Habit Collision Detection
          </CardTitle>
          <CardDescription>Check for overlapping habit schedules.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleDetectCollisions} disabled={isLoading.collision}>
            {isLoading.collision ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            Detect Collisions
          </Button>
          {habitCollisions && (
            <div className="mt-4 space-y-4 rounded-lg border bg-secondary/50 p-4">
              {habitCollisions.collisions.length > 0 ? (
                habitCollisions.collisions.map((collision, index) => (
                  <div key={index}>
                    <h4 className="font-semibold">Collision: {collision.habitA} & {collision.habitB}</h4>
                    <p className="text-sm text-muted-foreground">{collision.reason}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No collisions detected!</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
