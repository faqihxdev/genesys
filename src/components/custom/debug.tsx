'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Bug, ChevronRight, Copy, Download, Filter, Search, XCircle } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface DebugPanelProps {
  data: Record<string, unknown>;
}

type SearchMatch = {
  path: string[];
  value: unknown;
  matches: { key?: boolean; value?: boolean };
  isLastChild: boolean;
  parent?: string;
};

/**
 * Highlights text based on search term
 */
function HighlightText({ text, searchTerm }: { text: string; searchTerm: string }) {
  if (!searchTerm) return <>{text}</>;

  const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === searchTerm.toLowerCase() ? (
          <span key={i} className='bg-yellow-200/50 dark:bg-yellow-800/50'>
            {part}
          </span>
        ) : (
          part
        )
      )}
    </>
  );
}

/**
 * Renders hierarchical lines for a tree item
 */
function TreeLines({ depth, isLastChild }: { depth: number; isLastChild: boolean }) {
  if (depth <= 1) return null;

  // Spacing constants.
  const indent = 12;
  const offset = 24; // Increased to align with the tree item padding.
  const containerWidth = (depth - 1) * indent + offset;

  return (
    <div
      className='absolute left-0 top-0 bottom-0 pointer-events-none'
      style={{ width: containerWidth }}
    >
      {Array.from({ length: depth - 1 }, (_, i) => (
        <div
          key={i}
          className='absolute border-l border-muted-foreground/20'
          style={{
            left: i * indent + offset,
            top: 0,
            // Shorten the final vertical line if this item is the last child.
            bottom: isLastChild && i === depth - 2 ? '50%' : 0,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Get the type of a value in a readable format
 */
function getValueType(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') return isNaN(value) ? 'NaN' : 'number';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'bigint') return 'bigint';
  if (typeof value === 'symbol') return 'symbol';
  if (typeof value === 'function') return 'function';
  if (typeof value === 'object') return 'object';
  return 'unknown';
}

/**
 * @description A compact floating debug panel with advanced features
 * @param data - Object containing debug data to display
 */
export function FloatingDebugPanel({ data }: DebugPanelProps) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [expandedValues, setExpandedValues] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(0);
  const [previousData, setPreviousData] = useState<Record<string, unknown>>({});
  const [typeFilters, setTypeFilters] = useState<string[]>([]);
  const allTypes = ['string', 'number', 'boolean', 'object', 'array', 'null', 'undefined'];

  // Debounced search term
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 150);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Store previous data for change detection
  useEffect(() => {
    if (open) {
      setPreviousData(JSON.parse(JSON.stringify(data)));
    }
  }, [data, open]);

  // Check if a value has changed
  const hasValueChanged = (path: string[], currentValue: unknown): boolean => {
    if (!previousData || Object.keys(previousData).length === 0) return false;

    let prevValue = previousData;
    for (let i = 0; i < path.length; i++) {
      if (i === 0) continue; // Skip the first element which is the prop name
      if (prevValue === undefined || prevValue === null) return true;
      prevValue = prevValue[path[i] as keyof typeof prevValue] as Record<string, unknown>;
    }

    if (typeof currentValue !== typeof prevValue) return true;
    if (currentValue === null || prevValue === null) return currentValue !== prevValue;

    if (Array.isArray(currentValue) && Array.isArray(prevValue)) {
      return JSON.stringify(currentValue) !== JSON.stringify(prevValue);
    }

    if (typeof currentValue === 'object' && typeof prevValue === 'object') {
      return JSON.stringify(currentValue) !== JSON.stringify(prevValue);
    }

    return currentValue !== prevValue;
  };

  // Enhanced search results with parent-child relationships
  const searchResults = useMemo(() => {
    const results: SearchMatch[] = [];
    const matchingPaths = new Set<string>();

    const search = (obj: unknown, path: string[] = [], parentPath?: string): void => {
      if (!obj || typeof obj !== 'object') return;

      const entries = Object.entries(obj);
      entries.forEach(([key, value], index) => {
        const currentPath = [...path, key];
        const currentKey = currentPath.join('.');
        const matches = {
          key: key.toLowerCase().includes(debouncedSearchTerm.toLowerCase()),
          value:
            typeof value === 'object'
              ? false
              : String(value).toLowerCase().includes(debouncedSearchTerm.toLowerCase()),
        };

        if (debouncedSearchTerm === '' || matches.key || matches.value) {
          // Add all parent paths to matching paths for auto-expansion
          if (debouncedSearchTerm !== '') {
            let pathToAdd = '';
            currentPath.forEach((segment) => {
              pathToAdd = pathToAdd ? `${pathToAdd}.${segment}` : segment;
              matchingPaths.add(pathToAdd);
            });
          }

          results.push({
            path: currentPath,
            value,
            matches,
            isLastChild: index === entries.length - 1,
            parent: parentPath,
          });
        }

        if (value && typeof value === 'object') {
          search(value, currentPath, currentKey);
        }
      });
    };

    search(data);

    // Auto-expand parents of matching items
    if (debouncedSearchTerm) {
      setExpanded(Array.from(matchingPaths));
    }

    return results;
  }, [data, debouncedSearchTerm]);

  // Filter visible results based on expanded state or search term
  const visibleResults = useMemo(() => {
    if (debouncedSearchTerm) return searchResults;
    return searchResults.filter((item) => {
      if (!item.parent) return true;
      return expanded.includes(item.parent);
    });
  }, [searchResults, expanded, debouncedSearchTerm]);

  // Dynamic height calculation
  useEffect(() => {
    if (!containerRef.current || !open) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const height = entries[0].contentRect.height;
      setContainerHeight(Math.min(height, 500)); // Max height of 500px
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [open]);

  const handleCopy = useCallback(
    (value: unknown) => {
      const stringValue =
        typeof value === 'object' && value !== null
          ? JSON.stringify(value, null, 2)
          : String(value);
      navigator.clipboard.writeText(stringValue);
      toast({
        title: 'Copied to clipboard',
        duration: 2000,
      });
    },
    [toast]
  );

  const handleDownload = useCallback(() => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'debug-data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  }, [data]);

  // Copy path to clipboard
  const copyPath = (path: string[]) => {
    const pathString = path.join('.');
    navigator.clipboard.writeText(pathString);
    toast({
      title: 'Path copied to clipboard',
      description: pathString,
      duration: 2000,
    });
  };

  const renderTree = (
    matches: SearchMatch[],
    depth = 0,
    parentPath: string[] = [],
    isLastGroup = true
  ) => {
    return matches.map((match, index) => {
      const isLastChild = index === matches.length - 1;
      const isRootProp = depth === 1;
      const currentPath = [...parentPath, ...match.path];
      const valueType = getValueType(match.value);
      const hasChanged = hasValueChanged(currentPath, match.value);

      // Skip if type filtering is active and this type is not included
      if (typeFilters.length > 0 && !typeFilters.includes(valueType)) {
        return null;
      }

      if (typeof match.value !== 'object' || match.value === null) {
        return (
          <div
            key={currentPath.join('.')}
            className={cn(
              'grid grid-cols-[auto,1fr] relative',
              isRootProp && 'border-t border-border/30 py-1'
            )}
          >
            <div className='flex items-center'>
              <TreeLines depth={depth} isLastChild={isLastChild} />
              <div
                className={cn(
                  'flex items-center min-w-0',
                  isRootProp && 'font-semibold text-primary'
                )}
              >
                <span
                  className={cn(
                    'truncate',
                    match.matches.key && 'bg-yellow-200 dark:bg-yellow-900'
                  )}
                >
                  {match.path[match.path.length - 1]}:
                </span>
              </div>
            </div>

            <div className='flex items-center pr-2 min-w-0 gap-1'>
              <span
                className={cn(
                  'truncate',
                  match.matches.value && 'bg-yellow-200 dark:bg-yellow-900',
                  hasChanged && 'bg-blue-100 dark:bg-blue-900/30'
                )}
              >
                {String(match.value)}
              </span>
              <span className='text-[10px] px-1 rounded bg-muted/50 text-muted-foreground font-medium'>
                {valueType}
              </span>
              <Button
                variant='ghost'
                size='icon'
                className='h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity'
                onClick={() => copyPath(currentPath)}
              >
                <Copy className='h-3 w-3' />
              </Button>
            </div>
          </div>
        );
      }

      const isArray = Array.isArray(match.value);
      const isEmpty = isArray
        ? (match.value as unknown[]).length === 0
        : Object.keys(match.value as object).length === 0;
      const nodeId = currentPath.join('.');
      const isExpanded = expanded.includes(nodeId);

      return (
        <div key={nodeId} className='group'>
          <div
            className={cn(
              'grid grid-cols-[auto,1fr] relative',
              isRootProp && 'border-t border-border/30 py-1'
            )}
          >
            <div className='flex items-center'>
              <TreeLines depth={depth} isLastChild={isLastChild} />
              <Button
                variant='ghost'
                size='icon'
                className='h-4 w-4 p-0'
                onClick={() => toggleExpand(nodeId)}
                disabled={isEmpty}
              >
                {!isEmpty && (
                  <>
                    {isExpanded ? (
                      <ChevronDown className='h-3 w-3' />
                    ) : (
                      <ChevronRight className='h-3 w-3' />
                    )}
                  </>
                )}
              </Button>
              <div
                className={cn(
                  'flex items-center min-w-0',
                  isRootProp && 'font-semibold text-primary'
                )}
              >
                <span
                  className={cn(
                    'truncate',
                    match.matches.key && 'bg-yellow-200 dark:bg-yellow-900'
                  )}
                >
                  {match.path[match.path.length - 1]}:
                </span>
              </div>
            </div>

            <div className='flex items-center pr-2 min-w-0 gap-1'>
              <span className={cn('truncate', hasChanged && 'bg-blue-100 dark:bg-blue-900/30')}>
                {isArray ? `Array(${(match.value as unknown[]).length})` : 'Object'}
              </span>
              <span className='text-[10px] px-1 rounded bg-muted/50 text-muted-foreground font-medium'>
                {valueType}
              </span>
              <Button
                variant='ghost'
                size='icon'
                className='h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity'
                onClick={() => copyPath(currentPath)}
              >
                <Copy className='h-3 w-3' />
              </Button>
            </div>
          </div>

          {isExpanded && !isEmpty && (
            <div className='relative'>
              {renderTree(
                getChildrenAsMatches(match.value, match.path),
                depth + 1,
                currentPath,
                isLastChild
              )}
            </div>
          )}
        </div>
      );
    });
  };

  // Toggle expand/collapse of a node
  const toggleExpand = (nodeId: string) => {
    setExpanded((exp) => {
      if (exp.includes(nodeId)) {
        return exp.filter((k) => !(k === nodeId || k.startsWith(nodeId + '.')));
      } else {
        return [...exp, nodeId];
      }
    });
  };

  // Get children of an object as SearchMatch[]
  const getChildrenAsMatches = (obj: unknown, parentPath: string[]): SearchMatch[] => {
    const results: SearchMatch[] = [];
    const search = (obj: unknown, path: string[] = [], parentPath?: string): void => {
      if (!obj || typeof obj !== 'object') return;

      const entries = Object.entries(obj);
      entries.forEach(([key, value], index) => {
        const currentPath = [...path, key];
        const currentKey = currentPath.join('.');
        const matches = {
          key: key.toLowerCase().includes(debouncedSearchTerm.toLowerCase()),
          value:
            typeof value === 'object'
              ? false
              : String(value).toLowerCase().includes(debouncedSearchTerm.toLowerCase()),
        };

        if (debouncedSearchTerm === '' || matches.key || matches.value) {
          results.push({
            path: currentPath,
            value,
            matches,
            isLastChild: index === entries.length - 1,
            parent: parentPath,
          });
        }

        if (value && typeof value === 'object') {
          search(value, currentPath, currentKey);
        }
      });
    };

    search(obj);
    return results;
  };

  return (
    <div className='fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2'>
      <Button
        size='sm'
        variant='default'
        className='rounded-full shadow-lg'
        onClick={() => setOpen(!open)}
      >
        {open ? <XCircle className='h-4 w-4' /> : <Bug className='h-4 w-4' />}
      </Button>

      {open && (
        <div
          className='bg-background border rounded-lg overflow-hidden shadow-lg transition-all duration-200 ease-in-out isolate w-[420px]'
          style={{ maxHeight: `${containerHeight + 33}px` }}
        >
          <div className='flex items-center gap-1 p-1.5 border-b sticky top-0 bg-background z-10'>
            <Search className='h-3 w-3 text-muted-foreground' />
            <Input
              placeholder='Search keys and values...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='h-6 text-xs placeholder:text-xs border-none bg-transparent focus-visible:ring-1 focus-visible:ring-primary/20'
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='ghost' size='icon' className='h-6 w-6'>
                  <Filter className='h-3 w-3' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                {allTypes.map((type) => (
                  <DropdownMenuCheckboxItem
                    key={type}
                    checked={typeFilters.includes(type)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setTypeFilters([...typeFilters, type]);
                      } else {
                        setTypeFilters(typeFilters.filter((t) => t !== type));
                      }
                    }}
                  >
                    {type}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant='ghost' size='icon' className='h-6 w-6' onClick={handleDownload}>
              <Download className='h-3 w-3' />
            </Button>
          </div>

          <div
            ref={containerRef}
            className='overflow-y-auto overflow-x-hidden'
            style={{
              height: 'auto',
              maxHeight: '500px',
            }}
          >
            {searchResults.length > 0 ? (
              <div className='p-1'>{renderTree(searchResults)}</div>
            ) : (
              <div className='p-4 text-center text-sm text-muted-foreground'>No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
