import type { LucideIcon } from "lucide-react";

export type Habit = {
  id: string;
  name: string;
  frequency: "daily" | "weekly" | "monthly";
  completed_dates: string[]; // Store dates as ISO strings e.g. "2024-05-21"
  reminderTime?: string;
  icon: LucideIcon;
};

export type Achievement = {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  unlocked: boolean;
};

export type ProgressData = {
  date: string;
  completed: number;
};
