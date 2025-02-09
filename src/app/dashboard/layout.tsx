import { Avatar } from '@/components/custom/avatar';
import { Spinner } from '@/components/custom/loading';
import { UserDropdown } from '@/components/custom/user-dropdown';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { getCurrentUser } from '@/server/auth';
import { generateBreadcrumbs } from '@/utils';
import { Bell } from 'lucide-react';
import { redirect } from 'next/navigation';
import * as React from 'react';
import { Suspense } from 'react';
import { AppSidebar } from './_sidebar';

// Mock notifications data
const mockNotifications = [
  {
    id: 1,
    title: 'New persona created',
    description: 'Your AI persona "Marketing Manager" has been generated.',
    time: '2 minutes ago',
  },
  {
    id: 2,
    title: 'Funnel analysis complete',
    description: 'Analysis for "Q1 Campaign" is ready to view.',
    time: '1 hour ago',
  },
  {
    id: 3,
    title: 'Weekly report',
    description: 'Your weekly analytics report is available.',
    time: '1 day ago',
  },
];

interface LayoutProps {
  children: React.ReactNode;
  params: { slug: string[] };
}

/**
 * Layout component for the admin section of the application
 * Handles authentication, layout structure, and error boundaries
 */
export default async function AdminLayout({ children, params }: LayoutProps) {
  const { data: user, error } = await getCurrentUser();

  if (error || !user) {
    redirect('/auth');
  }

  const breadcrumbs = generateBreadcrumbs(params.slug);

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
                    <React.Fragment key={item.href}>
                      <BreadcrumbItem>
                        {index === breadcrumbs.length - 1 ? (
                          <BreadcrumbPage>{item.label}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                      {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                    </React.Fragment>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className='flex items-center gap-4'>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className='relative flex items-center justify-center rounded-lg p-2 hover:bg-accent'>
                    <Bell className='h-5 w-5 text-muted-foreground hover:text-foreground transition-colors' />
                    <span className='absolute top-0 right-0 flex h-4 w-4 leading-none items-center justify-center rounded-full bg-primary text-[10px] font-medium text-white'>
                      {mockNotifications.length}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='w-80'>
                  {mockNotifications.map((notification, index) => (
                    <React.Fragment key={notification.id}>
                      <DropdownMenuItem className='flex flex-col items-start gap-1 p-3'>
                        <div className='font-medium'>{notification.title}</div>
                        <div className='text-sm text-muted-foreground'>
                          {notification.description}
                        </div>
                        <div className='text-xs text-muted-foreground'>{notification.time}</div>
                      </DropdownMenuItem>
                      {index < mockNotifications.length - 1 && <DropdownMenuSeparator />}
                    </React.Fragment>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <UserDropdown user={user} side='bottom' showOnHover>
                <button className='flex items-center rounded-full border bg-background transition-all hover:ring-primary hover:ring-2'>
                  <Avatar user={user} size='sm' shape='circle' />
                </button>
              </UserDropdown>
            </div>
          </header>
          <main className='flex-1 overflow-auto'>
            <Suspense fallback={<Spinner />}>
              <div className='container mx-auto p-4 md:p-6'>{children}</div>
            </Suspense>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
