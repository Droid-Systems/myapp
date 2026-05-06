"use client";

import { useState, useRef, useEffect } from "react";

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const MIN_YEAR = 1920;

const DatePicker = ({ value, onChange, className = "" }: DatePickerProps) => {
  const today = new Date();
  // Maximum selectable date = exactly 18 years ago
  const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  const maxYear = maxDate.getFullYear();

  const [isOpen, setIsOpen] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(maxDate);
  const pickerRef = useRef<HTMLDivElement>(null);
  const yearListRef = useRef<HTMLDivElement>(null);

  const selectedDate = value ? new Date(value + "T00:00:00") : null;

  // Close when clicking outside
  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowYearPicker(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [isOpen]);

  // When opening, navigate to selected date (or maxDate if unset)
  useEffect(() => {
    if (isOpen) {
      setCurrentMonth(selectedDate && selectedDate <= maxDate ? new Date(selectedDate) : new Date(maxDate));
      setShowYearPicker(false);
    }
  }, [isOpen]);

  // Scroll selected year into view when year picker opens
  useEffect(() => {
    if (showYearPicker && yearListRef.current) {
      const el = yearListRef.current.querySelector("[data-selected='true']") as HTMLElement | null;
      el?.scrollIntoView({ block: "center", behavior: "instant" });
    }
  }, [showYearPicker]);

  const formatDisplay = (dateStr: string) => {
    if (!dateStr) return "Select date";
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const getDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDow = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const cells: (number | null)[] = Array(firstDow).fill(null);
    for (let d = 1; d <= totalDays; d++) cells.push(d);
    return cells;
  };

  const isDisabled = (day: number) =>
    new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day) > maxDate;

  const isSelected = (day: number) =>
    !!selectedDate &&
    day === selectedDate.getDate() &&
    currentMonth.getMonth() === selectedDate.getMonth() &&
    currentMonth.getFullYear() === selectedDate.getFullYear();

  const isToday = (day: number) =>
    day === today.getDate() &&
    currentMonth.getMonth() === today.getMonth() &&
    currentMonth.getFullYear() === today.getFullYear();

  const canGoNext = () => {
    const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    return next <= new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
  };

  const handleDayClick = (day: number) => {
    if (isDisabled(day)) return;
    const y = currentMonth.getFullYear();
    const m = currentMonth.getMonth();
    onChange(`${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
    setIsOpen(false);
  };

  // Years in descending order (most recent first for easier lookup)
  const years = Array.from({ length: maxYear - MIN_YEAR + 1 }, (_, i) => maxYear - i);
  const days = getDays(currentMonth);
  const headerLabel = currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div ref={pickerRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-left text-sm text-black outline-none transition-colors focus:border-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white ${className}`}
      >
        <span className={value ? "" : "text-gray-400 dark:text-gray-500"}>
          {formatDisplay(value)}
        </span>
        <svg
          className={`h-4 w-4 shrink-0 text-gray-500 transition-transform dark:text-gray-400 ${isOpen ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 z-[200] mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800 sm:left-auto sm:right-auto sm:w-72">

          {/* Header */}
          <div className="flex items-center gap-1 border-b border-gray-200 bg-gray-50 px-2 py-2 dark:border-gray-700 dark:bg-gray-900">
            {/* Prev month arrow — hidden while year picker is open */}
            {!showYearPicker && (
              <button
                type="button"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-gray-600 transition-colors hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {/* Clickable month/year label → opens year picker */}
            <button
              type="button"
              onClick={() => setShowYearPicker((v) => !v)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-md px-1 py-1 text-sm font-semibold text-black transition-colors hover:bg-gray-200 dark:text-white dark:hover:bg-gray-700"
            >
              <span>{showYearPicker ? "Select Year" : headerLabel}</span>
              <svg
                className={`h-3.5 w-3.5 text-gray-500 transition-transform ${showYearPicker ? "rotate-180" : ""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Next month arrow */}
            {!showYearPicker && (
              <button
                type="button"
                onClick={() => { if (canGoNext()) setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)); }}
                disabled={!canGoNext()}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-gray-600 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-30 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>

          {/* ── Year picker grid ── */}
          {showYearPicker ? (
            <div ref={yearListRef} className="max-h-56 overflow-y-auto p-2">
              <div className="grid grid-cols-3 gap-1">
                {years.map((year) => {
                  const isCurrent = year === currentMonth.getFullYear();
                  return (
                    <button
                      key={year}
                      type="button"
                      data-selected={isCurrent}
                      onClick={() => {
                        setCurrentMonth(new Date(year, currentMonth.getMonth()));
                        setShowYearPicker(false);
                      }}
                      className={`rounded-lg py-2 text-sm font-medium transition-colors ${
                        isCurrent
                          ? "bg-primary text-white"
                          : "text-black hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                      }`}
                    >
                      {year}
                    </button>
                  );
                })}
              </div>
            </div>

          ) : (
            /* ── Calendar grid ── */
            <div className="p-3">
              <div className="mb-1 grid grid-cols-7 gap-1">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                  <div key={d} className="flex h-8 items-center justify-center text-xs font-medium text-gray-500 dark:text-gray-400">
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {days.map((day, i) => (
                  <div key={i}>
                    {day ? (
                      <button
                        type="button"
                        onClick={() => handleDayClick(day)}
                        disabled={isDisabled(day)}
                        className={`flex h-8 w-full items-center justify-center rounded-md text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-25 ${
                          isSelected(day)
                            ? "bg-primary font-semibold text-white"
                            : isToday(day)
                            ? "border border-primary font-medium text-primary"
                            : "text-black hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                        }`}
                      >
                        {day}
                      </button>
                    ) : (
                      <div className="h-8" />
                    )}
                  </div>
                ))}
              </div>

              <p className="mt-2.5 text-center text-xs text-gray-400 dark:text-gray-500">
                Must be 18 years or older
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DatePicker;
