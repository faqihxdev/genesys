'use client';

import { Avatar } from '@/components/custom/avatar';
import { Button } from '@/components/custom/button';
import { UserDropdown } from '@/components/custom/user-dropdown';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/use-auth';
import { LucideMenu } from 'lucide-react';
import Link from 'next/link';

interface NavMenuProps {
  navLinks: Array<{ href: string; label: string }>;
}

export function NavMenu({ navLinks }: NavMenuProps) {
  const { user, isAuthenticated } = useAuth();

  const renderAvatar = (size: 'sm' | 'md' | 'lg' | 'xl') => (
    <Avatar user={user} size={size} shape='circle' />
  );

  const renderNavLinks = () =>
    navLinks.map((link) => (
      <Link
        key={link.label}
        href={link.href}
        className='text-muted-foreground hover:text-primary transition-colors py-2'
      >
        {link.label}
      </Link>
    ));

  const renderMobileSheet = (children: React.ReactNode) => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant='ghost' size='icon'>
          <LucideMenu className='h-5 w-5' />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <div className='flex flex-col gap-4 mt-6'>{children}</div>
      </SheetContent>
    </Sheet>
  );

  if (isAuthenticated && user) {
    return (
      <>
        {/* Desktop User Dropdown */}
        <div className='hidden sm:block'>
          <UserDropdown user={user} showOnHover>
            <button className='flex items-center rounded-full border bg-background transition-all hover:ring-primary hover:ring-2'>
              {renderAvatar('sm')}
            </button>
          </UserDropdown>
        </div>

        {/* Mobile Menu with User */}
        <div className='sm:hidden'>
          {renderMobileSheet(
            <>
              <div className='flex items-center gap-2 py-2'>
                {renderAvatar('sm')}
                <div className='flex flex-col'>
                  <span className='text-sm font-medium'>{user.email?.split('@')[0]}</span>
                  <span className='text-xs text-muted-foreground'>{user.email}</span>
                </div>
              </div>
              <hr className='my-2' />
              {renderNavLinks()}
              <hr className='my-2' />
              {[
                { href: '/project/all', label: 'All Projects' },
                { href: '/account', label: 'Account' },
                { href: '/account/notifications', label: 'Notifications' },
              ].map(({ href, label }) => (
                <Link key={href} href={href}>
                  <Button variant='ghost' className='w-full justify-start'>
                    {label}
                  </Button>
                </Link>
              ))}
            </>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      {/* Unauthenticated Desktop */}
      <div className='hidden sm:flex items-center gap-4'>
        <Link href='/auth'>
          <Button variant='ghost'>Sign in</Button>
        </Link>
        <Link href='/auth?tab=signup'>
          <Button>Start For Free</Button>
        </Link>
      </div>

      {/* Unauthenticated Mobile Menu */}
      <div className='sm:hidden'>
        {renderMobileSheet(
          <>
            {renderNavLinks()}
            <hr className='my-4' />
            <Link href='/auth'>
              <Button variant='ghost' className='w-full justify-start'>
                Sign in
              </Button>
            </Link>
            <Link href='/auth?tab=signup'>
              <Button className='w-full'>Start For Free</Button>
            </Link>
          </>
        )}
      </div>
    </>
  );
}
