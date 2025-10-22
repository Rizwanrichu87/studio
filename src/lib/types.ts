import type { LucideIcon } from "lucide-react";
import { habitIcons } from "./data";

export type Habit = {
  id: string;
  name: string;
  frequency: "daily" | "weekly" | "monthly";
  /**
   * A map where keys are date strings (e.g., "2024-05-21") and
   * values are the number of times the habit was completed on that day.
   */
  completions: { [date: string]: number };
  reminderTime?: string;
  icon: keyof typeof habitIcons;
  targetCompletions?: number; // Optional: how many times per day
};

export type User = {
  id: string;
  username: string;
  email: string;
  registrationDate: string;
  photoURL?: string;
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
