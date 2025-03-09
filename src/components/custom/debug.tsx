'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Bug, ChevronRight, Clipboard, Copy, Download, Search, XCircle } from 'lucide-react';
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
  const [open, setOpen] = useState(true);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [expandedValues, setExpandedValues] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPath, setCurrentPath] = useState<string>('');
  const [previousData, setPreviousData] = useState<Record<string, unknown>>({});
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(0);

  // Debounced search term
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 150);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Store previous data for change detection
  useEffect(() => {
    if (open) {
      setPreviousData(data);
    }
  }, [data, open]);

  // Check if a value has changed since last render
  const hasValueChanged = useCallback(
    (path: string[], value: unknown): boolean => {
      if (!previousData || Object.keys(previousData).length === 0) return false;

      let current = previousData;
      for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]] || typeof current[path[i]] !== 'object') return false;
        current = current[path[i]] as Record<string, unknown>;
      }

      const lastKey = path[path.length - 1];
      if (!(lastKey in current)) return false;

      // For primitive values, do a simple comparison
      if (typeof value !== 'object' || value === null) {
        return current[lastKey] !== value;
      }

      // For objects, check if they're different references
      return current[lastKey] !== value;
    },
    [previousData]
  );

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

  // Dynamic height calculation - improved to ensure all content is visible
  useEffect(() => {
    if (!containerRef.current || !open) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const height = entries[0].contentRect.height;
      // Increase max height to accommodate more content
      setContainerHeight(Math.min(height, 600)); // Increased from 500px to 600px
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [open]);

  const handleCopy = useCallback(
    (value: unknown) => {
      navigator.clipboard.writeText(JSON.stringify(value, null, 2));
      toast({ title: 'Copied', duration: 1500 });
    },
    [toast]
  );

  const handleDownload = useCallback(() => {
    const a = document.createElement('a');
    const file = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    a.href = URL.createObjectURL(file);
    a.download = 'debug-data.json';
    a.click();
    URL.revokeObjectURL(a.href);
  }, [data]);

  // Copy path to clipboard
  const handleCopyPath = useCallback(
    (path: string[]) => {
      const pathString = path.join('.');
      navigator.clipboard.writeText(pathString);
      toast({ title: 'Path copied', description: pathString, duration: 1500 });
    },
    [toast]
  );

  // Copy entire data object
  const handleCopyEntireData = useCallback(() => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    toast({ title: 'Copied entire object', duration: 1500 });
  }, [data, toast]);

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
          style={{ maxHeight: `${containerHeight + 66}px` }} // Increased to account for both header bars
        >
          <div className='flex items-center gap-1 p-1.5 border-b sticky top-0 bg-background z-10'>
            <Search className='h-3 w-3 ml-2 text-muted-foreground' />
            <Input
              placeholder='Search keys and values...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='h-6 text-xs placeholder:text-xs border-none bg-transparent focus-visible:ring-1 focus-visible:ring-primary/20'
            />
            <Button 
              variant='ghost' 
              size='icon' 
              className='h-6 w-6' 
              onClick={handleCopyEntireData}
              title='Copy entire object'
            >
              <Copy className='h-3 w-3' />
            </Button>
            <Button 
              variant='ghost' 
              size='icon' 
              className='h-6 w-6' 
              onClick={handleDownload}
              title='Download JSON'
            >
              <Download className='h-3 w-3' />
            </Button>
          </div>

          {/* Path display - now always visible */}
          <div className='px-2 py-1 text-xs border-b bg-muted/20 flex items-center gap-1 overflow-x-auto whitespace-nowrap sticky top-[33px] z-10'>
            <span className='text-muted-foreground'>Path:</span>
            <span className='font-mono'>{currentPath || 'Hover over an item to see its path'}</span>
          </div>

          <div
            ref={containerRef}
            className='overflow-y-auto overflow-x-hidden'
            style={{
              height: 'auto',
              maxHeight: '600px', // Increased from 500px to 600px
            }}
          >
            {visibleResults.length > 0 ? (
              <div className='pb-2'>
                {visibleResults.map((item, index) => {
                  const key = item.path.join('.');
                  const value = item.value;
                  const isObject = typeof value === 'object' && value !== null;
                  const depth = item.path.length;
                  const stringValue = !isObject ? String(value) : '';
                  const isLongValue = stringValue.length > 50;
                  const isValueExpanded = expandedValues.includes(key);
                  const isRootProp = depth === 1;
                  const valueChanged = hasValueChanged(item.path, value);

                  return (
                    <div
                      key={index}
                      className={`group relative transition-colors
                        ${isRootProp ? 'border-t first:border-t-0' : ''}
                        ${depth % 2 === 0 ? 'bg-muted/20' : ''}
                        ${debouncedSearchTerm && (item.matches.key || item.matches.value) ? 'bg-yellow-100/10 dark:bg-yellow-900/10' : ''}
                        ${valueChanged ? 'bg-blue-100/10 dark:bg-blue-900/10' : ''}
                        hover:bg-muted/50`}
                      onMouseEnter={() => setCurrentPath(key)}
                    >
                      <div className='grid grid-cols-[auto,1fr] gap-0.5'>
                        <div
                          className='flex items-center gap-0.5 px-2 py-0.5 cursor-pointer text-xs'
                          style={{
                            paddingLeft: isRootProp ? '8px' : `${(depth - 1) * 12 + 20}px`,
                            ...(isRootProp && { paddingTop: '8px', paddingBottom: '8px' }),
                          }}
                          onClick={() => {
                            if (isObject) {
                              setExpanded((exp) => {
                                if (exp.includes(key)) {
                                  return exp.filter((k) => !(k === key || k.startsWith(key + '.')));
                                } else {
                                  return [...exp, key];
                                }
                              });
                            } else if (isLongValue) {
                              setExpandedValues((exp) =>
                                exp.includes(key) ? exp.filter((k) => k !== key) : [...exp, key]
                              );
                            }
                          }}
                        >
                          <TreeLines depth={depth} isLastChild={item.isLastChild} />

                          {isObject ? (
                            <ChevronRight
                              className={`h-2.5 w-2.5 transition-transform duration-200 flex-shrink-0
                                ${expanded.includes(key) ? 'rotate-90' : ''}`}
                            />
                          ) : isLongValue ? (
                            <ChevronRight
                              className={`h-2.5 w-2.5 transition-transform duration-200 flex-shrink-0
                                ${isValueExpanded ? 'rotate-90' : ''}`}
                            />
                          ) : null}

                          <span
                            className={`whitespace-nowrap ${isRootProp ? 'font-semibold text-primary' : 'font-medium'} ${valueChanged ? 'text-blue-600 dark:text-blue-400' : ''}`}
                          >
                            <HighlightText
                              text={item.path[item.path.length - 1]}
                              searchTerm={debouncedSearchTerm}
                            />
                            :
                          </span>
                        </div>

                        {!isObject && (
                          <div
                            className='flex items-center pr-2 min-w-0 gap-1'
                            style={{
                              ...(isRootProp && { paddingTop: '8px', paddingBottom: '8px' }),
                            }}
                          >
                            <span
                              className={`text-muted-foreground truncate flex-1 text-xs ${valueChanged ? 'text-blue-600 dark:text-blue-400 font-medium' : ''}`}
                            >
                              <HighlightText
                                text={
                                  isLongValue && !isValueExpanded
                                    ? stringValue.slice(0, 50) + '...'
                                    : stringValue
                                }
                                searchTerm={debouncedSearchTerm}
                              />
                            </span>
                            <span className='text-[10px] px-1 rounded bg-muted/50 text-muted-foreground font-medium'>
                              {getValueType(value)}
                            </span>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='h-4 w-4 opacity-0 group-hover:opacity-100 flex-shrink-0'
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(value);
                              }}
                              title='Copy value'
                            >
                              <Copy className='h-2.5 w-2.5' />
                            </Button>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='h-4 w-4 opacity-0 group-hover:opacity-100 flex-shrink-0'
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyPath(item.path);
                              }}
                              title='Copy path'
                            >
                              <Clipboard className='h-2.5 w-2.5' />
                            </Button>
                          </div>
                        )}
                        
                        {isObject && (
                          <div
                            className='flex items-center pr-2 min-w-0 gap-1'
                            style={{
                              ...(isRootProp && { paddingTop: '8px', paddingBottom: '8px' }),
                            }}
                          >
                            <span className='text-[10px] px-1 rounded bg-muted/50 text-muted-foreground font-medium'>
                              {getValueType(value)}
                            </span>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='h-4 w-4 opacity-0 group-hover:opacity-100 flex-shrink-0'
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(value);
                              }}
                              title='Copy object'
                            >
                              <Copy className='h-2.5 w-2.5' />
                            </Button>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='h-4 w-4 opacity-0 group-hover:opacity-100 flex-shrink-0'
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyPath(item.path);
                              }}
                              title='Copy path'
                            >
                              <Clipboard className='h-2.5 w-2.5' />
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Expanded value section */}
                      {!isObject && isValueExpanded && (
                        <div
                          className='bg-muted/5 text-xs'
                          style={{
                            paddingLeft: isRootProp ? '8px' : `${(depth - 1) * 12 + 20}px`,
                          }}
                        >
                          <pre className='whitespace-pre-wrap font-mono p-2 overflow-x-auto'>
                            <HighlightText text={stringValue} searchTerm={debouncedSearchTerm} />
                          </pre>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className='p-3 text-center text-xs text-muted-foreground'>No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
