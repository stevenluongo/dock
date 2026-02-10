"use client";

import { useState, useRef } from "react";
import { X } from "lucide-react";

interface AssigneeInputProps {
  value: string[];
  onChange: (assignees: string[]) => void;
  disabled?: boolean;
}

function GitHubAvatar({ username, size = 20 }: { username: string; size?: number }) {
  return (
    <img
      src={`https://github.com/${username}.png?size=${size * 2}`}
      alt={username}
      width={size}
      height={size}
      className="rounded-full"
    />
  );
}

export function AssigneeInput({ value, onChange, disabled }: AssigneeInputProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function addAssignee(text: string) {
    const username = text.trim().toLowerCase().replace(/^@/, "");
    if (!username || value.includes(username)) return;
    if (value.length >= 10) return;
    onChange([...value, username]);
    setInput("");
  }

  function removeAssignee(username: string) {
    onChange(value.filter((a) => a !== username));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      addAssignee(input);
    } else if (e.key === "Backspace" && !input && value.length > 0) {
      removeAssignee(value[value.length - 1]);
    }
  }

  return (
    <div
      className="flex flex-wrap items-center gap-1.5 rounded-md border bg-background px-2 py-1.5 min-h-9 cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((username) => (
        <span
          key={username}
          className="inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded bg-muted text-foreground"
        >
          <GitHubAvatar username={username} size={14} />
          {username}
          {!disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeAssignee(username);
              }}
              className="hover:opacity-70"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (input.trim()) addAssignee(input);
        }}
        disabled={disabled}
        placeholder={value.length === 0 ? "GitHub username..." : ""}
        className="flex-1 min-w-20 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
      />
    </div>
  );
}

export { GitHubAvatar };
