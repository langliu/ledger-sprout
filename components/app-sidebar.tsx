"use client"

import * as React from "react"
import Link from "next/link"
import {
  IconDashboard,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconPlus,
  IconSearch,
  IconSettings,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { authClient } from "@/lib/auth-client"

const data = {
  user: {
    name: "账芽用户",
    email: "hello@ledger-sprout.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "数据总览",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "流水记录",
      url: "/transactions",
      icon: IconListDetails,
    },
    {
      title: "新增记账",
      url: "/transactions/new",
      icon: IconPlus,
    },
  ],
  navSecondary: [
    {
      title: "系统设置",
      url: "#",
      icon: IconSettings,
    },
    {
      title: "帮助中心",
      url: "#",
      icon: IconHelp,
    },
    {
      title: "搜索",
      url: "#",
      icon: IconSearch,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = authClient.useSession()
  const user = {
    name: session?.user?.name ?? "未登录用户",
    email: session?.user?.email ?? "请先登录",
    avatar: session?.user?.image ?? "",
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/dashboard">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">账芽</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
