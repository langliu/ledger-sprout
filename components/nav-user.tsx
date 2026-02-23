'use client'

import {
  IconCreditCard,
  IconDotsVertical,
  IconLogout,
  IconNotification,
  IconUserCircle,
} from '@tabler/icons-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar?: string | null
  }
}) {
  const { isMobile } = useSidebar()
  const avatarSrc =
    typeof user.avatar === 'string' && user.avatar.trim().length > 0
      ? user.avatar.trim()
      : undefined
  const avatarKey = avatarSrc ?? user.email ?? user.name
  const avatarFallback = (user.name || 'U')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
              size='lg'
            >
              <Avatar className='h-8 w-8 rounded-full' key={`trigger-${avatarKey}`}>
                <AvatarImage
                  alt={user.name}
                  key={`trigger-image-${avatarKey}`}
                  referrerPolicy='no-referrer'
                  src={avatarSrc}
                />
                <AvatarFallback className='rounded-full'>{avatarFallback}</AvatarFallback>
              </Avatar>
              <div className='grid flex-1 text-left text-sm leading-tight'>
                <span className='truncate font-medium'>{user.name}</span>
                <span className='text-muted-foreground truncate text-xs'>{user.email}</span>
              </div>
              <IconDotsVertical className='ml-auto size-4' />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align='end'
            className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuLabel className='p-0 font-normal'>
              <div className='flex items-center gap-2 px-1 py-1.5 text-left text-sm'>
                <Avatar className='h-8 w-8 rounded-full' key={`dropdown-${avatarKey}`}>
                  <AvatarImage
                    alt={user.name}
                    key={`dropdown-image-${avatarKey}`}
                    referrerPolicy='no-referrer'
                    src={avatarSrc}
                  />
                  <AvatarFallback className='rounded-full'>{avatarFallback}</AvatarFallback>
                </Avatar>
                <div className='grid flex-1 text-left text-sm leading-tight'>
                  <span className='truncate font-medium'>{user.name}</span>
                  <span className='text-muted-foreground truncate text-xs'>{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <IconUserCircle />
                账号设置
              </DropdownMenuItem>
              <DropdownMenuItem>
                <IconCreditCard />
                账单管理
              </DropdownMenuItem>
              <DropdownMenuItem>
                <IconNotification />
                消息通知
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault()
                window.location.replace('/sign-in?logout=1')
              }}
            >
              <IconLogout />
              退出登录
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
