'use client'

import {
  IconChartBar,
  IconDashboard,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconReceipt2,
  IconSearch,
  IconSettings,
  IconTags,
  IconWallet,
} from '@tabler/icons-react'
import Link from 'next/link'
import type * as React from 'react'

import { NavMain } from '@/components/nav-main'
import { NavSecondary } from '@/components/nav-secondary'
import { NavUser } from '@/components/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { authClient } from '@/lib/auth-client'

const data = {
  navMain: [
    {
      icon: IconDashboard,
      title: '数据总览',
      url: '/dashboard',
    },
    {
      icon: IconListDetails,
      title: '流水记录',
      url: '/transactions',
    },
    {
      icon: IconWallet,
      title: '账户管理',
      url: '/accounts',
    },
    {
      icon: IconTags,
      title: '分类管理',
      url: '/categories',
    },
    {
      icon: IconChartBar,
      title: '报表分析',
      url: '/reports',
    },
    {
      icon: IconReceipt2,
      title: '新增记账',
      url: '/transactions/new',
    },
  ],
  navSecondary: [
    {
      icon: IconSettings,
      title: '系统设置',
      url: '#',
    },
    {
      icon: IconHelp,
      title: '帮助中心',
      url: '#',
    },
    {
      icon: IconSearch,
      title: '搜索',
      url: '#',
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = authClient.useSession()
  const avatar =
    typeof session?.user?.image === 'string' && session.user.image.trim().length > 0
      ? session.user.image.trim()
      : undefined
  const user = {
    avatar,
    email: session?.user?.email ?? '请先登录',
    name: session?.user?.name ?? '未登录用户',
  }

  return (
    <Sidebar collapsible='offcanvas' {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className='data-[slot=sidebar-menu-button]:!p-1.5'>
              <Link href='/dashboard'>
                <IconInnerShadowTop className='!size-5' />
                <span className='text-base font-semibold'>账芽</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary className='mt-auto' items={data.navSecondary} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
