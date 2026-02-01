'use client';

import { useState, useCallback } from 'react';

// ==================== Field Error Type ====================

export interface FieldError {
  message: string;
}

// ==================== Form Errors Type ====================

export type FormErrors<T> = Partial<Record<keyof T, FieldError>>;

// ==================== useForm Hook ====================

export function useForm<T extends Record<string, unknown>>(
  initialValues: T,
  options?: {
    validate?: (values: T) => Partial<Record<keyof T, string>>;
    onSubmit?: (values: T) => Promise<void> | void;
  }
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors<T>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(true);

  const handleChange = useCallback(
    <K extends keyof T>(name: K, value: T[K]) => {
      setValues((prev) => ({ ...prev, [name]: value }));
      // Clear error when value changes
      if (errors[name]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[name];
          return next;
        });
      }
    },
    [errors]
  );

  const handleBlur = useCallback(<K extends keyof T>(name: K) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
  }, []);

  const validate = useCallback(() => {
    if (!options?.validate) {
      return true;
    }

    const validationErrors = options.validate(values);
    const errorEntries = Object.entries(validationErrors) as [keyof T, string][];
    const formattedErrors: FormErrors<T> = {};

    errorEntries.forEach(([key, message]) => {
      formattedErrors[key] = { message };
    });

    setErrors(formattedErrors);
    setIsValid(Object.keys(formattedErrors).length === 0);
    return Object.keys(formattedErrors).length === 0;
  }, [values, options]);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
      }

      // Mark all fields as touched
      const allTouched = Object.keys(values).reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {} as Partial<Record<keyof T, boolean>>
      );
      setTouched(allTouched);

      // Validate
      const isFormValid = validate();
      if (!isFormValid) {
        return;
      }

      setIsSubmitting(true);

      try {
        await options?.onSubmit?.(values);
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, validate, options]
  );

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
    setIsValid(true);
  }, [initialValues]);

  const setFieldValue = useCallback(
    <K extends keyof T>(name: K, value: T[K]) => {
      handleChange(name, value);
    },
    [handleChange]
  );

  const setFieldError = useCallback(
    (name: keyof T, error: FieldError | null) => {
      setErrors((prev) => {
        if (error === null) {
          const next = { ...prev };
          delete next[name];
          return next;
        }
        return { ...prev, [name]: error };
      });
    },
    []
  );

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setFieldValue,
    setFieldError,
    setValues,
    setErrors,
  };
}

// ==================== useFormField Hook ====================

export function useFormField<T extends Record<string, unknown>>(
  name: keyof T,
  form: ReturnType<typeof useForm<T>>
) {
  const value = form.values[name];
  const error = form.errors[name];
  const touched = form.touched[name];

  const onChange = useCallback(
    (value: T[keyof T]) => {
      form.handleChange(name, value);
    },
    [form, name]
  );

  const onBlur = useCallback(() => {
    form.handleBlur(name);
  }, [form, name]);

  return {
    value,
    error: error?.message,
    touched: touched ?? false,
    onChange,
    onBlur,
  };
}
