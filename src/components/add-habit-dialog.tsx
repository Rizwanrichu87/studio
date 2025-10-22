"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Plus, Pencil } from "lucide-react";
import { useState, useEffect } from "react";

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
  onHabitSubmit: (habit: Omit<Habit, 'id' | 'completed_dates'>) => void;
  habitToEdit?: Habit;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddHabitDialog({ children, onHabitSubmit, habitToEdit, open: controlledOpen, onOpenChange: controlledOnOpenChange }: AddHabitDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  const open = controlledOpen ?? internalOpen;
  const setOpen = controlledOnOpenChange ?? setInternalOpen;

  const isEditMode = !!habitToEdit;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: isEditMode ? {
      name: habitToEdit.name,
      frequency: habitToEdit.frequency,
      reminderTime: habitToEdit.reminderTime || "",
      icon: habitToEdit.icon,
    } : {
      name: "",
      frequency: "daily",
      reminderTime: "",
      icon: "Target",
    },
  });

  useEffect(() => {
    if (isEditMode && habitToEdit) {
      form.reset({
        name: habitToEdit.name,
        frequency: habitToEdit.frequency,
        reminderTime: habitToEdit.reminderTime || "",
        icon: habitToEdit.icon,
      });
    } else {
        form.reset({
            name: "",
            frequency: "daily",
            reminderTime: "",
            icon: "Target",
        });
    }
  }, [habitToEdit, isEditMode, form, open]);


  function onSubmit(values: z.infer<typeof formSchema>) {
    onHabitSubmit({
        ...values,
        icon: values.icon as keyof typeof habitIcons,
    });
    toast({
      title: isEditMode ? "Habit Updated" : "Habit Added",
      description: `"${values.name}" has been ${isEditMode ? 'updated' : 'added'}.`,
    });
    setOpen(false);
    form.reset();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Habit" : "Add New Habit"}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "Update the details of your habit." : "Create a new habit to track. Click save when you're done."}
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
                {isEditMode ? <Pencil className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                {isEditMode ? 'Save Changes' : 'Add Habit'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
