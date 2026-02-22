"use client";

import * as React from "react";
import { ZodError, ZodSchema } from "zod";
import { cn } from "@/lib/utils";

export interface FormErrors {
  [key: string]: string[];
}

export interface UseFormOptions<T> {
  schema?: ZodSchema<T>;
  defaultValues?: Partial<T>;
  onSubmit: (data: T) => Promise<void> | void;
}

export interface UseFormReturn<T> {
  values: Partial<T>;
  errors: FormErrors;
  isSubmitting: boolean;
  isValid: boolean;
  setValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setValues: (values: Partial<T>) => void;
  setFieldError: (field: keyof T, error: string) => void;
  clearErrors: (field?: keyof T) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  reset: () => void;
}

export function useForm<T extends Record<string, unknown>>({
  schema,
  defaultValues = {},
  onSubmit,
}: UseFormOptions<T>): UseFormReturn<T> {
  const [values, setValuesState] = React.useState<Partial<T>>(defaultValues);
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const setValue = React.useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setValuesState((prev) => ({ ...prev, [field]: value }));
    // Clear error when value changes
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field as string];
      return next;
    });
  }, []);

  const setValues = React.useCallback((newValues: Partial<T>) => {
    setValuesState((prev) => ({ ...prev, ...newValues }));
  }, []);

  const setFieldError = React.useCallback((field: keyof T, error: string) => {
    setErrors((prev) => ({
      ...prev,
      [field]: [error],
    }));
  }, []);

  const clearErrors = React.useCallback((field?: keyof T) => {
    if (field) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field as string];
        return next;
      });
    } else {
      setErrors({});
    }
  }, []);

  const validate = React.useCallback((): boolean => {
    if (!schema) return true;

    try {
      schema.parse(values);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof ZodError) {
        const newErrors: FormErrors = {};
        error.errors.forEach((err) => {
          const path = err.path.join(".");
          if (!newErrors[path]) {
            newErrors[path] = [];
          }
          newErrors[path].push(err.message);
        });
        setErrors(newErrors);
      }
      return false;
    }
  }, [schema, values]);

  const handleSubmit = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validate()) return;

      setIsSubmitting(true);
      try {
        await onSubmit(values as T);
      } catch (error) {
        console.error("Form submission error:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, validate, onSubmit]
  );

  const reset = React.useCallback(() => {
    setValuesState(defaultValues);
    setErrors({});
    setIsSubmitting(false);
  }, [defaultValues]);

  return {
    values,
    errors,
    isSubmitting,
    isValid: Object.keys(errors).length === 0,
    setValue,
    setValues,
    setFieldError,
    clearErrors,
    handleSubmit,
    reset,
  };
}

// Form Field Component
interface FormFieldProps {
  name: string;
  label?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  name,
  label,
  error,
  required,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label
          htmlFor={name}
          className="text-sm font-medium flex items-center gap-1"
        >
          {label}
          {required && <span className="text-destructive">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}

// Form Root Component
interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
}

export function Form({ children, className, ...props }: FormProps) {
  return (
    <form
      className={cn("space-y-4", className)}
      {...props}
    >
      {children}
    </form>
  );
}
