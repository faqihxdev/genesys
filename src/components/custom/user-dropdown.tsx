'use client';

import { useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  Home,
  LayoutDashboard,
  LogOut,
  Monitor,
  Moon,
  Sun,
  User as UserIcon,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Avatar } from '@/components/custom/avatar';
import { Spinner } from '@/components/custom/loading';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { User } from '@/types/users';

interface UserDropdownProps {
  user: User;
  side?: 'right' | 'bottom' | 'left' | 'top';
  align?: 'start' | 'center' | 'end';
  children: React.ReactNode;
  showOnHover?: boolean;
}

export function UserDropdown({
  user,
  side = 'bottom',
  align = 'end',
  children,
  showOnHover = false,
}: UserDropdownProps) {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { signOut, isSigningOut } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const displayName = user.email?.split('@')[0] || 'User';

  useEffect(() => {
    setMounted(true);

    // Detect touch capability once on mount
    const detectTouch = () => {
      setIsTouch(true);
      window.removeEventListener('touchstart', detectTouch);
    };
    window.addEventListener('touchstart', detectTouch);

    return () => {
      window.removeEventListener('touchstart', detectTouch);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsOpen(false);
      router.push('/auth');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'An error occurred while signing out.',
        variant: 'destructive',
      });
    }
  };

  const MenuContent = () => (
    <div className='w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg bg-popover p-1 text-popover-foreground shadow-md'>
      <div className='p-0 font-normal'>
        <div className='flex items-center gap-2 px-1 py-1.5 text-left text-sm'>
          <Avatar user={user} size='sm' shape='square' />
          <div className='grid flex-1 text-left text-sm leading-tight'>
            <span className='truncate font-semibold'>{displayName}</span>
            <span className='truncate text-xs text-muted-foreground'>{user.email}</span>
          </div>
        </div>
      </div>
      <DropdownMenuSeparator className='-mx-1 my-1 h-px bg-muted' />
      <div className='flex flex-col'>
        <Link
          href='/dashboard/account'
          className='relative flex w-full cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground'
        >
          <UserIcon className='h-4 w-4' />
          Account
        </Link>
        <Link
          href='/dashboard/notifications'
          className='relative flex w-full cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground'
        >
          <Bell className='h-4 w-4' />
          Notifications
        </Link>
        <Link
          href='/dashboard'
          className='relative flex w-full cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground'
        >
          <LayoutDashboard className='h-4 w-4' />
          Dashboard
        </Link>
        <Link
          href='/'
          className='relative flex w-full cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground'
        >
          <Home className='h-4 w-4' />
          Landing Page
        </Link>
      </div>
      <DropdownMenuSeparator className='-mx-1 my-1 h-px bg-muted' />
      <div>
        <button
          className='relative flex w-full cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground'
          onClick={() => {
            if (!mounted) return;
            setTheme(theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light');
          }}
        >
          {mounted && (
            <>
              {theme === 'light' && <Sun className='h-4 w-4' />}
              {theme === 'dark' && <Moon className='h-4 w-4' />}
              {theme === 'system' && <Monitor className='h-4 w-4' />}
              <span>
                {theme === 'light'
                  ? 'Light Theme'
                  : theme === 'dark'
                    ? 'Dark Theme'
                    : 'System Theme'}
              </span>
            </>
          )}
        </button>
      </div>
      <DropdownMenuSeparator className='-mx-1 my-1 h-px bg-muted' />
      <button
        onClick={handleSignOut}
        disabled={isSigningOut}
        className='relative flex w-full cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none text-destructive transition-colors hover:bg-destructive/10 disabled:pointer-events-none disabled:opacity-50'
      >
        {isSigningOut ? <Spinner /> : <LogOut className='h-4 w-4' />}
        {isSigningOut ? 'Signing out...' : 'Log out'}
      </button>
    </div>
  );

  // For touch devices or when hover is disabled, use regular dropdown
  if (isTouch || !showOnHover) {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
        <DropdownMenuContent
          className='w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg p-0'
          side={side}
          align={align}
          sideOffset={4}
        >
          <MenuContent />
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // For non-touch devices with hover enabled, use hybrid approach
  return (
    <div className='relative'>
      <HoverCard openDelay={0} closeDelay={100}>
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <HoverCardTrigger asChild>
            <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
          </HoverCardTrigger>
          <HoverCardContent
            side={side}
            align={align}
            sideOffset={4}
            className='w-[--radix-dropdown-menu-trigger-width] p-0 data-[side=bottom]:mt-0'
            avoidCollisions={false}
          >
            <div className='absolute inset-x-0 -top-[4px] h-[4px] bg-transparent' />
            <MenuContent />
          </HoverCardContent>
        </DropdownMenu>
      </HoverCard>
    </div>
  );
}
