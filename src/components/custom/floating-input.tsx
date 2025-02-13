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
    const localRef = React.useRef<HTMLInputElement | null>(null);
    const [focused, setFocused] = React.useState(false);
    const [internalValue, setInternalValue] = React.useState(value ?? defaultValue ?? '');

    // If a controlled value is provided, update internal state
    React.useEffect(() => {
      if (value !== undefined) {
        setInternalValue(value);
      }
    }, [value]);

    // Effect to check for browser-autofilled value
    React.useEffect(() => {
      const checkAutofill = () => {
        const inputValue = localRef.current?.value;
        if (inputValue && inputValue !== internalValue) {
          setInternalValue(inputValue);
        }
      };

      // Check immediately and after a short delay to catch browser autofill
      checkAutofill();
      const timeoutId = setTimeout(checkAutofill, 100);
      return () => clearTimeout(timeoutId);
    }, [internalValue]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInternalValue(newValue);
      onChange?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(false);
      onBlur?.(e);
    };

    const handleFocus = () => {
      setFocused(true);
    };

    // Sync refs
    React.useImperativeHandle(ref, () => localRef.current!, []);

    // Float the label if the input is focused or if there is any text
    const isFloating = focused || !!internalValue || !!localRef.current?.value;

    return (
      <div className='relative'>
        <div className='relative'>
          <Input
            id={id}
            type={type}
            defaultValue={defaultValue}
            value={value !== undefined ? value : undefined}
            className={cn(
              'placeholder:text-transparent focus:placeholder:text-muted-foreground',
              error && 'border-destructive',
              className
            )}
            placeholder={placeholder}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            ref={localRef}
            {...props}
          />
          <label
            htmlFor={id}
            className={cn(
              'absolute px-2 bg-background leading-none text-muted-foreground transition-all duration-200 rounded-full',
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
