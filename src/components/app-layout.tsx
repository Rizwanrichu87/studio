
'use client';

import Link from "next/link";
import { useAuth, useUser } from "@/firebase";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, LayoutDashboard, LogOut, PlusCircle, Settings, Trophy } from "lucide-react";
import Logo from "./logo";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { AddHabitDialog } from "./add-habit-dialog";
import type { Habit } from "@/lib/types";

interface AppLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onNavClick: (tab: string) => void;
  onHabitSubmit: (habit: Omit<Habit, 'id' | 'completions'>) => void;
}

export function AppLayout({ children, activeTab, onNavClick, onHabitSubmit }: AppLayoutProps) {
  const auth = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const handleLogout = () => {
    auth.signOut();
  };

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

  const isDashboardTabActive = ["today", "progress", "dashboard"].includes(activeTab);

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
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
                onClick={(e) => {
                    e.preventDefault();
                    router.push('/dashboard');
                    onNavClick('dashboard');
                }}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                  isDashboardTabActive && "bg-muted text-primary"
                )}
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
              <button
                onClick={() => {
                    router.push('/dashboard');
                    // A bit of a hack to switch tabs on another page
                    setTimeout(() => {
                        const el = document.querySelector('[role="tablist"] [value="achievements"]');
                        if (el instanceof HTMLElement) el.click();
                    }, 50);
                }}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                  activeTab === 'achievements' && "bg-muted text-primary"
                )}
              >
                <Trophy className="h-4 w-4" />
                Achievements
              </button>
              <Link
                href="/settings"
                onClick={(e) => {
                    e.preventDefault();
                    router.push('/settings');
                }}
                className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                    activeTab === 'settings' && "bg-muted text-primary"
                )}
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
          <Link href="/" className="lg:hidden">
            <Logo className="h-6 w-6 text-primary" />
            <span className="sr-only">Home</span>
          </Link>
          <div className="w-full flex-1">
          </div>
          <AddHabitDialog onHabitSubmit={onHabitSubmit}>
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
            {children}
        </main>
      </div>
    </div>
  );
}
