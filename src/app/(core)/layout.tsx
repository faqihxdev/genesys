import { Avatar } from '@/components/custom/avatar';
import { NotificationBell } from '@/components/custom/notification-bell';
import { Spinner } from '@/components/custom/spinner';
import { UserDropdown } from '@/components/custom/user-dropdown';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { generateBreadcrumbs } from '@/lib/utils';
import { getCurrentUser } from '@/server/auth';
import { AlertTriangle } from 'lucide-react';
import { redirect } from 'next/navigation';
import { Fragment, ReactNode, Suspense } from 'react';
import { AppSidebar } from './_sidebar';

export const dynamic = 'force-dynamic';

interface CoreLayoutProps {
  children: ReactNode;
  params: Promise<Record<string, string>>;
}

/**
 * Layout component for the dashboard section of the application
 * Handles authentication, layout structure, and breadcrumb navigation
 */
export default async function CoreLayout({ children, params }: CoreLayoutProps) {
  const { data: user, error } = await getCurrentUser();

  if (error || !user) {
    redirect('/auth');
  }

  const resolvedParams = await params;

  // Get the current pathname segments for breadcrumbs
  const pathSegments = Object.values(resolvedParams);
  const breadcrumbs = generateBreadcrumbs(pathSegments);

  return (
    <div className='flex h-screen'>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className='flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12'>
            <div className='flex items-center gap-2'>
              <SidebarTrigger className='-ml-1' />
              <Separator orientation='vertical' className='mr-2 h-4' />
              <Breadcrumb>
                <BreadcrumbList>
                  {breadcrumbs.map((item, index) => (
                    <Fragment key={item.href}>
                      <BreadcrumbItem>
                        {index === breadcrumbs.length - 1 ? (
                          <BreadcrumbPage>{item.label}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                      {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                    </Fragment>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
              <div className='ml-3 flex items-center'>
                <span className='inline-flex items-center gap-1 rounded-md bg-yellow-50 px-2 py-1 text-xs font-light text-yellow-800 ring-1 ring-inset ring-yellow-600/10 dark:bg-yellow-900/30 dark:text-yellow-200 dark:ring-yellow-500/10'>
                  <AlertTriangle size={12} className='mr-0.5' />
                  Prototype Demo: Expect Slower Performance
                </span>
              </div>
            </div>
            <div className='flex items-center gap-4'>
              <NotificationBell />
              <UserDropdown user={user} side='bottom' showOnHover>
                <button className='flex items-center rounded-full border bg-background transition-all hover:ring-primary hover:ring-2'>
                  <Avatar user={user} size='sm' shape='circle' />
                </button>
              </UserDropdown>
            </div>
          </header>
          <main className='flex-1'>
            <Suspense fallback={<Spinner />}>
              <div className='container mx-auto p-4 md:p-6'>{children}</div>
            </Suspense>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
