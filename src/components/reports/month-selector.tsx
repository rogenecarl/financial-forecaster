"use client";

import { useState, useEffect, useRef } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAvailableMonthsForReport, type MonthOption } from "@/actions/reports/report-data";

interface MonthSelectorProps {
  value: MonthOption | null;
  onChange: (month: MonthOption) => void;
  disabled?: boolean;
}

export function MonthSelector({ value, onChange, disabled }: MonthSelectorProps) {
  const [months, setMonths] = useState<MonthOption[]>([]);
  const [loading, setLoading] = useState(true);
  const initializedRef = useRef(false);
  const onChangeRef = useRef(onChange);

  // Keep onChange ref updated
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    async function loadMonths() {
      if (initializedRef.current) return;
      initializedRef.current = true;

      setLoading(true);
      const result = await getAvailableMonthsForReport(12);
      if (result.success && result.data) {
        setMonths(result.data);
        // Set default to current month if no value provided
        if (result.data.length > 0) {
          onChangeRef.current(result.data[0]);
        }
      }
      setLoading(false);
    }
    loadMonths();
  }, []);

  const handleChange = (index: string) => {
    const month = months[parseInt(index)];
    if (month) {
      onChange(month);
    }
  };

  const selectedIndex = value
    ? months.findIndex(
        (m) => m.monthStart.getTime() === new Date(value.monthStart).getTime()
      )
    : -1;

  return (
    <Select
      value={selectedIndex >= 0 ? selectedIndex.toString() : undefined}
      onValueChange={handleChange}
      disabled={disabled || loading}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder={loading ? "Loading..." : "Select month"} />
      </SelectTrigger>
      <SelectContent>
        {months.map((month, index) => (
          <SelectItem key={index} value={index.toString()}>
            {month.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
