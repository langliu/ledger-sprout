'use client'

import { type Icon, IconCirclePlusFilled, IconMail } from '@tabler/icons-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { Button } from '@/components/ui/button'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: Icon
  }[]
}) {
  const pathname = usePathname()

  const isActive = (url: string) => {
    if (pathname === url) {
      return true
    }
    if (!pathname.startsWith(`${url}/`)) {
      return false
    }

    const hasMoreSpecificMatch = items.some((item) => {
      return item.url !== url && pathname === item.url
    })
    return !hasMoreSpecificMatch
  }

  return (
    <SidebarGroup>
      <SidebarGroupContent className='flex flex-col gap-2'>
        <SidebarMenu>
          <SidebarMenuItem className='flex items-center gap-2'>
            <SidebarMenuButton
              asChild
              className='bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear'
              tooltip='快速新建'
            >
              <Link href='/transactions/new'>
                <IconCirclePlusFilled />
                <span>快速记账</span>
              </Link>
            </SidebarMenuButton>
            <Button
              asChild
              className='size-8 group-data-[collapsible=icon]:opacity-0'
              size='icon'
              variant='outline'
            >
              <Link href='/transactions'>
                <IconMail />
                <span className='sr-only'>查看流水</span>
              </Link>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                <Link href={item.url}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
