"use client";

import { useState, useRef } from "react";
import { X } from "lucide-react";
import { getLabelColor } from "@/lib/utils/label-colors";

interface LabelInputProps {
  value: string[];
  onChange: (labels: string[]) => void;
  disabled?: boolean;
}

export function LabelInput({ value, onChange, disabled }: LabelInputProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function addLabel(text: string) {
    const label = text.trim().toLowerCase();
    if (!label || value.includes(label)) return;
    if (value.length >= 20) return;
    onChange([...value, label]);
    setInput("");
  }

  function removeLabel(label: string) {
    onChange(value.filter((l) => l !== label));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      addLabel(input);
    } else if (e.key === "Backspace" && !input && value.length > 0) {
      removeLabel(value[value.length - 1]);
    }
  }

  return (
    <div
      className="flex flex-wrap items-center gap-1.5 rounded-md border bg-background px-2 py-1.5 min-h-9 cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((label) => {
        const color = getLabelColor(label);
        return (
          <span
            key={label}
            className={`inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded ${color.bg} ${color.text}`}
          >
            {label}
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeLabel(label);
                }}
                className="hover:opacity-70"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </span>
        );
      })}
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (input.trim()) addLabel(input);
        }}
        disabled={disabled}
        placeholder={value.length === 0 ? "Type and press Enter..." : ""}
        className="flex-1 min-w-16 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
      />
    </div>
  );
}
