import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { LucideMenu } from 'lucide-react';
import Link from 'next/link';

const navLinks = [
  { href: '#', label: 'Platform' },
  { href: '#', label: 'Resources' },
  { href: '/#customers', label: 'Customers' },
  { href: '/#pricing', label: 'Pricing' },
];

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {/* Navigation */}
      <nav className='fixed top-0 left-0 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50'>
        <div className='w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex h-16 items-center justify-between'>
            <div className='flex items-center'>
              <Link href='/' className='font-bold text-xl mr-4'>
                Genesys
              </Link>
              <div className='inline-flex items-center rounded-full bg-purple-100 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800/30 border px-3 py-1 mr-8'>
                <span className='text-[11px] font-medium text-purple-700 dark:text-purple-300'>
                  Alpha Release • Invite Only
                </span>
              </div>
              <div className='hidden lg:flex items-center space-x-6'>
                {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className='text-muted-foreground hover:text-primary transition-colors text-sm'
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className='flex items-center gap-4'>
              <div className='hidden sm:flex items-center gap-4'>
                <Link href='/auth'>
                  <Button variant='ghost'>Sign in</Button>
                </Link>
                <Link href='/auth?tab=signup'>
                  <Button>Start for free</Button>
                </Link>
              </div>

              {/* Mobile Menu */}
              <div className='md:hidden'>
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
                    <div className='flex flex-col gap-4 mt-6'>
                      {navLinks.map((link) => (
                        <Link
                          key={link.label}
                          href={link.href}
                          className='text-muted-foreground hover:text-primary transition-colors py-2'
                        >
                          {link.label}
                        </Link>
                      ))}
                      <hr className='my-4' />
                      <Link href='/auth'>
                        <Button variant='ghost' className='w-full justify-start'>
                          Sign in
                        </Button>
                      </Link>
                      <Link href='/auth?tab=signup'>
                        <Button className='w-full'>Start for free</Button>
                      </Link>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className='mx-auto px-4 sm:px-6 lg:px-8'>{children}</main>
    </>
  );
}
