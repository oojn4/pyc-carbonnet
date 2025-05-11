import { cn } from "@/utils/classnames";
import { FC, TextareaHTMLAttributes, useEffect, useRef, useState } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  minRows?: number;
  maxRows?: number;
}

/**
 * auto expand textarea
 */
export const Textarea: FC<TextareaProps> = ({
  className,
  minRows = 3,
  maxRows = 10,
  value,
  onChange,
  ...props
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [_value, setValue] = useState(value || "");

  /**
   * adjust height of textarea
   */
  const adjustHeight = () => {
    const textarea = textareaRef.current;

    if (!textarea) return;

    textarea.style.height = "auto";

    const lineHeight = Number.parseInt(
      window.getComputedStyle(textarea).lineHeight || "20"
    );

    const minHeight = minRows * lineHeight;

    const maxHeight = maxRows * lineHeight;

    const newHeight = Math.min(
      Math.max(textarea.scrollHeight, minHeight),
      maxHeight
    );

    textarea.style.height = `${newHeight}px`;

    textarea.style.overflowY =
      textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  };

  /**
   * create listener for resize event in window
   */
  useEffect(() => {
    const handleResize = () => adjustHeight();

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /**
   * adjust height when value changes
   */
  useEffect(() => {
    adjustHeight();
  }, [_value]);

  /**
   * when value changes from outside
   */
  useEffect(() => {
    setValue(value || "");
  }, [value]);

  return (
    <textarea
      rows={minRows}
      ref={textareaRef}
      value={_value}
      className={cn(
        "w-full resize-none overflow-hidden rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      onChange={(e) => {
        setValue(e.target.value);

        onChange?.(e);
      }}
      {...props}
    />
  );
};
