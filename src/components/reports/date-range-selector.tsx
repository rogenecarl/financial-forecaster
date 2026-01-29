"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

interface DateRangeSelectorProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  disabled?: boolean;
}

export function DateRangeSelector({
  value,
  onChange,
  disabled,
}: DateRangeSelectorProps) {
  const [startInput, setStartInput] = useState(
    value.startDate ? value.startDate.toISOString().split("T")[0] : ""
  );
  const [endInput, setEndInput] = useState(
    value.endDate ? value.endDate.toISOString().split("T")[0] : ""
  );

  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateStr = e.target.value;
    setStartInput(dateStr);
    const date = dateStr ? new Date(dateStr + "T00:00:00") : null;
    onChange({ ...value, startDate: date });
  };

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateStr = e.target.value;
    setEndInput(dateStr);
    const date = dateStr ? new Date(dateStr + "T23:59:59") : null;
    onChange({ ...value, endDate: date });
  };

  return (
    <div className="flex items-center gap-2">
      <div className="space-y-1">
        <Label htmlFor="start-date" className="text-xs text-muted-foreground">
          From
        </Label>
        <Input
          id="start-date"
          type="date"
          value={startInput}
          onChange={handleStartChange}
          disabled={disabled}
          className="w-[140px]"
        />
      </div>
      <span className="text-muted-foreground mt-5">—</span>
      <div className="space-y-1">
        <Label htmlFor="end-date" className="text-xs text-muted-foreground">
          To
        </Label>
        <Input
          id="end-date"
          type="date"
          value={endInput}
          onChange={handleEndChange}
          disabled={disabled}
          className="w-[140px]"
        />
      </div>
    </div>
  );
}
