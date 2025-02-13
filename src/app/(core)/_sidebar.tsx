'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { queryKey } from '@/lib/query-keys';
import { cn, withQuery } from '@/lib/utils';
import { getCurrentUserProjects, getProjectById } from '@/server/projects';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRightCircle,
  BarChart,
  Bell,
  ChevronsUpDown,
  CircleDollarSign,
  Filter,
  FolderGit2,
  LayoutDashboard,
  LifeBuoy,
  MessageSquare,
  Settings,
  Settings2,
  Sparkles,
  User2,
  Users,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const getProjectNavItems = (projectId: string) => [
  {
    title: 'Overview',
    url: `/project/${projectId}`,
    icon: LayoutDashboard,
  },
  {
    title: 'Persona',
    url: `/project/${projectId}/persona`,
    icon: Users,
  },
  {
    title: 'Funnels',
    url: `/project/${projectId}/funnels`,
    icon: Filter,
  },
  {
    title: 'Single Step',
    url: `/project/${projectId}/single-step`,
    icon: ArrowRightCircle,
  },
  {
    title: 'Analytics',
    url: `/project/${projectId}/analytics`,
    icon: BarChart,
  },
  {
    title: 'Settings',
    url: `/project/${projectId}/settings`,
    icon: Settings,
  },
];

const platformNavItems = [
  {
    title: 'All Projects',
    url: '/project/all',
    icon: FolderGit2,
  },
  {
    title: 'Settings',
    url: '/project/all/settings',
    icon: Settings2,
  },
];

const profileNavItems = [
  {
    title: 'Account',
    url: '/account',
    icon: User2,
  },
  {
    title: 'Notifications',
    url: '/account/notifications',
    icon: Bell,
  },
  {
    title: 'Billing',
    url: '/account/billing',
    icon: CircleDollarSign,
  },
  {
    title: 'Support',
    url: '/account/support',
    icon: LifeBuoy,
  },
  {
    title: 'Feedback',
    url: '/account/feedback',
    icon: MessageSquare,
  },
];

/**
 * Sidebar component for the dashboard
 * Handles project navigation and selection
 */
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  // Set current project ID from URL when component mounts or URL changes
  useEffect(() => {
    const matches = pathname.match(/^\/project\/([^/]+)/);
    const projectId = matches?.[1];
    if (projectId && projectId !== 'all') {
      setCurrentProjectId(projectId);
    } else {
      setCurrentProjectId(null);
    }
  }, [pathname]);

  // Get current project data
  const { data: currentProject } = useQuery({
    queryKey: queryKey.projects.getProjectById({ projectId: currentProjectId || '' }),
    queryFn: () => withQuery(getProjectById)({ projectId: currentProjectId || '' }),
    enabled: !!currentProjectId,
  });

  // Get all projects
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: queryKey.projects.getCurrentUserProjects(),
    queryFn: withQuery(getCurrentUserProjects),
    enabled: !!user?.id,
  });

  const defaultProject = projects.find((p) => p.isDefault);

  /**
   * Checks if a given path is active based on the current pathname
   * @param itemUrl - The URL to check
   * @param pathname - The current pathname
   * @returns boolean indicating if the path is active
   */
  const isPathActive = (itemUrl: string, pathname: string): boolean => {
    // For account routes
    if (itemUrl.startsWith('/account')) {
      // Exact match for root account page
      if (itemUrl === '/account') {
        return pathname === '/account';
      }
      // For account sub-pages, check if we're in the correct section
      return pathname.startsWith(itemUrl);
    }

    // For platform routes
    if (itemUrl === '/project/all') {
      // Active for all-projects page and its children except settings
      return (
        pathname === '/project/all' ||
        (pathname.startsWith('/project/all/') && pathname !== '/project/all/settings')
      );
    }
    if (itemUrl === '/project/all/settings') {
      // Exact match for settings page
      return pathname === '/project/all/settings';
    }

    // For specific project routes
    if (itemUrl.startsWith('/project/')) {
      const projectIdMatch = pathname.match(/^\/project\/([^/]+)/);
      const projectId = projectIdMatch?.[1];

      // Not active if we're in the all-projects section
      if (projectId === 'all') return false;

      // Extract the project ID from the itemUrl
      const itemProjectIdMatch = itemUrl.match(/^\/project\/([^/]+)/);
      const itemProjectId = itemProjectIdMatch?.[1];

      // If project IDs don't match, return false
      if (projectId !== itemProjectId) return false;

      // For project overview (root project page)
      if (itemUrl === `/project/${projectId}`) {
        return pathname === itemUrl;
      }

      // For other project pages (settings, persona, etc.)
      const itemPath = itemUrl.replace(`/project/${projectId}`, '');
      const currentPath = pathname.replace(`/project/${projectId}`, '');

      return itemPath === currentPath;
    }

    // For other routes (exact match)
    return pathname === itemUrl;
  };

  // Get navigation items for current project or default project
  const projectNavItems = currentProject
    ? getProjectNavItems(currentProject.id)
    : defaultProject
      ? getProjectNavItems(defaultProject.id)
      : [];

  return (
    <Sidebar collapsible='icon' {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            {isLoadingProjects ? (
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
                  <Skeleton className='h-4 w-24' />
                </div>
                <ChevronsUpDown className='ml-auto size-4' />
              </SidebarMenuButton>
            ) : (
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
                      <span className='truncate text-xs'>
                        {currentProject?.name ?? defaultProject?.name ?? 'No Projects'}
                      </span>
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
                  {projects.map((project) => (
                    <DropdownMenuItem
                      key={project.id}
                      onClick={() => {
                        setCurrentProjectId(project.id);
                        router.push(`/project/${project.id}`);
                      }}
                      className='gap-2 p-2'
                    >
                      <div className='flex size-6 items-center justify-center rounded-sm border'>
                        <FolderGit2 className='size-4 shrink-0' />
                      </div>
                      <div className='grid flex-1 text-sm leading-none'>
                        <span>{project.name}</span>
                        {project.isDefault && (
                          <span className='text-xs text-muted-foreground'>Default Project</span>
                        )}
                      </div>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      router.push('/project/all');
                    }}
                    className='gap-2 p-2'
                  >
                    <div className='flex size-6 items-center justify-center rounded-sm border'>
                      <Settings2 className='size-4 shrink-0' />
                    </div>
                    Manage Projects
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className='custom-scrollbar'>
        {/* Platform */}
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarMenu>
            {platformNavItems.map((item) => (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  className={cn(
                    'relative hover:bg-accent/50',
                    isPathActive(item.url, pathname)
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground transition-colors duration-200'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Link href={item.url} className='flex items-center gap-2'>
                    <item.icon
                      className={cn(
                        'h-4 w-4',
                        isPathActive(item.url, pathname)
                          ? 'text-primary scale-110 transition-all duration-200'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {/* Project - Only show when loading or has projects */}
        {(isLoadingProjects || currentProject || defaultProject) && (
          <SidebarGroup>
            <SidebarGroupLabel>
              {isLoadingProjects ? (
                <Skeleton className='h-4 w-24 inline-block align-middle ml-2' />
              ) : currentProject?.name ? (
                `${currentProject.name} Project`
              ) : defaultProject?.name ? (
                `${defaultProject.name} Project`
              ) : (
                ''
              )}
            </SidebarGroupLabel>
            <SidebarMenu>
              {isLoadingProjects
                ? // Loading state for project items
                  Array.from({ length: 5 }).map((_, i) => (
                    <SidebarMenuItem key={i}>
                      <SidebarMenuButton className='relative hover:bg-accent/50'>
                        <div className='flex items-center gap-2'>
                          <Skeleton className='h-4 w-4' />
                          <Skeleton className='h-4 w-24' />
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))
                : // Loaded state for project items
                  projectNavItems.map((item) => (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        asChild
                        tooltip={item.title}
                        className={cn(
                          'relative hover:bg-accent/50',
                          isPathActive(item.url, pathname)
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground transition-colors duration-200'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        <Link href={item.url} className='flex items-center gap-2'>
                          <item.icon
                            className={cn(
                              'h-4 w-4',
                              isPathActive(item.url, pathname)
                                ? 'text-primary scale-110 transition-all duration-200'
                                : 'text-muted-foreground hover:text-foreground'
                            )}
                          />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
            </SidebarMenu>
          </SidebarGroup>
        )}

        {/* Profile */}
        <SidebarGroup>
          <SidebarGroupLabel>Profile</SidebarGroupLabel>
          <SidebarMenu>
            {profileNavItems.map((item) => (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  className={cn(
                    'relative hover:bg-accent/50',
                    isPathActive(item.url, pathname)
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground transition-colors duration-200'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Link href={item.url} className='flex items-center gap-2'>
                    <item.icon
                      className={cn(
                        'h-4 w-4',
                        isPathActive(item.url, pathname)
                          ? 'text-primary scale-110 transition-all duration-200'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    />
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
