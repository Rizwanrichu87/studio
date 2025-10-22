
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  CheckCircle2,
  Flame,
  PlusCircle,
  Settings,
  Target,
  Trophy,
  MoreVertical,
  Pencil,
  Trash2,
  Plus,
  Minus,
  Bell
} from "lucide-react";
import { StatCard } from "./stat-card";
import {
  mockAchievements,
  habitIcons,
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
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, LineChart, Line } from 'recharts';
import { cn } from "@/lib/utils";
import { useAuth, useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { collection, doc } from "firebase/firestore";
import { startOfWeek, endOfWeek, eachDayOfInterval, format, parseISO, subDays, startOfMonth, endOfMonth, eachDayOfInterval as eachDayOfIntervalMonth, getDay } from 'date-fns';
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Progress } from "./ui/progress";
import { AppLayout } from "./app-layout";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Dashboard() {
  const auth = useAuth();
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const habitsQuery = useMemoFirebase(() => {
      if (!user) return null;
      return collection(firestore, 'users', user.uid, 'habits');
  }, [firestore, user]);
  
  const { data: habits = [], isLoading: isLoadingHabits } = useCollection<Habit>(habitsQuery);
  
  const [achievements] = useState<Achievement[]>(mockAchievements);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const [activeTab, setActiveTab] = useState("today");
  
  const [habitToEdit, setHabitToEdit] = useState<Habit | undefined>(undefined);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState<Habit | undefined>(undefined);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const todayISO = selectedDate.toISOString().split("T")[0];

  const updateHabitCompletion = (habitId: string, count: number) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit || !user) return;

    const docRef = doc(firestore, 'users', user.uid, 'habits', habitId);
    const newCompletions = { ...habit.completions };

    if (count > 0) {
      newCompletions[todayISO] = count;
    } else {
      delete newCompletions[todayISO];
    }

    updateDocumentNonBlocking(docRef, { completions: newCompletions });
  };
  
  const handleHabitSubmit = (submittedHabit: Omit<Habit, 'id' | 'completions'>) => {
    if (!user) return;
    if (habitToEdit) {
      // Update existing habit
      const docRef = doc(firestore, 'users', user.uid, 'habits', habitToEdit.id);
      updateDocumentNonBlocking(docRef, submittedHabit);
    } else {
      // Add new habit
      const collectionRef = collection(firestore, 'users', user.uid, 'habits');
      addDocumentNonBlocking(collectionRef, {
        ...submittedHabit,
        completions: {},
      });
    }
  };

  const handleDeleteHabit = () => {
    if (!habitToDelete || !user) return;
    const docRef = doc(firestore, 'users', user.uid, 'habits', habitToDelete.id);
    deleteDocumentNonBlocking(docRef);
    setIsDeleteDialogOpen(false);
    setHabitToDelete(undefined);
  };
  
  const openEditDialog = (habit: Habit) => {
    setHabitToEdit(habit);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (habit: Habit) => {
    setHabitToDelete(habit);
    setIsDeleteDialogOpen(true);
  };

  const getCompletionCount = (habit: Habit, date: string) => {
    return habit.completions?.[date] || 0;
  };
  
  const habitsForToday = useMemo(() => {
    return (habits || []).filter(habit => {
        if (habit.frequency === 'daily') {
            return true;
        }
        if (habit.frequency === 'weekly') {
            return true;
        }
        if (habit.frequency === 'monthly') {
            return true;
        }
        return false;
    });
}, [habits, selectedDate]);

  const { completedTodayCount, totalTodayTarget } = useMemo(() => {
    let completed = 0;
    let total = 0;
    habitsForToday.forEach(habit => {
      completed += getCompletionCount(habit, todayISO);
      total += habit.targetCompletions || 1;
    });
    return { completedTodayCount: completed, totalTodayTarget: total };
  }, [habitsForToday, todayISO]);

  const completionPercentage = totalTodayTarget > 0 ? Math.round((completedTodayCount / totalTodayTarget) * 100) : 0;

  // Streak calculation
  const streaks = useMemo(() => {
    let longestStreak = 0;
    let currentStreak = 0;

    if (habits && habits.length > 0) {
        const allCompletionDates = new Set(habits.flatMap(h => h.completions ? Object.keys(h.completions) : []));
        const sortedDates = Array.from(allCompletionDates).sort();

        if (sortedDates.length > 0) {
            let streak = 0;
            let lastDate: Date | null = null;
            
            // Check for current streak
            let tempCurrentStreak = 0;
            let checkDate = new Date();
            if (!allCompletionDates.has(checkDate.toISOString().split('T')[0])) {
              checkDate.setDate(checkDate.getDate() - 1);
            }

            while(allCompletionDates.has(checkDate.toISOString().split('T')[0])) {
                tempCurrentStreak++;
                checkDate.setDate(checkDate.getDate() - 1);
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

  const calendarDays = useMemo(() => {
    if (!habits) return [];
    const allDates = habits.flatMap(h => h.completions ? Object.keys(h.completions).map(d => parseISO(d)) : []);
    return allDates;
  }, [habits]);
  
  // UseEffect for notifications
  useEffect(() => {
    // This effect runs to set up reminders, but permission is now requested on click.
    (habits || []).forEach(habit => {
      const isCompleted = (getCompletionCount(habit, todayISO) >= (habit.targetCompletions || 1));
      if (habit.reminderTime && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        const [hours, minutes] = habit.reminderTime.split(':');
        const now = new Date();
        const reminderDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), Number(hours), Number(minutes));
        
        if (reminderDate > now && !isCompleted) {
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
  }, [habits, selectedDate, todayISO]);


  const weeklyChartData = useMemo(() => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

    if (!habits) return [];

    return weekDays.map(day => {
        const dateString = format(day, 'yyyy-MM-dd');
        let completedCount = 0;
        
        habits.forEach(habit => {
            completedCount += getCompletionCount(habit, dateString);
        });

        return {
            date: format(day, 'EEE'), // Short day name e.g., "Mon"
            completed: completedCount,
        };
    });
}, [selectedDate, habits]);

 const streakChartData = useMemo(() => {
    if (!habits || habits.length === 0) return [];
    
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const days = eachDayOfIntervalMonth({ start: monthStart, end: monthEnd });
    
    return days.map(day => {
      const dayData: {[key: string]: any} = {
        date: format(day, 'd')
      };

      habits.forEach(habit => {
        let streak = 0;
        let checkDate = new Date(day);
        
        while((habit.completions?.[format(checkDate, 'yyyy-MM-dd')] || 0) >= (habit.targetCompletions || 1)) {
          streak++;
          checkDate = subDays(checkDate, 1);
        }
        dayData[habit.name] = streak;
      });

      return dayData;
    });
  }, [habits, selectedDate]);

  const chartConfig: ChartConfig = useMemo(() => {
    const config: ChartConfig = {
      completed: {
        label: 'Completed',
        color: 'hsl(var(--primary))',
      },
    };
    (habits || []).forEach((habit, index) => {
        config[habit.name] = {
            label: habit.name,
            color: `hsl(var(--chart-${(index % 5) + 1}))`
        }
    });
    return config;
  }, [habits]);


  const handleNavClick = (tab: string) => {
    if(tab === 'settings') {
        router.push('/settings');
    } else {
        setActiveTab(tab);
    }
  };


  return (
    <AppLayout activeTab={activeTab} onNavClick={handleNavClick} onHabitSubmit={handleHabitSubmit}>
       <AddHabitDialog onHabitSubmit={handleHabitSubmit} habitToEdit={habitToEdit} open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
         <div/>
       </AddHabitDialog>
       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              habit "{habitToDelete?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteHabit}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Current Streak" value={`${streaks.current} Days`} icon={Flame} description={`Longest: ${streaks.longest} days`} />
        <StatCard title="Today's Progress" value={`${completionPercentage}%`} icon={Target} description={`${completedTodayCount} / ${totalTodayTarget} completed`} />
        <StatCard title="Completed Habits" value={(habits || []).reduce((acc, h) => acc + Object.values(h.completions || {}).reduce((a, b) => a + b, 0), 0)} icon={CheckCircle2} description="All time" />
        <StatCard title="Achievements" value={`${achievements.filter(a => a.unlocked).length} / ${achievements.length}`} icon={Trophy} description="Unlocked" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
         <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="today">
              <TabsList>
                <TabsTrigger value="today">Today's Habits</TabsTrigger>
                <TabsTrigger value="progress">Progress</TabsTrigger>
                <TabsTrigger value="achievements">Achievements</TabsTrigger>
              </TabsList>
              <TabsContent value="today" className="mt-4">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>What will you accomplish today?</CardTitle>
                    <CardDescription>Track your habits as you complete them.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                     {isLoadingHabits ? (
                       <p>Loading habits...</p>
                     ) : habitsForToday.length > 0 ? habitsForToday.map(habit => {
                        const Icon = habitIcons[habit.icon] || Target;
                        const target = habit.targetCompletions || 1;
                        const count = getCompletionCount(habit, todayISO);
                        const isCompleted = count >= target;
                        return (
                        <div key={habit.id} className={cn("flex items-center gap-4 rounded-lg p-3 transition-colors group", isCompleted ? 'bg-primary/20' : 'bg-muted/20')}>
                           <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateHabitCompletion(habit.id, Math.max(0, count - 1))}
                                disabled={count === 0}
                            >
                                <Minus className="h-4 w-4" />
                            </Button>
                            <div className="text-center font-bold w-10">
                                {count} / {target}
                            </div>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateHabitCompletion(habit.id, Math.min(target, count + 1))}
                                disabled={isCompleted}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                           </div>
                           <div className="grid gap-1 flex-1">
                             <label htmlFor={`habit-${habit.id}`} className={cn("font-semibold", isCompleted && 'line-through text-muted-foreground')}>{habit.name}</label>
                             <p className="text-sm text-muted-foreground flex items-center gap-2">
                               <Icon className="h-4 w-4" />
                               <span>{habit.frequency.charAt(0).toUpperCase() + habit.frequency.slice(1)}</span>
                               {habit.reminderTime && <><span className="text-xs">&bull;</span> <Bell className="h-4 w-4" /> {habit.reminderTime}</>}
                             </p>
                             {target > 1 && <Progress value={(count / target) * 100} className="h-2 mt-1" />}
                           </div>
                           {isCompleted && <CheckCircle2 className="h-6 w-6 text-green-500" />}
                           <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditDialog(habit)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openDeleteDialog(habit)} className="text-destructive">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                     )}) : (
                      <div className="text-center text-muted-foreground py-8">
                          <p>No habits scheduled for today.</p>
                          <AddHabitDialog onHabitSubmit={handleHabitSubmit}>
                              <Button variant="link" className="mt-2">Add a new habit</Button>
                          </AddHabitDialog>
                      </div>
                     )}
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="progress" className="mt-4">
                <div className="grid gap-6">
                  <div className="grid gap-6 md:grid-cols-2">
                      <Card className="glass-card">
                        <CardHeader>
                          <CardTitle>Weekly Report</CardTitle>
                           <CardDescription>Habits completed in the selected week.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <ChartContainer config={chartConfig} className="h-[200px] w-full">
                                <BarChart data={weeklyChartData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                                  <CartesianGrid vertical={false} stroke="hsl(var(--border) / 0.5)" />
                                  <XAxis
                                    dataKey="date"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                  />
                                  <YAxis allowDecimals={false} />
                                  <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent />}
                                  />
                                  <Bar
                                    dataKey="completed"
                                    fill="var(--color-completed)"
                                    radius={4}
                                  />
                                </BarChart>
                              </ChartContainer>
                        </CardContent>
                      </Card>
                      <Card className="flex flex-col glass-card">
                         <CardHeader>
                            <CardTitle>Completion Calendar</CardTitle>
                            <CardDescription>Your activity overview. Click a day to see the weekly report.</CardDescription>
                          </CardHeader>
                          <CardContent className="flex-1 flex items-center justify-center">
                              <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={(day) => day && setSelectedDate(day)}
                                modifiers={{
                                  completed: calendarDays
                                }}
                                modifiersClassNames={{
                                  completed: "bg-primary/50 text-primary-foreground"
                                }}
                                classNames={{
                                  day_selected: "bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary/90",
                                }}
                                className="p-0"
                              />
                          </CardContent>
                      </Card>
                  </div>
                  <Card className="glass-card">
                      <CardHeader>
                        <CardTitle>Streak Progression</CardTitle>
                         <CardDescription>Streak overview for each habit in {format(selectedDate, 'MMMM yyyy')}.</CardDescription>
                      </CardHeader>
                      <CardContent>
                         <ChartContainer config={chartConfig} className="h-[300px] w-full">
                              <LineChart data={streakChartData} margin={{ top: 20, right: 50, bottom: 5, left: 0 }}>
                                <CartesianGrid vertical={false} stroke="hsl(var(--border) / 0.5)" />
                                <XAxis
                                  dataKey="date"
                                  tickLine={false}
                                  axisLine={false}
                                  tickMargin={8}
                                  tickFormatter={(value) => value}
                                />
                                <YAxis allowDecimals={false} />
                                <ChartTooltip
                                  cursor={false}
                                  content={<ChartTooltipContent />}
                                />
                                <ChartLegend content={<ChartLegendContent />} />
                                {(habits || []).map((habit, index) => (
                                   <Line
                                      key={habit.id}
                                      dataKey={habit.name}
                                      type="monotone"
                                      stroke={`hsl(var(--chart-${(index % 5) + 1}))`}
                                      strokeWidth={2}
                                      dot={false}
                                    />
                                ))}
                              </LineChart>
                            </ChartContainer>
                      </CardContent>
                    </Card>
                </div>
              </TabsContent>
              <TabsContent value="achievements" className="mt-4">
                <Card className="glass-card">
                    <CardHeader>
                      <CardTitle>Your Achievements</CardTitle>
                      <CardDescription>Celebrate your progress and milestones.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {achievements.map(ach => (
                        <Card key={ach.id} className={cn("p-4 flex items-start gap-4 glass-card", !ach.unlocked && "opacity-50 bg-muted/30")}>
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
          <div className="lg:col-span-1">
            <AIHelper habits={habits || []} streaks={streaks} />
          </div>
      </div>
    </AppLayout>
  );
}
