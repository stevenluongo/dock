"use client";

import { useState, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownPreview } from "@/components/ui/markdown-preview";

interface MarkdownTextareaProps {
  id?: string;
  name?: string;
  defaultValue?: string;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  disabled?: boolean;
}

export function MarkdownTextarea({
  id,
  name,
  defaultValue = "",
  placeholder,
  rows = 4,
  maxLength,
  disabled,
}: MarkdownTextareaProps) {
  const [tab, setTab] = useState<string>("write");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentValue =
    textareaRef.current?.value ?? defaultValue;

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList className="h-8">
        <TabsTrigger value="write" className="text-xs px-3 h-6">
          Write
        </TabsTrigger>
        <TabsTrigger value="preview" className="text-xs px-3 h-6">
          Preview
        </TabsTrigger>
      </TabsList>

      <TabsContent value="write" className="mt-2">
        <Textarea
          ref={textareaRef}
          id={id}
          name={name}
          defaultValue={defaultValue}
          placeholder={placeholder}
          rows={rows}
          maxLength={maxLength}
          disabled={disabled}
        />
      </TabsContent>

      <TabsContent value="preview" className="mt-2">
        <div className="min-h-[6rem] rounded-md border bg-background px-3 py-2">
          {currentValue ? (
            <MarkdownPreview content={currentValue} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Nothing to preview
            </p>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}
