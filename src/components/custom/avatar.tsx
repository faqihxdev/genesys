import { User } from '@supabase/supabase-js';
import { cva, type VariantProps } from 'class-variance-authority';

import { AvatarFallback, AvatarImage, Avatar as BaseAvatar } from '@/components/ui/avatar';
import { cn } from '@/utils';

const avatarVariants = cva('', {
  variants: {
    size: {
      sm: 'h-8 w-8',
      md: 'h-9 w-9',
      lg: 'h-10 w-10',
      xl: 'h-12 w-12',
    },
    shape: {
      circle: 'rounded-full',
      square: 'rounded-lg',
    },
  },
  defaultVariants: {
    size: 'md',
    shape: 'circle',
  },
});

export interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  user?: User | null;
  src?: string;
  fallback?: string;
  showFallback?: boolean;
}

/**
 * @description A custom avatar component that extends shadcn's Avatar with additional features
 * @param {AvatarProps} props - The props for the avatar component
 * @returns {JSX.Element} The avatar component
 */
export function Avatar({
  user,
  src,
  fallback,
  showFallback = true,
  size,
  shape,
  className,
  ...props
}: AvatarProps) {
  // Get the display text for fallback
  const getFallbackText = () => {
    if (fallback) return fallback;
    if (!user) return '??';

    // Try to get initials from email or name
    const email = user.email;
    const name = user.user_metadata?.full_name || user.user_metadata?.name;

    if (name) {
      return name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }

    if (email) {
      return email.slice(0, 2).toUpperCase();
    }

    return '??';
  };

  // Get the avatar source
  const getAvatarSrc = () => {
    if (src) return src;
    if (!user) return undefined;
    return user.user_metadata?.avatar_url || user.user_metadata?.picture;
  };

  // Get the accessible name
  const getAriaLabel = () => {
    if (!user) return 'Avatar';
    return `Avatar for ${user.user_metadata?.full_name || user.user_metadata?.name || user.email || 'user'}`;
  };

  const variantStyles = avatarVariants({ size, shape });

  return (
    <BaseAvatar
      className={cn(variantStyles, 'relative flex shrink-0 overflow-hidden', className)}
      {...props}
    >
      <AvatarImage
        src={getAvatarSrc()}
        alt={getAriaLabel()}
        className={cn(variantStyles, 'object-cover')}
      />
      {showFallback && (
        <AvatarFallback className={cn(variantStyles, 'flex items-center justify-center bg-muted')}>
          <span className='text-sm font-medium leading-none'>{getFallbackText()}</span>
        </AvatarFallback>
      )}
    </BaseAvatar>
  );
}
