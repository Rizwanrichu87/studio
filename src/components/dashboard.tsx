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
import { StatCard } from "./stat-card";
import {
  mockAchievements,
  habitIcons,
} from "@/lib/data";
import { useState, useMemo, useEffect } from "react";
import type { Habit, Achievement, ProgressData } from "@/lib/types";
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
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, LineChart, Line, Legend } from 'recharts';
import { cn } from "@/lib/utils";
import { useAuth, useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { addDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { collection, doc } from "firebase/firestore";
import { startOfWeek, endOfWeek, eachDayOfInterval, format, parseISO, isSameDay, getDay, getDate, subDays } from 'date-fns';

export default function Dashboard() {
  const auth = useAuth();
  const { user } = useUser();
  const firestore = useFirestore();

  const habitsQuery = useMemoFirebase(() => {
      if (!user) return null;
      return collection(firestore, 'users', user.uid, 'habits');
  }, [firestore, user]);
  
  const { data: habits = [], isLoading: isLoadingHabits } = useCollection<Habit>(habitsQuery);

  const [achievements, setAchievements] = useState<Achievement[]>(mockAchievements);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState("today");

  const todayISO = selectedDate.toISOString().split("T")[0];

  const toggleHabitCompletion = (habitId: string, completed: boolean) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit || !user) return;

    const docRef = doc(firestore, 'users', user.uid, 'habits', habitId);
    const newCompletedDates = new Set(habit.completed_dates);

    if (completed) {
      newCompletedDates.add(todayISO);
    } else {
      newCompletedDates.delete(todayISO);
    }

    updateDocumentNonBlocking(docRef, { completed_dates: Array.from(newCompletedDates) });
  };
  
  const handleAddHabit = (newHabit: Omit<Habit, 'id' | 'completed_dates'>) => {
    if (!user) return;
    const collectionRef = collection(firestore, 'users', user.uid, 'habits');
    addDocumentNonBlocking(collectionRef, {
        ...newHabit,
        completed_dates: [],
    });
  };
  
  const isHabitCompletedToday = (habit: Habit) => {
    return habit.completed_dates.includes(todayISO);
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


  const completedTodayCount = habitsForToday.filter(isHabitCompletedToday).length;
  const completionPercentage = habitsForToday.length > 0 ? Math.round((completedTodayCount / habitsForToday.length) * 100) : 0;

  // Streak calculation
  const streaks = useMemo(() => {
    let longestStreak = 0;
    let currentStreak = 0;

    if (habits && habits.length > 0) {
        const allCompletionDates = new Set(habits.flatMap(h => h.completed_dates));
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
    const allDates = habits.flatMap(h => h.completed_dates.map(d => parseISO(d)));
    return allDates;
  }, [habits]);
  
  // UseEffect for notifications
  useEffect(() => {
    // This effect runs to set up reminders, but permission is now requested on click.
    (habits || []).forEach(habit => {
      if (habit.reminderTime && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
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
  }, [habits, selectedDate]);


  const weeklyChartData = useMemo(() => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

    if (!habits) return [];

    return weekDays.map(day => {
        const dateString = format(day, 'yyyy-MM-dd');
        let completedCount = 0;
        
        habits.forEach(habit => {
            if (habit.completed_dates.includes(dateString)) {
                completedCount++;
            }
        });

        return {
            date: format(day, 'EEE'), // Short day name e.g., "Mon"
            completed: completedCount,
        };
    });
}, [selectedDate, habits]);

  const streakChartData = useMemo(() => {
    if (!habits || habits.length === 0) return [];
    
    const days = eachDayOfInterval({ start: subDays(new Date(), 29), end: new Date() });
    
    return days.map(day => {
      const dayData: {[key: string]: any} = {
        date: format(day, 'MMM d')
      };

      habits.forEach(habit => {
        let streak = 0;
        let checkDate = new Date(day);
        const completionSet = new Set(habit.completed_dates);

        while(completionSet.has(format(checkDate, 'yyyy-MM-dd'))) {
          streak++;
          checkDate = subDays(checkDate, 1);
        }
        dayData[habit.name] = streak;
      });

      return dayData;
    });
  }, [habits]);

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
    setActiveTab(tab);
  };

  const mainContentTabs = ["today", "progress"];
  const isDashboardTabActive = mainContentTabs.includes(activeTab) || activeTab === 'dashboard';

  const handleLogout = () => {
    auth.signOut();
  }

  const handleNotificationClick = () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      } else if (Notification.permission === 'denied') {
        // You might want to guide the user on how to enable notifications in browser settings
        console.log('Notification permission has been denied.');
        alert('You have disabled notifications. To enable them, please go to your browser settings.');
      }
      // If permission is 'granted', do nothing as it's already enabled.
    }
  };


  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-card/60 backdrop-blur-xl lg:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-[60px] items-center border-b px-6">
            <a href="/" className="flex items-center gap-2 font-semibold">
              <Logo className="h-6 w-6 text-primary" />
              <span className="font-headline">AI Habitual</span>
            </a>
            <Button variant="outline" size="icon" className="ml-auto h-8 w-8" onClick={handleNotificationClick}>
              <Bell className="h-4 w-4" />
              <span className="sr-only">Toggle notifications</span>
            </Button>
          </div>
          <div className="flex-1 overflow-auto py-2">
            <nav className="grid items-start px-4 text-sm font-medium">
              <button
                onClick={() => handleNavClick('today')}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                  isDashboardTabActive && "bg-muted text-primary"
                )}
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </button>
              <button
                onClick={() => handleNavClick('achievements')}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                  activeTab === 'achievements' && "bg-muted text-primary"
                )}
              >
                <Trophy className="h-4 w-4" />
                Achievements
              </button>
              <button
                onClick={() => { alert("Settings not implemented yet.")}}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              >
                <Settings className="h-4 w-4" />
                Settings
              </button>
            </nav>
          </div>
        </div>
      </div>
      <div className="flex flex-col bg-transparent">
        <header className="flex h-14 lg:h-[60px] items-center gap-4 border-b bg-card/60 backdrop-blur-xl px-6 sticky top-0 z-20">
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
                  {user?.photoURL && <AvatarImage src={user.photoURL} alt="User Avatar" />}
                  <AvatarFallback>{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user?.displayName || 'My Account'}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Support</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6 animate-fade-in-up">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Current Streak" value={`${streaks.current} Days`} icon={Flame} description={`Longest: ${streaks.longest} days`} />
            <StatCard title="Today's Progress" value={`${completionPercentage}%`} icon={Target} description={`${completedTodayCount} / ${habitsForToday.length} completed`} />
            <StatCard title="Completed Habits" value={(habits || []).reduce((acc, h) => acc + h.completed_dates.length, 0)} icon={CheckCircle2} description="All time" />
            <StatCard title="Achievements" value={`${achievements.filter(a => a.unlocked).length} / ${achievements.length}`} icon={Trophy} description="Unlocked" />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
             <div className="lg:col-span-2">
                <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="today">
                  <TabsList>
                    <TabsTrigger value="today">Today's Habits</TabsTrigger>
                    <TabsTrigger value="progress">Progress</TabsTrigger>
                  </TabsList>
                  <TabsContent value="today" className="mt-4">
                    <Card className="glass-card">
                      <CardHeader>
                        <CardTitle>What will you accomplish today?</CardTitle>
                        <CardDescription>Check off your habits as you complete them.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                         {isLoadingHabits ? (
                           <p>Loading habits...</p>
                         ) : habitsForToday.length > 0 ? habitsForToday.map(habit => {
                            const Icon = habitIcons[habit.icon] || Target;
                            return (
                            <div key={habit.id} className={cn("flex items-center gap-4 rounded-lg p-3 transition-colors", isHabitCompletedToday(habit) ? 'bg-primary/20' : 'bg-muted/20')}>
                               <Checkbox 
                                  id={`habit-${habit.id}`} 
                                  checked={isHabitCompletedToday(habit)}
                                  onCheckedChange={(checked) => toggleHabitCompletion(habit.id, !!checked)}
                                  className="h-6 w-6"
                                />
                               <div className="grid gap-1 flex-1">
                                 <label htmlFor={`habit-${habit.id}`} className={cn("font-semibold cursor-pointer", isHabitCompletedToday(habit) && 'line-through text-muted-foreground')}>{habit.name}</label>
                                 <p className="text-sm text-muted-foreground flex items-center gap-2">
                                   <Icon className="h-4 w-4" />
                                   <span>{habit.frequency.charAt(0).toUpperCase() + habit.frequency.slice(1)}</span>
                                   {habit.reminderTime && <><span className="text-xs">&bull;</span> <Bell className="h-4 w-4" /> {habit.reminderTime}</>}
                                 </p>
                               </div>
                               {isHabitCompletedToday(habit) ? <CheckCircle2 className="h-6 w-6 text-green-500" /> : <XCircle className="h-6 w-6 text-muted-foreground/50" />}
                            </div>
                         )}) : (
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
                                    mode="multiple"
                                    selected={calendarDays}
                                    onDayClick={(day) => setSelectedDate(day)}
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
                             <CardDescription>30-day streak overview for each habit.</CardDescription>
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
                                      tickFormatter={(value) => value.slice(0, 3)}
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
        </main>
      </div>
    </div>
  );
}
