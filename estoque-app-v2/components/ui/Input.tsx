"use client";

import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={clsx(
        "w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-ink/35",
        "focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={clsx(
      "w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-ink/35",
      "focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink/50">
      {children}
    </label>
  );
}
