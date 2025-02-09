import { NavMenu } from '@/app/(public)/_nav-menu';
import Image from 'next/image';
import Link from 'next/link';

const navLinks = [
  { href: '#features', label: 'Features' },
  { href: '#customers', label: 'Customers' },
  { href: '#pricing', label: 'Pricing' },
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
              <Link href='/' className='flex items-center gap-2 mr-4'>
                <Image
                  src='/genesys-logo.png'
                  alt='Genesys Logo'
                  width={128}
                  height={128}
                  className='h-8 w-8'
                />
                <span className='font-bold text-xl leading-none'>Genesys</span>
              </Link>
              <div className='inline-flex items-center rounded-full bg-indigo-100 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800/30 border px-3 py-1 mr-8'>
                <span className='text-[11px] font-medium text-indigo-700 dark:text-indigo-300 whitespace-nowrap'>
                  Alpha Release
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
              <NavMenu navLinks={navLinks} />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className='mx-auto px-4 sm:px-6 lg:px-8'>{children}</main>
    </>
  );
}
