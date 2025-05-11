import { cn } from "@/utils/classnames";
import React from "react";

interface TimelineProps {
  /**
   * Position of the timeline content
   * @default "left"
   */
  positions?: "left" | "right";
  /**
   * Child components
   */
  children: React.ReactNode;
  /**
   * Additional CSS class names
   */
  className?: string;
}

export function Timeline({
  positions = "left",
  children,
  className,
}: TimelineProps) {
  return (
    <div className={cn("space-y-0", className)}>
      {children}
    </div>
  );
}

type TimelineItemStatus = "default" | "done" | "current" | "pending" | "error";

interface TimelineItemProps {
  /**
   * Status of the timeline item
   * @default "default"
   */
  status?: TimelineItemStatus;
  /**
   * Child components
   */
  children: React.ReactNode;
  /**
   * Additional CSS class names
   */
  className?: string;
}

export function TimelineItem({
  status = "default",
  children,
  className,
}: TimelineItemProps) {
  return (
    <div className={cn("relative flex pb-5", className)}>
      {children}
    </div>
  );
}

interface TimelineHeadingProps {
  /**
   * Child components
   */
  children: React.ReactNode;
  /**
   * Additional CSS class names
   */
  className?: string;
}

export function TimelineHeading({
  children,
  className,
}: TimelineHeadingProps) {
  return (
    <div className={cn("text-sm font-medium", className)}>
      {children}
    </div>
  );
}

type TimelineDotStatus = "default" | "done" | "current" | "pending" | "error";

interface TimelineDotProps {
  /**
   * Status of the timeline dot
   * @default "default"
   */
  status?: TimelineDotStatus;
  /**
   * Additional CSS class names
   */
  className?: string;
}

export function TimelineDot({
  status = "default",
  className,
}: TimelineDotProps) {
  return (
    <div className="z-10 flex items-center justify-center">
      <div
        className={cn(
          "size-3 rounded-full border-2 border-background",
          {
            "bg-gray-200": status === "default",
            "bg-green-500": status === "done",
            "bg-blue-500": status === "current",
            "bg-amber-500": status === "pending",
            "bg-red-500": status === "error",
          },
          className
        )}
      />
    </div>
  );
}

interface TimelineLineProps {
  /**
   * Whether the line is done
   * @default false
   */
  done?: boolean;
  /**
   * Additional CSS class names
   */
  className?: string;
}

export function TimelineLine({
  done = false,
  className,
}: TimelineLineProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 left-[5px] right-auto h-full w-[2px] translate-x-1/2",
        done ? "bg-gray-300" : "bg-gray-100",
        className
      )}
    />
  );
}

interface TimelineContentProps {
  /**
   * Side of the timeline content
   * @default "right"
   */
  side?: "left" | "right";
  /**
   * Child components
   */
  children: React.ReactNode;
  /**
   * Additional CSS class names
   */
  className?: string;
}

export function TimelineContent({
  side = "right",
  children,
  className,
}: TimelineContentProps) {
  return (
    <div
      className={cn(
        "pt-0.5",
        side === "left" ? "pr-4" : "pl-4",
        className
      )}
    >
      {children}
    </div>
  );
}