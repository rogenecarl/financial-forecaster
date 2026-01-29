"use client";

import { useState, useEffect, useRef } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAvailableQuartersForReport, type QuarterOption } from "@/actions/reports/report-data";

interface QuarterSelectorProps {
  value: QuarterOption | null;
  onChange: (quarter: QuarterOption) => void;
  disabled?: boolean;
}

export function QuarterSelector({ value, onChange, disabled }: QuarterSelectorProps) {
  const [quarters, setQuarters] = useState<QuarterOption[]>([]);
  const [loading, setLoading] = useState(true);
  const initializedRef = useRef(false);
  const onChangeRef = useRef(onChange);

  // Keep onChange ref updated
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    async function loadQuarters() {
      if (initializedRef.current) return;
      initializedRef.current = true;

      setLoading(true);
      const result = await getAvailableQuartersForReport(8);
      if (result.success && result.data) {
        setQuarters(result.data);
        // Set default to current quarter if no value provided
        if (result.data.length > 0) {
          onChangeRef.current(result.data[0]);
        }
      }
      setLoading(false);
    }
    loadQuarters();
  }, []);

  const handleChange = (index: string) => {
    const quarter = quarters[parseInt(index)];
    if (quarter) {
      onChange(quarter);
    }
  };

  const selectedIndex = value
    ? quarters.findIndex(
        (q) =>
          q.quarterStart.getTime() === new Date(value.quarterStart).getTime()
      )
    : -1;

  return (
    <Select
      value={selectedIndex >= 0 ? selectedIndex.toString() : undefined}
      onValueChange={handleChange}
      disabled={disabled || loading}
    >
      <SelectTrigger className="w-[140px]">
        <SelectValue placeholder={loading ? "Loading..." : "Select quarter"} />
      </SelectTrigger>
      <SelectContent>
        {quarters.map((quarter, index) => (
          <SelectItem key={index} value={index.toString()}>
            {quarter.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
