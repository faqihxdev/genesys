'use client';

import { NavUser } from '@/components/ui-sidebar/nav-user';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/use-auth';
import {
  Activity,
  ChartNoAxesGantt,
  ChevronsUpDown,
  FileText,
  Home,
  LayoutDashboard,
  MessageSquare,
  Search,
  Settings,
  Users,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';

const adminNavItems = [
  {
    title: 'Dashboard',
    url: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Users',
    url: '/admin/users',
    icon: Users,
  },
  {
    title: 'Posts',
    url: '/admin/posts',
    icon: FileText,
  },
  {
    title: 'Threads',
    url: '/admin/threads',
    icon: ChartNoAxesGantt,
  },
  {
    title: 'Comments',
    url: '/admin/comments',
    icon: MessageSquare,
  },
  {
    title: 'Activity Logs',
    url: '/admin/logs',
    icon: Activity,
  },
  {
    title: 'Settings',
    url: '/admin/settings',
    icon: Settings,
  },
];

const navigationOptions = [
  {
    name: 'Home',
    path: '/',
    icon: Home,
  },
  {
    name: 'Search',
    path: '/search',
    icon: Search,
  },
];

/**
 * Sidebar component specifically for the admin section
 * @returns {JSX.Element} Admin sidebar component
 */
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { theme, systemTheme } = useTheme();

  // Helper function to check if a path is active
  const isPathActive = (itemUrl: string) => {
    if (itemUrl === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(itemUrl) && pathname !== '/admin';
  };

  return (
    <Sidebar collapsible='icon' {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size='lg'
                  className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
                >
                  <Image
                    src='/genesys-logo.png'
                    alt='Genesys Logo'
                    width={128}
                    height={128}
                    className='size-7 mx-1'
                  />
                  <div className='grid flex-1 text-left text-sm leading-tight'>
                    <span className='truncate font-semibold'>Genesys Dashboard</span>
                    <span className='truncate text-xs'>Admin Panel</span>
                  </div>
                  <ChevronsUpDown className='ml-auto size-4' />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className='w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg'
                align='start'
                side='right'
                sideOffset={4}
              >
                {navigationOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.path}
                    onClick={() => {
                      router.push(option.path);
                    }}
                    className='gap-2 p-2'
                  >
                    <div className='flex size-6 items-center justify-center rounded-sm border'>
                      <option.icon className='size-4 shrink-0' />
                    </div>
                    {option.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {adminNavItems.map((item) => (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton
                  asChild
                  className={
                    isPathActive(item.url) ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''
                  }
                >
                  <Link href={item.url}>
                    <item.icon className='h-4 w-4' />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>{user && <NavUser user={user} />}</SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
