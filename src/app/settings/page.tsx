
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
  User as UserIcon,
  LogOut,
  Camera,
} from "lucide-react";
import {
  habitIcons,
} from "@/lib/data";
import { useState, useRef } from "react";
import type { Habit } from "@/lib/types";
import { AddHabitDialog } from "@/components/add-habit-dialog";
import { useAuth, useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { collection, doc, setDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { updateProfile } from "firebase/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const profileFormSchema = z.object({
  username: z.string().min(2, "Username must be at least 2 characters."),
});

export default function SettingsPage() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("settings");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: user?.displayName || "",
    },
  });

  useEffect(() => {
    if (user?.displayName) {
      profileForm.reset({ username: user.displayName });
    }
  }, [user, profileForm]);

  const onProfileSubmit = async (values: z.infer<typeof profileFormSchema>) => {
    if (!user) return;
    try {
      if (values.username !== user.displayName) {
        await updateProfile(user, { displayName: values.username });
        const userDocRef = doc(firestore, 'users', user.uid);
        await setDoc(userDocRef, { username: values.username }, { merge: true });

        toast({
          title: "Profile Updated",
          description: "Your username has been successfully updated.",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message,
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handlePhotoUpload(e.target.files[0]);
    }
  };

  const handlePhotoUpload = async (file: File) => {
    if (!user) return;

    setIsUploading(true);
    try {
      const storage = getStorage();
      const photoRef = ref(storage, `avatars/${user.uid}/${file.name}`);

      await uploadBytes(photoRef, file);
      const photoURL = await getDownloadURL(photoRef);
      
      await updateProfile(user, { photoURL });
      const userDocRef = doc(firestore, 'users', user.uid);
      await setDoc(userDocRef, { photoURL }, { merge: true });

      toast({
        title: "Photo Updated",
        description: "Your profile photo has been successfully updated.",
      });

    } catch(error: any) {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error.message,
      });
    } finally {
      setIsUploading(false);
    }
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

  const handleLogout = () => {
    auth.signOut();
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
        <div className="flex flex-col items-center gap-6">
          <Card className="glass-card w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-primary" />
                Profile Settings
              </CardTitle>
              <CardDescription>Update your display name and photo.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-6 mb-6">
                    <div className="relative">
                        <Avatar className="h-24 w-24 border-2 border-primary">
                            <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'}/>
                            <AvatarFallback className="text-3xl">{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        <Button
                            size="icon"
                            className="absolute bottom-0 right-0 rounded-full h-8 w-8"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            aria-label="Change profile photo"
                        >
                            {isUploading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Camera className="h-4 w-4"/>}
                        </Button>
                        <Input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            className="hidden"
                            accept="image/png, image/jpeg"
                        />
                    </div>
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4 flex-1">
                      <FormField
                        control={profileForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Your Name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" disabled={profileForm.formState.isSubmitting}>
                        {profileForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                      </Button>
                    </form>
                  </Form>
                </div>
            </CardContent>
          </Card>

          <Card className="glass-card w-full max-w-2xl">
            <CardHeader>
               <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Manage Habits
              </CardTitle>
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

           <Card className="glass-card w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LogOut className="h-5 w-5 text-destructive" />
                Account Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={handleLogout}>
                Log Out
              </Button>
            </CardContent>
          </Card>

        </div>
    </AppLayout>
  );
}
