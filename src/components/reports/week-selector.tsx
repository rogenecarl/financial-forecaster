"use client";

import { useState, useEffect, useRef } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAvailableWeeksForReport, type WeekOption } from "@/actions/reports/report-data";

interface WeekSelectorProps {
  value: WeekOption | null;
  onChange: (week: WeekOption) => void;
  disabled?: boolean;
}

export function WeekSelector({ value, onChange, disabled }: WeekSelectorProps) {
  const [weeks, setWeeks] = useState<WeekOption[]>([]);
  const [loading, setLoading] = useState(true);
  const initializedRef = useRef(false);
  const onChangeRef = useRef(onChange);

  // Keep onChange ref updated
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    async function loadWeeks() {
      if (initializedRef.current) return;
      initializedRef.current = true;

      setLoading(true);
      const result = await getAvailableWeeksForReport(12);
      if (result.success && result.data) {
        setWeeks(result.data);
        // Set default to current week if no value provided
        if (result.data.length > 0) {
          onChangeRef.current(result.data[0]);
        }
      }
      setLoading(false);
    }
    loadWeeks();
  }, []);

  const handleChange = (index: string) => {
    const week = weeks[parseInt(index)];
    if (week) {
      onChange(week);
    }
  };

  const selectedIndex = value
    ? weeks.findIndex(
        (w) => w.weekStart.getTime() === new Date(value.weekStart).getTime()
      )
    : -1;

  return (
    <Select
      value={selectedIndex >= 0 ? selectedIndex.toString() : undefined}
      onValueChange={handleChange}
      disabled={disabled || loading}
    >
      <SelectTrigger className="w-[220px]">
        <SelectValue placeholder={loading ? "Loading..." : "Select week"} />
      </SelectTrigger>
      <SelectContent>
        {weeks.map((week, index) => (
          <SelectItem key={index} value={index.toString()}>
            {week.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
