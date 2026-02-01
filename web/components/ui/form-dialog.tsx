'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useFormDialog } from '@/hooks/useCRUD';

interface FormDialogProps<T> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  initialData: T | null;
  title: string;
  description?: string;
  children: React.ReactNode;
  onSubmit: () => void;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
}

/**
 * Reusable form dialog component for CRUD operations.
 */
export function FormDialog<T>({
  open,
  onOpenChange,
  mode,
  initialData,
  title,
  description,
  children,
  onSubmit,
  onCancel,
  submitLabel = '保存',
  cancelLabel = '取消',
  isLoading = false,
}: FormDialogProps<T>) {
  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? `新建${title}` : `编辑${title}`}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="grid gap-4 py-4">{children}</div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button onClick={onSubmit} disabled={isLoading}>
            {isLoading ? '保存中...' : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook-based form dialog wrapper that combines useFormDialog with FormDialog.
 */
export function useFormDialogWithState<T>(options: {
  title: string;
  createSubmit?: (data: T) => Promise<void>;
  editSubmit?: (id: number, data: T) => Promise<void>;
  onSuccess?: () => void;
}) {
  const { title, createSubmit, editSubmit, onSuccess } = options;

  const dialog = useFormDialog<T>();
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = async () => {
    if (!dialog.initialData) return;

    setSubmitting(true);
    try {
      if (dialog.mode === 'create' && createSubmit) {
        await createSubmit(dialog.initialData);
      } else if (dialog.mode === 'edit' && editSubmit) {
        // Assuming id is stored in initialData
        const id = (dialog.initialData as { id?: number }).id;
        if (id) {
          await editSubmit(id, dialog.initialData);
        }
      }
      dialog.close();
      onSuccess?.();
    } finally {
      setSubmitting(false);
    }
  };

  return {
    ...dialog,
    title,
    submitting,
    handleSubmit,
    FormDialog: (props: Omit<FormDialogProps<T>, 'open' | 'mode' | 'initialData' | 'title' | 'onSubmit' | 'isLoading' | 'onOpenChange'>) => (
      <FormDialog
        open={dialog.open}
        onOpenChange={dialog.close}
        mode={dialog.mode}
        initialData={dialog.initialData}
        title={title}
        isLoading={submitting}
        onSubmit={handleSubmit}
        {...props}
      />
    ),
  };
}
