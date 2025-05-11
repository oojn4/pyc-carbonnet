import { cn } from "@/utils/classnames";
import * as React from "react";

interface SwitchProps extends React.HTMLAttributes<HTMLDivElement> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
}

const Switch = React.forwardRef<HTMLDivElement, SwitchProps>(
  ({ className, checked = false, onCheckedChange, size = "md", disabled = false, ...props }, ref) => {
    const sizeClasses = {
      sm: "h-4 w-8",
      md: "h-6 w-11",
      lg: "h-8 w-14"
    };
    
    const thumbSizeClasses = {
      sm: "h-3 w-3 translate-x-0.5",
      md: "h-5 w-5 translate-x-0.5",
      lg: "h-7 w-7 translate-x-0.5"
    };
    
    const thumbActiveClasses = {
      sm: "translate-x-4.5",
      md: "translate-x-5.5",
      lg: "translate-x-6.5"
    };
    
    const handleClick = () => {
      if (!disabled && onCheckedChange) {
        onCheckedChange(!checked);
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          checked ? "bg-primary" : "bg-input",
          disabled && "cursor-not-allowed opacity-50",
          sizeClasses[size],
          className
        )}
        role="switch"
        aria-checked={checked}
        onClick={handleClick}
        tabIndex={disabled ? -1 : 0}
        {...props}
      >
        <div
          className={cn(
            "pointer-events-none block rounded-full bg-background shadow-lg ring-0 transition-transform",
            thumbSizeClasses[size],
            checked && thumbActiveClasses[size]
          )}
        />
      </div>
    );
  }
);

Switch.displayName = "Switch";

export { Switch };
