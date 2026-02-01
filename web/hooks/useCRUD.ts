import { useState, useCallback } from 'react';
import { toast } from 'sonner';

/**
 * Generic CRUD hook for managing list data with API operations.
 *
 * @typeParam T - The data item type
 * @typeParam C - The create request type
 * @typeParam U - The update request type
 */
export function useCRUD<T extends { id?: number }, C, U>(options: {
  /** Fetch list data */
  fetchList: () => Promise<T[]>;
  /** Create new item */
  create?: (data: C) => Promise<{ id: number }>;
  /** Update existing item */
  update?: (id: number, data: U) => Promise<void>;
  /** Delete item */
  delete?: (id: number) => Promise<void>;
  /** Success message for create */
  createSuccessMessage?: string;
  /** Success message for update */
  updateSuccessMessage?: string;
  /** Success message for delete */
  deleteSuccessMessage?: string;
}) {
  const { fetchList, create, update, delete: remove, createSuccessMessage, updateSuccessMessage, deleteSuccessMessage } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Load data
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchList();
      setData(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('加载失败');
      setError(error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [fetchList]);

  // Create item
  const createItem = useCallback(async (request: C) => {
    if (!create) {
      toast.error('创建功能不可用');
      return null;
    }

    setLoading(true);
    try {
      const result = await create(request);
      toast.success(createSuccessMessage || '创建成功');
      await load();
      return result.id;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('创建失败');
      toast.error(error.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [create, createSuccessMessage, load]);

  // Update item
  const updateItem = useCallback(async (id: number, request: U) => {
    if (!update) {
      toast.error('更新功能不可用');
      return false;
    }

    setLoading(true);
    try {
      await update(id, request);
      toast.success(updateSuccessMessage || '更新成功');
      await load();
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('更新失败');
      toast.error(error.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [update, updateSuccessMessage, load]);

  // Delete item
  const deleteItem = useCallback(async (id: number) => {
    if (!remove) {
      toast.error('删除功能不可用');
      return false;
    }

    setLoading(true);
    try {
      await remove(id);
      toast.success(deleteSuccessMessage || '删除成功');
      await load();
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('删除失败');
      toast.error(error.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [remove, deleteSuccessMessage, load]);

  return {
    data,
    setData,
    loading,
    error,
    load,
    createItem,
    updateItem,
    deleteItem,
  };
}

/**
 * Hook for managing form dialog state.
 */
export function useFormDialog<T = unknown>() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [initialData, setInitialData] = useState<T | null>(null);

  const openCreate = useCallback((data?: T) => {
    setMode('create');
    setInitialData(data || null);
    setOpen(true);
  }, []);

  const openEdit = useCallback((data: T) => {
    setMode('edit');
    setInitialData(data);
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setInitialData(null);
  }, []);

  return {
    open,
    mode,
    initialData,
    openCreate,
    openEdit,
    close,
  };
}
