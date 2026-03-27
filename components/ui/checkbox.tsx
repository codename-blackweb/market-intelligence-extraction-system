"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      type="checkbox"
      className={cn(
        "h-4 w-4 rounded border border-zinc-300 bg-transparent accent-zinc-900 dark:border-zinc-700 dark:accent-zinc-100",
        className
      )}
      {...props}
    />
  )
);

Checkbox.displayName = "Checkbox";

export { Checkbox };
