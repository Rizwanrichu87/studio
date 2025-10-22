"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  BarChart,
  Bell,
  CheckCircle2,
  Flame,
  LayoutDashboard,
  LogOut,
  PlusCircle,
  Settings,
  Target,
  Trophy,
  XCircle,
} from "lucide-react";
import Logo from "./logo";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { StatCard } from "./stat-card";
import {
  mockHabits,
  mockAchievements,
  mockProgressData,
} from "@/lib/data";
import { useState, useMemo, useEffect } from "react";
import type { Habit, Achievement } from "@/lib/types";
import { AddHabitDialog } from "./add-habit-dialog";
import { AIHelper } from "./ai-helper";
import { Calendar } from "./ui/calendar";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";
import { Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from "@/lib/utils";


export default function Dashboard() {
  const [habits, setHabits] = useState<Habit[]>(mockHabits);
  const [achievements, setAchievements] = useState<Achievement[]>(mockAchievements);
  const [today, setToday] = useState(new Date());

  const userAvatar = PlaceHolderImages.find(p => p.id === 'user-avatar-1');

  const todayISO = today.toISOString().split("T")[0];

  const toggleHabitCompletion = (habitId: string, completed: boolean) => {
    setHabits(habits.map(h => {
      if (h.id === habitId) {
        const newCompletedDates = new Set(h.completed_dates);
        if (completed) {
          newCompletedDates.add(todayISO);
        } else {
          newCompletedDates.delete(todayISO);
        }
        return { ...h, completed_dates: Array.from(newCompletedDates) };
      }
      return h;
    }));
  };
  
  const handleAddHabit = (newHabit: Omit<Habit, 'id' | 'completed_dates'>) => {
    const habitToAdd: Habit = {
      ...newHabit,
      id: Date.now().toString(),
      completed_dates: [],
    };
    setHabits(prev => [...prev, habitToAdd]);
  };
  
  const isHabitCompletedToday = (habit: Habit) => {
    return habit.completed_dates.includes(todayISO);
  };
  
  const dailyHabits = habits.filter(h => h.frequency === 'daily');
  const weeklyHabits = habits.filter(h => h.frequency === 'weekly');
  const monthlyHabits = habits.filter(h => h.frequency === 'monthly');

  const habitsForToday = useMemo(() => {
    const dayOfWeek = today.getDay(); // Sunday - 0, ...
    const date = today.getDate();

    return habits.filter(habit => {
      if (habit.frequency === 'daily') return true;
      if (habit.frequency === 'weekly' && dayOfWeek === 1) return true; // Assuming weekly habits are on Mondays
      if (habit.frequency === 'monthly' && date === 1) return true; // Assuming monthly habits are on the 1st
      return false;
    });
  }, [habits, today]);

  const completedTodayCount = habitsForToday.filter(isHabitCompletedToday).length;
  const completionPercentage = habitsForToday.length > 0 ? Math.round((completedTodayCount / habitsForToday.length) * 100) : 0;

  // Streak calculation
  const streaks = useMemo(() => {
    let longestStreak = 0;
    let currentStreak = 0;

    if (habits.length > 0) {
        const allCompletionDates = new Set(habits.flatMap(h => h.completed_dates));
        const sortedDates = Array.from(allCompletionDates).sort();

        if (sortedDates.length > 0) {
            let streak = 0;
            let lastDate: Date | null = null;
            
            // Check for current streak
            let tempCurrentStreak = 0;
            const todayStr = new Date().toISOString().split('T')[0];
            let checkDate = new Date();

            if (allCompletionDates.has(todayStr)) {
                tempCurrentStreak = 1;
                checkDate.setDate(checkDate.getDate() - 1);
                while(allCompletionDates.has(checkDate.toISOString().split('T')[0])) {
                    tempCurrentStreak++;
                    checkDate.setDate(checkDate.getDate() - 1);
                }
            } else {
                 const yesterday = new Date();
                 yesterday.setDate(yesterday.getDate() - 1);
                 if (allCompletionDates.has(yesterday.toISOString().split('T')[0])) {
                    checkDate = yesterday;
                    tempCurrentStreak = 1;
                    checkDate.setDate(checkDate.getDate() - 1);
                    while(allCompletionDates.has(checkDate.toISOString().split('T')[0])) {
                        tempCurrentStreak++;
                        checkDate.setDate(checkDate.getDate() - 1);
                    }
                 }
            }
            currentStreak = tempCurrentStreak;
            
            // Check for longest streak
            for (let i = 0; i < sortedDates.length; i++) {
                const currentDate = new Date(sortedDates[i] + 'T00:00:00');
                if (lastDate && (currentDate.getTime() - lastDate.getTime()) === (24 * 60 * 60 * 1000)) {
                    streak++;
                } else {
                    streak = 1;
                }
                if (streak > longestStreak) {
                    longestStreak = streak;
                }
                lastDate = currentDate;
            }
        }
    }
    return { current: currentStreak, longest: longestStreak };
  }, [habits]);
  
  // UseEffect for notifications
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }

    habits.forEach(habit => {
      if (habit.reminderTime && Notification.permission === 'granted') {
        const [hours, minutes] = habit.reminderTime.split(':');
        const now = new Date();
        const reminderDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), Number(hours), Number(minutes));
        
        if (reminderDate > now && !isHabitCompletedToday(habit)) {
          const timeout = reminderDate.getTime() - now.getTime();
          const timerId = setTimeout(() => {
            new Notification('Habit Reminder', {
              body: `Time to complete your habit: ${habit.name}`,
              icon: '/logo.svg' // Assuming you have a logo in public
            });
          }, timeout);
          
          return () => clearTimeout(timerId);
        }
      }
    });
  }, [habits, today]);


  const chartData = mockProgressData.slice(-7).map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
    completed: d.completed,
  }));

  const chartConfig: ChartConfig = {
    completed: {
      label: 'Completed',
      color: 'hsl(var(--primary))',
    },
  };

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 lg:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-[60px] items-center border-b px-6">
            <a href="/" className="flex items-center gap-2 font-semibold">
              <Logo className="h-6 w-6 text-primary" />
              <span className="">AI Habitual</span>
            </a>
            <Button variant="outline" size="icon" className="ml-auto h-8 w-8">
              <Bell className="h-4 w-4" />
              <span className="sr-only">Toggle notifications</span>
            </Button>
          </div>
          <div className="flex-1 overflow-auto py-2">
            <nav className="grid items-start px-4 text-sm font-medium">
              <a
                href="#"
                className="flex items-center gap-3 rounded-lg bg-muted px-3 py-2 text-primary transition-all hover:text-primary"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </a>
              <a
                href="#"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              >
                <Trophy className="h-4 w-4" />
                Achievements
              </a>
              <a
                href="#"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              >
                <Settings className="h-4 w-4" />
                Settings
              </a>
            </nav>
          </div>
          <div className="mt-auto p-4">
             <AIHelper habits={habits} streaks={streaks} />
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 lg:h-[60px] items-center gap-4 border-b bg-muted/40 px-6">
          <a href="#" className="lg:hidden">
            <Logo className="h-6 w-6 text-primary" />
            <span className="sr-only">Home</span>
          </a>
          <div className="w-full flex-1">
            {/* Can add a search bar here if needed */}
          </div>
          <AddHabitDialog onHabitAdd={handleAddHabit}>
             <Button size="sm" className="gap-1">
                <PlusCircle className="h-4 w-4" />
                New Habit
             </Button>
          </AddHabitDialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full border w-8 h-8"
              >
                <Avatar className="h-8 w-8">
                  {userAvatar && <AvatarImage src={userAvatar.imageUrl} alt="User Avatar" />}
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Support</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Current Streak" value={`${streaks.current} Days`} icon={Flame} description={`Longest: ${streaks.longest} days`} />
            <StatCard title="Today's Progress" value={`${completionPercentage}%`} icon={Target} description={`${completedTodayCount} / ${habitsForToday.length} completed`} />
            <StatCard title="Completed Habits" value={habits.reduce((acc, h) => acc + h.completed_dates.length, 0)} icon={CheckCircle2} description="All time" />
            <StatCard title="Achievements" value={`${achievements.filter(a => a.unlocked).length} / ${achievements.length}`} icon={Trophy} description="Unlocked" />
          </div>

          <div>
             <Tabs defaultValue="today">
                <TabsList>
                  <TabsTrigger value="today">Today's Habits</TabsTrigger>
                  <TabsTrigger value="progress">Progress</TabsTrigger>
                  <TabsTrigger value="achievements">Achievements</TabsTrigger>
                </TabsList>
                <TabsContent value="today" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>What will you accomplish today?</CardTitle>
                      <CardDescription>Check off your habits as you complete them.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                       {habitsForToday.length > 0 ? habitsForToday.map(habit => (
                          <div key={habit.id} className={cn("flex items-center gap-4 rounded-lg p-3 transition-colors", isHabitCompletedToday(habit) ? 'bg-accent/50' : 'bg-muted/20')}>
                             <Checkbox 
                                id={`habit-${habit.id}`} 
                                checked={isHabitCompletedToday(habit)}
                                onCheckedChange={(checked) => toggleHabitCompletion(habit.id, !!checked)}
                                className="h-6 w-6"
                              />
                             <div className="grid gap-1 flex-1">
                               <label htmlFor={`habit-${habit.id}`} className={cn("font-semibold cursor-pointer", isHabitCompletedToday(habit) && 'line-through text-muted-foreground')}>{habit.name}</label>
                               <p className="text-sm text-muted-foreground flex items-center gap-2">
                                 <habit.icon className="h-4 w-4" />
                                 <span>{habit.frequency.charAt(0).toUpperCase() + habit.frequency.slice(1)}</span>
                                 {habit.reminderTime && <><span className="text-xs">&bull;</span> <Bell className="h-4 w-4" /> {habit.reminderTime}</>}
                               </p>
                             </div>
                             {isHabitCompletedToday(habit) ? <CheckCircle2 className="h-6 w-6 text-green-500" /> : <XCircle className="h-6 w-6 text-muted-foreground/50" />}
                          </div>
                       )) : (
                        <div className="text-center text-muted-foreground py-8">
                            <p>No habits scheduled for today.</p>
                            <AddHabitDialog onHabitAdd={handleAddHabit}>
                                <Button variant="link" className="mt-2">Add a new habit</Button>
                            </AddHabitDialog>
                        </div>
                       )}
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="progress" className="mt-4">
                  <div className="grid gap-6 md:grid-cols-2">
                      <Card>
                        <CardHeader>
                          <CardTitle>Weekly Report</CardTitle>
                           <CardDescription>Habits completed in the last 7 days.</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ChartContainer config={chartConfig} className="h-[200px] w-full">
                            <ResponsiveContainer>
                              <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                                  <CartesianGrid vertical={false} />
                                  <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                                  <YAxis />
                                  <Tooltip cursor={false} content={<ChartTooltipContent />} />
                                  <Bar dataKey="completed" fill="var(--color-completed)" radius={4} />
                                </BarChart>
                            </ResponsiveContainer>
                          </ChartContainer>
                        </CardContent>
                      </Card>
                      <Card className="flex flex-col">
                         <CardHeader>
                            <CardTitle>Completion Calendar</CardTitle>
                            <CardDescription>Your activity overview.</CardDescription>
                          </CardHeader>
                          <CardContent className="flex-1 flex items-center justify-center">
                              <Calendar
                                mode="multiple"
                                selected={mockProgressData.filter(d => d.completed > 0).map(d => new Date(d.date))}
                                onDayClick={(day) => setToday(day)}
                                classNames={{
                                  day_selected: "bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary/90",
                                }}
                                className="p-0"
                              />
                          </CardContent>
                      </Card>
                  </div>
                </TabsContent>
                <TabsContent value="achievements" className="mt-4">
                  <Card>
                      <CardHeader>
                        <CardTitle>Your Achievements</CardTitle>
                        <CardDescription>Celebrate your progress and milestones.</CardDescription>
                      </CardHeader>
                      <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {achievements.map(ach => (
                          <Card key={ach.id} className={cn("p-4 flex items-start gap-4", !ach.unlocked && "opacity-50 bg-muted/30")}>
                              <div className={cn("p-3 rounded-full", ach.unlocked ? "bg-primary/10 text-primary" : "bg-muted-foreground/10 text-muted-foreground")}>
                                <ach.icon className="h-6 w-6"/>
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold">{ach.name}</h3>
                                <p className="text-sm text-muted-foreground">{ach.description}</p>
                              </div>
                          </Card>
                        ))}
                      </CardContent>
                    </Card>
                </TabsContent>
              </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
