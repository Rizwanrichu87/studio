import { BookOpen, Award, Dumbbell, Leaf, Target, BrainCircuit, Coffee, Trophy, TrendingUp, CalendarDays, LucideIcon } from 'lucide-react';
import type { Achievement, ProgressData } from './types';

export const habitIcons: { [key: string]: LucideIcon } = {
  BookOpen,
  Dumbbell,
  Leaf,
  Target,
  BrainCircuit,
  Coffee,
};

// This mock data is no longer the primary source of truth, 
// but can be useful for styling or as a fallback.
// Habits are now fetched from Firestore.
export const mockHabits = [];

export const mockAchievements: Achievement[] = [
  { id: '1', name: 'First Step', description: 'Complete your first habit.', icon: Award, unlocked: true },
  { id: '2', name: 'Consistency King', description: 'Complete a habit 7 days in a row.', icon: Trophy, unlocked: true },
  { id: '3', name: 'On Fire!', description: 'Maintain a 14-day streak.', icon: TrendingUp, unlocked: false },
  { id: '4', name: 'Perfect Week', description: 'Complete all daily habits for 7 days.', icon: CalendarDays, unlocked: false },
  { id: '5', name: 'Habit Machine', description: 'Complete 50 habit tasks in total.', icon: BrainCircuit, unlocked: true },
  { id: '6', name: 'Newbie No More', description: 'Add 5 different habits.', icon: Target, unlocked: false },
];

// Generate mock progress data for the last 30 days
export const mockProgressData: ProgressData[] = Array.from({ length: 30 }).map((_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - i);
  // This is now just a placeholder, real progress is calculated from live data
  const completedCount = Math.floor(Math.random() * 3); 
  return {
    date: date.toISOString().split('T')[0],
    completed: completedCount
  };
}).reverse();
