import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import * as React from 'react';

export interface FloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  placeholder?: string;
  error?: string;
}

const FloatingInput = React.forwardRef<HTMLInputElement, FloatingInputProps>(
  (
    { className, label, error, type, value, defaultValue, onChange, onBlur, placeholder, ...props },
    ref
  ) => {
    const id = React.useId();
    const [focused, setFocused] = React.useState(false);
    const [internalValue, setInternalValue] = React.useState(value || defaultValue || '');

    // Handle controlled input
    React.useEffect(() => {
      if (value !== undefined) {
        setInternalValue(value);
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInternalValue(e.target.value);
      onChange?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(false);
      onBlur?.(e);
    };

    const handleFocus = () => {
      setFocused(true);
    };

    const isFloating = focused || !!internalValue;

    return (
      <div className='relative'>
        <div className='relative'>
          <Input
            id={id}
            type={type}
            value={value}
            defaultValue={defaultValue}
            className={cn(
              'placeholder:text-transparent focus:placeholder:text-muted-foreground',
              error && 'border-destructive',
              className
            )}
            placeholder={placeholder}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            ref={ref}
            {...props}
          />
          <label
            htmlFor={id}
            className={cn(
              'absolute px-2 bg-background text-muted-foreground transition-all duration-200',
              'pointer-events-none',
              isFloating ? 'left-3 -top-2 text-xs' : 'left-3 top-1/2 -translate-y-1/2 text-sm'
            )}
          >
            {label}
          </label>
        </div>
        {error && <p className='text-sm text-destructive mt-1'>{error}</p>}
      </div>
    );
  }
);

FloatingInput.displayName = 'FloatingInput';

export { FloatingInput };
