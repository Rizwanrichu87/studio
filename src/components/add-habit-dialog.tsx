"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import type { Habit } from "@/lib/types";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { habitIcons } from "@/lib/data";

const iconNames = Object.keys(habitIcons);

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  frequency: z.enum(["daily", "weekly", "monthly"]),
  reminderTime: z.string().optional(),
  icon: z.string(),
});

interface AddHabitDialogProps {
  children: React.ReactNode;
  onHabitAdd: (habit: Omit<Habit, 'id' | 'completed_dates'>) => void;
  // TODO: Add edit functionality
  // habitToEdit?: Habit;
}

export function AddHabitDialog({ children, onHabitAdd }: AddHabitDialogProps) {
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      frequency: "daily",
      reminderTime: "",
      icon: "Target",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    onHabitAdd({
        ...values,
        icon: values.icon as keyof typeof habitIcons,
    });
    toast({
      title: "Habit Added",
      description: `"${values.name}" has been added to your list.`,
    });
    setOpen(false);
    form.reset();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Habit</DialogTitle>
          <DialogDescription>
            Create a new habit to track. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Habit Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Drink 8 glasses of water" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select how often" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Icon</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-wrap gap-4"
                      >
                        {iconNames.map((iconName) => {
                          const Icon = habitIcons[iconName as keyof typeof habitIcons];
                          return (
                            <FormItem
                              key={iconName}
                              className="flex items-center space-x-3 space-y-0"
                            >
                              <FormControl>
                                 <RadioGroupItem value={iconName} id={iconName} className="sr-only" />
                              </FormControl>
                              <Label htmlFor={iconName} className={`cursor-pointer rounded-md border-2 border-transparent p-2 transition-colors hover:bg-accent hover:text-accent-foreground ${field.value === iconName ? 'border-primary bg-accent' : ''}`}>
                                <Icon className="h-6 w-6" />
                              </Label>
                            </FormItem>
                          );
                        })}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="reminderTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reminder Time (optional)</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="submit">
                <Plus className="mr-2 h-4 w-4" />
                Add Habit
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
