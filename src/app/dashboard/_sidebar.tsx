'use client';

import { Button } from '@/components/ui/button';
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
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import {
  ArrowRightCircle,
  BarChart,
  Bell,
  ChevronsUpDown,
  CircleDollarSign,
  Filter,
  FolderGit2,
  Home,
  LayoutDashboard,
  LifeBuoy,
  MessageSquare,
  Search,
  Settings,
  Settings2,
  Sparkles,
  User2,
  Users,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';

const projectNavItems = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Persona',
    url: '/dashboard/persona',
    icon: Users,
  },
  {
    title: 'Funnels',
    url: '/dashboard/funnels',
    icon: Filter,
  },
  {
    title: 'Single Step',
    url: '/dashboard/single-step',
    icon: ArrowRightCircle,
  },
  {
    title: 'Analytics',
    url: '/dashboard/analytics',
    icon: BarChart,
  },
  {
    title: 'Project Settings',
    url: '/dashboard/settings',
    icon: Settings,
  },
];

const platformNavItems = [
  {
    title: 'Projects',
    url: '/dashboard/projects',
    icon: FolderGit2,
  },
  {
    title: 'Platform Settings',
    url: '/dashboard/platform-settings',
    icon: Settings2,
  },
];

const profileNavItems = [
  {
    title: 'Account',
    url: '/dashboard/account',
    icon: User2,
  },
  {
    title: 'Notifications',
    url: '/dashboard/notifications',
    icon: Bell,
  },
  {
    title: 'Billing',
    url: '/dashboard/billing',
    icon: CircleDollarSign,
  },
  {
    title: 'Support',
    url: '/dashboard/support',
    icon: LifeBuoy,
  },
  {
    title: 'Feedback',
    url: '/dashboard/feedback',
    icon: MessageSquare,
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

  // Helper function to check if a path is active
  const isPathActive = (itemUrl: string) => {
    if (itemUrl === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(itemUrl) && pathname !== '/dashboard';
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
                    className='size-7 mx-1 group-data-[collapsible=icon]:mx-0.5'
                  />
                  <div className='grid flex-1 text-left text-sm leading-tight'>
                    <span className='truncate font-semibold'>Genesys</span>
                    <span className='truncate text-xs'>Default Project</span>
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
          <SidebarGroupLabel>Project</SidebarGroupLabel>
          <SidebarMenu>
            {projectNavItems.map((item) => (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
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

        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarMenu>
            {platformNavItems.map((item) => (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
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

        <SidebarGroup>
          <SidebarGroupLabel>Profile</SidebarGroupLabel>
          <SidebarMenu>
            {profileNavItems.map((item) => (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
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
      <SidebarFooter>
        <div className='rounded-lg bg-accent border-border border-[1px] p-4 group-data-[collapsible=icon]:p-1.5'>
          <div className='space-y-3 group-data-[collapsible=icon]:hidden'>
            <div>
              <div className='flex items-center gap-2'>
                <Sparkles className='h-4 w-4 text-yellow-500' />
                <h4 className='font-medium text-sm'>Upgrade to Pro</h4>
              </div>
              <p className='text-xs text-muted-foreground mt-1'>
                Get unlimited access to all features & unlock full potential.
              </p>
            </div>
            <Button className='w-full bg-yellow-600 hover:bg-yellow-500' size='sm'>
              Upgrade Now
            </Button>
          </div>
          {/* Icon only state */}
          <div className='hidden group-data-[collapsible=icon]:block'>
            <div className='flex flex-col items-center text-center'>
              <Sparkles className='h-5 w-5 text-yellow-500' />
            </div>
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
