import { Spinner } from '@/components/custom/loading';
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
import { getSession } from '@/server/auth';
import { generateBreadcrumbs } from '@/utils';
import { redirect } from 'next/navigation';
import * as React from 'react';
import { Suspense } from 'react';
import { AppSidebar } from './_sidebar';

interface LayoutProps {
  children: React.ReactNode;
  params: { slug: string[] };
}

/**
 * Layout component for the admin section of the application
 * Handles authentication, layout structure, and error boundaries
 */
export default async function AdminLayout({ children, params }: LayoutProps) {
  const session = await getSession();

  if (!session?.data?.session) {
    redirect('/auth');
  }

  const breadcrumbs = generateBreadcrumbs(params.slug);

  return (
    <div className='flex h-screen'>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className='flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12'>
            <div className='flex items-center gap-2 px-4'>
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
