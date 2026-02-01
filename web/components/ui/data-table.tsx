'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// ==================== Column Definition ====================

export interface Column<T> {
  key: string;
  header: string;
  width?: string;
  render?: (value: unknown, row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
}

// ==================== Pagination ====================

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  title?: string;
  loading?: boolean;
  pagination?: PaginationState;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  searchable?: boolean;
  searchKeys?: (keyof T)[];
  onSearch?: (query: string) => void;
  emptyMessage?: string;
  className?: string;
}

// ==================== DataTable Component ====================

export function DataTable<T extends { id?: number }>({
  data,
  columns,
  title,
  loading = false,
  pagination,
  onPageChange,
  onPageSizeChange,
  onSort,
  searchable = false,
  searchKeys = [],
  onSearch,
  emptyMessage = '暂无数据',
  className,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');

  // Handle sorting
  const handleSort = useCallback(
    (key: string) => {
      if (onSort) {
        if (sortKey === key) {
          const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
          setSortDirection(newDirection);
          onSort(key, newDirection);
        } else {
          setSortKey(key);
          setSortDirection('asc');
          onSort(key, 'asc');
        }
      } else {
        // Client-side sorting
        if (sortKey === key) {
          const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
          setSortDirection(newDirection);
        } else {
          setSortKey(key);
          setSortDirection('asc');
        }
      }
    },
    [sortKey, sortDirection, onSort]
  );

  // Filter data based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery || !searchable) {
      return data;
    }

    const lowerQuery = searchQuery.toLowerCase();
    return data.filter((row) => {
      if (onSearch) {
        return true; // Server-side search
      }
      return searchKeys.some((key) => {
        const value = row[key];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(lowerQuery);
        }
        if (value != null) {
          return String(value).toLowerCase().includes(lowerQuery);
        }
        return false;
      });
    });
  }, [data, searchQuery, searchable, searchKeys, onSearch]);

  // Sort filtered data
  const sortedData = useMemo(() => {
    if (!sortKey || !onSort) {
      return filteredData;
    }

    return [...filteredData].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortKey];
      const bVal = (b as Record<string, unknown>)[sortKey];

      let comparison = 0;
      if (aVal != null && bVal != null) {
        if (typeof aVal === 'string') {
          comparison = aVal.localeCompare(String(bVal));
        } else if (typeof aVal === 'number') {
          comparison = (aVal as number) - (bVal as number);
        } else if (aVal instanceof Date) {
          comparison = aVal.getTime() - (bVal as Date).getTime();
        }
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortKey, sortDirection, onSort]);

  return (
    <Card className={cn('w-full', className)}>
      {title && (
        <CardHeader className="pb-3">
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        {/* Search Bar */}
        {searchable && (
          <div className="mb-4 flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  onSearch?.(e.target.value);
                }}
                className="pl-9"
              />
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      'px-4 py-3 text-left text-sm font-medium text-muted-foreground',
                      column.sortable && 'cursor-pointer select-none hover:bg-muted/50',
                      column.align === 'center' && 'text-center',
                      column.align === 'right' && 'text-right'
                    )}
                    style={{ width: column.width }}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center gap-1">
                      {column.header}
                      {column.sortable && sortKey === column.key && (
                        <>
                          {sortDirection === 'asc' ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="py-8 text-center text-muted-foreground">
                    加载中...
                  </td>
                </tr>
              ) : sortedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="py-8 text-center text-muted-foreground">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                sortedData.map((row, index) => (
                  <tr
                    key={row.id ?? index}
                    className="border-b transition-colors hover:bg-muted/50"
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={cn(
                          'px-4 py-3 text-sm',
                          column.align === 'center' && 'text-center',
                          column.align === 'right' && 'text-right'
                        )}
                      >
                        {column.render
                          ? column.render(
                              (row as Record<string, unknown>)[column.key],
                              row,
                              index
                            )
                          : String((row as Record<string, unknown>)[column.key] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.total > 0 && onPageChange && (
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              共 {pagination.total} 条
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                {pagination.page} / {Math.ceil(pagination.total / pagination.pageSize)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
