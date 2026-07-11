import * as React from "react";
import { useFormContext } from "react-hook-form";
import { cn } from "@/utils/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  label?: string;
  helperText?: string;
}

export const FormInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, name, label, helperText, type = "text", ...props }, ref) => {
    const {
      register,
      formState: { errors },
    } = useFormContext();

    const error = errors[name];
    const errorMessage = error?.message as string | undefined;

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label htmlFor={name} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </label>
        )}
        <input
          id={name}
          type={type}
          className={cn(
            "flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all",
            errorMessage && "border-destructive focus-visible:ring-destructive",
            className
          )}
          {...register(name, { valueAsNumber: type === "number" })}
          {...props}
        />
        {errorMessage ? (
          <p className="text-xs font-semibold text-destructive">{errorMessage}</p>
        ) : (
          helperText && <p className="text-xs text-muted-foreground">{helperText}</p>
        )}
      </div>
    );
  }
);
FormInput.displayName = "FormInput";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  name: string;
  label?: string;
  helperText?: string;
}

export const FormTextarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, name, label, helperText, ...props }, ref) => {
    const {
      register,
      formState: { errors },
    } = useFormContext();

    const error = errors[name];
    const errorMessage = error?.message as string | undefined;

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label htmlFor={name} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </label>
        )}
        <textarea
          id={name}
          className={cn(
            "flex min-h-[80px] w-full rounded-lg border border-border bg-card px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all",
            errorMessage && "border-destructive focus-visible:ring-destructive",
            className
          )}
          {...register(name)}
          {...props}
        />
        {errorMessage ? (
          <p className="text-xs font-semibold text-destructive">{errorMessage}</p>
        ) : (
          helperText && <p className="text-xs text-muted-foreground">{helperText}</p>
        )}
      </div>
    );
  }
);
FormTextarea.displayName = "FormTextarea";
