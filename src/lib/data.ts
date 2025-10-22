import { BookOpen, Award, Dumbbell, Leaf, Target, BrainCircuit, Coffee, Trophy, TrendingUp, CalendarDays, LucideIcon } from 'lucide-react';
import type { Habit, Achievement, ProgressData } from './types';

export const habitIcons: { [key: string]: LucideIcon } = {
  BookOpen,
  Dumbbell,
  Leaf,
  Target,
  BrainCircuit,
  Coffee,
};

export const mockHabits: Habit[] = [
  { id: '1', name: 'Read for 20 minutes', frequency: 'daily', completed_dates: ['2024-07-20', '2024-07-21', '2024-07-23'], icon: 'BookOpen', reminderTime: '08:00' },
  { id: '2', name: 'Morning workout', frequency: 'daily', completed_dates: ['2024-07-20', '2024-07-22', '2024-07-23'], icon: 'Dumbbell', reminderTime: '06:30' },
  { id: '3', name: 'Meditate for 10 minutes', frequency: 'daily', completed_dates: ['2024-07-21', '2024-07-22'], icon: 'Leaf' },
  { id: '4', name: 'Weekly goal review', frequency: 'weekly', completed_dates: ['2024-07-21'], icon: 'Target' },
  { id: '5', name: 'Practice new skill', frequency: 'daily', completed_dates: ['2024-07-20', '2024-07-21', '2024-07-22', '2024-07-23'], icon: 'BrainCircuit', reminderTime: '18:00' },
  { id: '6', name: 'No coffee after 3 PM', frequency: 'daily', completed_dates: [], icon: 'Coffee' },
];

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
  const completedCount = Math.floor(Math.random() * (mockHabits.length - 1)); // Random number of completed habits
  return {
    date: date.toISOString().split('T')[0],
    completed: completedCount
  };
}).reverse();
