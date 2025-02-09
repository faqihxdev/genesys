'use client';

import { ChevronsUpDown } from 'lucide-react';

import { Avatar } from '@/components/custom/avatar';
import { UserDropdown } from '@/components/custom/user-dropdown';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { User } from '@/types';

interface NavUserProps {
  user: User;
}

export function NavUser({ user }: NavUserProps) {
  const { isMobile } = useSidebar();
  const displayName = user.email?.split('@')[0] || 'User';

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <UserDropdown user={user} side={isMobile ? 'bottom' : 'right'}>
          <SidebarMenuButton
            size='lg'
            className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
          >
            <Avatar user={user} size='sm' shape='square' />
            <div className='grid flex-1 text-left text-sm leading-tight'>
              <span className='truncate font-semibold'>{displayName}</span>
              <span className='truncate text-xs text-muted-foreground'>{user.email}</span>
            </div>
            <ChevronsUpDown className='ml-auto size-4' />
          </SidebarMenuButton>
        </UserDropdown>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
