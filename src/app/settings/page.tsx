
'use client';

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
import {
  Bell,
  LayoutDashboard,
  LogOut,
  PlusCircle,
  Settings,
  Trophy,
  Pencil,
  Trash2,
} from "lucide-react";
import Logo from "@/components/logo";
import {
  habitIcons,
} from "@/lib/data";
import { useState, useMemo } from "react";
import type { Habit } from "@/lib/types";
import { AddHabitDialog } from "@/components/add-habit-dialog";
import { cn } from "@/lib/utils";
import { useAuth, useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { collection, doc } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
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


export default function SettingsPage() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const habitsQuery = useMemoFirebase(() => {
      if (!user) return null;
      return collection(firestore, 'users', user.uid, 'habits');
  }, [firestore, user]);
  
  const { data: habits = [], isLoading: isLoadingHabits } = useCollection<Habit>(habitsQuery);
  
  const [habitToEdit, setHabitToEdit] = useState<Habit | undefined>(undefined);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState<Habit | undefined>(undefined);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

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

  const handleLogout = () => {
    auth.signOut();
  }

  const handleNotificationClick = () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      } else if (Notification.permission === 'denied') {
        console.log('Notification permission has been denied.');
        alert('You have disabled notifications. To enable them, please go to your browser settings.');
      }
    }
  };

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-transparent">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
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

      <div className="hidden border-r bg-card/60 backdrop-blur-xl lg:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-[60px] items-center border-b px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Logo className="h-6 w-6 text-primary" />
              <span className="font-headline">AI Habitual</span>
            </Link>
            <Button variant="outline" size="icon" className="ml-auto h-8 w-8" onClick={handleNotificationClick}>
              <Bell className="h-4 w-4" />
              <span className="sr-only">Toggle notifications</span>
            </Button>
          </div>
          <div className="flex-1 overflow-auto py-2">
            <nav className="grid items-start px-4 text-sm font-medium">
              <Link
                href="/dashboard"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
              <Link
                href="/dashboard"
                 onClick={(e) => {
                  e.preventDefault();
                  router.push('/dashboard');
                  // A bit of a hack to switch tabs on another page
                  setTimeout(() => {
                    const el = document.querySelector('[role="tablist"] [value="achievements"]');
                    if (el instanceof HTMLElement) el.click();
                  }, 50);
                }}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              >
                <Trophy className="h-4 w-4" />
                Achievements
              </Link>
              <Link
                href="/settings"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-primary bg-muted transition-all hover:text-primary"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
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
          </div>
          <AddHabitDialog onHabitSubmit={handleHabitSubmit}>
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
              <Link href="/settings"><DropdownMenuItem>Settings</DropdownMenuItem></Link>
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
           <Card className="glass-card">
              <CardHeader>
                <CardTitle>Manage Habits</CardTitle>
                <CardDescription>Edit or delete your existing habits.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 {isLoadingHabits ? (
                   <p>Loading habits...</p>
                 ) : habits.length > 0 ? habits.map(habit => {
                    const Icon = habitIcons[habit.icon] || Settings;
                    return (
                    <div key={habit.id} className="flex items-center gap-4 rounded-lg p-3 transition-colors bg-muted/20">
                       <Icon className="h-6 w-6 text-primary" />
                       <div className="grid gap-1 flex-1">
                         <p className="font-semibold">{habit.name}</p>
                         <p className="text-sm text-muted-foreground flex items-center gap-2">
                           <span>{habit.frequency.charAt(0).toUpperCase() + habit.frequency.slice(1)}</span>
                           {habit.reminderTime && <><span className="text-xs">&bull;</span> <Bell className="h-4 w-4" /> {habit.reminderTime}</>}
                         </p>
                       </div>
                       <div className="flex gap-2">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openEditDialog(habit)}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                        </Button>
                        <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => openDeleteDialog(habit)}>
                            <Trash2 className="h-4 w-4" />
                             <span className="sr-only">Delete</span>
                        </Button>
                       </div>
                    </div>
                 )}) : (
                  <div className="text-center text-muted-foreground py-8">
                      <p>You haven't added any habits yet.</p>
                       <AddHabitDialog onHabitSubmit={handleHabitSubmit}>
                           <Button variant="link" className="mt-2">Add a new habit</Button>
                      </AddHabitDialog>
                  </div>
                 )}
              </CardContent>
            </Card>
        </main>
      </div>
    </div>
  );
}
