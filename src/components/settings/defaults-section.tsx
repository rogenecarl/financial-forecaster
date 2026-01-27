"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Save } from "lucide-react";
import { getUserSettings, updateForecastingDefaults } from "@/actions/settings";

const defaultsFormSchema = z.object({
  defaultDtrRate: z.number().min(0, "Must be at least 0").max(10000, "Must be at most 10,000"),
  defaultAccessorialRate: z.number().min(0, "Must be at least 0").max(1000, "Must be at most 1,000"),
  defaultTruckCount: z.number().int("Must be a whole number").min(1, "Must have at least 1 truck").max(100, "Must be at most 100 trucks"),
  defaultHourlyWage: z.number().min(0, "Must be at least 0").max(500, "Must be at most 500"),
  defaultHoursPerNight: z.number().min(0, "Must be at least 0").max(24, "Must be at most 24 hours"),
});

type DefaultsFormData = z.infer<typeof defaultsFormSchema>;

export function DefaultsSection() {
  const queryClient = useQueryClient();

  const { data: settingsResult, isLoading } = useQuery({
    queryKey: ["userSettings"],
    queryFn: () => getUserSettings(),
  });

  const form = useForm<DefaultsFormData>({
    resolver: zodResolver(defaultsFormSchema),
    defaultValues: {
      defaultDtrRate: 452,
      defaultAccessorialRate: 77,
      defaultTruckCount: 2,
      defaultHourlyWage: 20,
      defaultHoursPerNight: 10,
    },
  });

  useEffect(() => {
    if (settingsResult?.success && settingsResult.data) {
      const settings = settingsResult.data;
      form.reset({
        defaultDtrRate: Number(settings.defaultDtrRate),
        defaultAccessorialRate: Number(settings.defaultAccessorialRate),
        defaultTruckCount: settings.defaultTruckCount,
        defaultHourlyWage: Number(settings.defaultHourlyWage),
        defaultHoursPerNight: Number(settings.defaultHoursPerNight),
      });
    }
  }, [settingsResult, form]);

  const mutation = useMutation({
    mutationFn: (data: DefaultsFormData) => updateForecastingDefaults(data),
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Default values saved");
        queryClient.invalidateQueries({ queryKey: ["userSettings"] });
      } else {
        toast.error(result.error || "Failed to save defaults");
      }
    },
    onError: () => {
      toast.error("Failed to save defaults");
    },
  });

  const onSubmit = (data: DefaultsFormData) => {
    mutation.mutate(data);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Forecasting Defaults</CardTitle>
        <CardDescription>
          Default values for revenue forecasting calculations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="defaultDtrRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Daily Tractor Rate (DTR)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          $
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          className="pl-7"
                          value={field.value}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Base pay per tour ($452 default)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="defaultAccessorialRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Average Accessorial Rate</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          $
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          className="pl-7"
                          value={field.value}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Average accessorial per tour ($77 default)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="defaultTruckCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Truck Count</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormDescription>
                    Number of trucks in your fleet (2 default)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="border-t pt-6">
              <h4 className="text-sm font-medium mb-4">Labor Costs</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="defaultHourlyWage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hourly Wage</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            $
                          </span>
                          <Input
                            type="number"
                            step="0.01"
                            className="pl-7"
                            value={field.value}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>Driver hourly wage ($20 default)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="defaultHoursPerNight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hours per Night</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.5"
                          min={0}
                          max={24}
                          value={field.value}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormDescription>
                        Average hours worked per night (10 default)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
