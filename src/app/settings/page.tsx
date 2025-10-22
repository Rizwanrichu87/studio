
'use client';

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Bell,
  Settings,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  habitIcons,
} from "@/lib/data";
import { useState, useMemo } from "react";
import type { Habit } from "@/lib/types";
import { AddHabitDialog } from "@/components/add-habit-dialog";
import { useAuth, useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { collection, doc } from "firebase/firestore";
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
import { AppLayout } from "@/components/app-layout";


export default function SettingsPage() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("settings");

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const habitsQuery = useMemoFirebase(() => {
      if (!user) return null;
      return collection(firestore, 'users', user.uid, 'habits');
  }, [firestore, user]);
  
  const { data: habits, isLoading: isLoadingHabits } = useCollection<Habit>(habitsQuery);
  
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

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-transparent">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const handleNavClick = (tab: string) => {
    if(tab === 'dashboard') {
        router.push('/dashboard');
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
        <div className="flex justify-center">
        <Card className="glass-card w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Manage Habits</CardTitle>
              <CardDescription>Edit or delete your existing habits.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingHabits ? (
                <p>Loading habits...</p>
              ) : habits && habits.length > 0 ? habits.map(habit => {
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
        </div>
    </AppLayout>
  );
}
