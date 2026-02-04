"use client";

import { useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface YearSelectorProps {
  value: number | null;
  onChange: (year: number) => void;
  minYear?: number;
  maxYear?: number;
  disabled?: boolean;
}

export function YearSelector({
  value,
  onChange,
  minYear,
  maxYear,
  disabled = false,
}: YearSelectorProps) {
  const currentYear = new Date().getFullYear();
  const effectiveMinYear = minYear ?? currentYear - 5;
  const effectiveMaxYear = maxYear ?? currentYear;

  const years = useMemo(() => {
    const result: number[] = [];
    for (let year = effectiveMaxYear; year >= effectiveMinYear; year--) {
      result.push(year);
    }
    return result;
  }, [effectiveMinYear, effectiveMaxYear]);

  return (
    <Select
      value={value?.toString() ?? ""}
      onValueChange={(val) => onChange(parseInt(val, 10))}
      disabled={disabled}
    >
      <SelectTrigger className="w-[120px]">
        <SelectValue placeholder="Select year" />
      </SelectTrigger>
      <SelectContent>
        {years.map((year) => (
          <SelectItem key={year} value={year.toString()}>
            {year}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
