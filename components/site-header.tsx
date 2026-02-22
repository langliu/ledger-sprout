import type { ReactNode } from 'react'

import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'

type SiteHeaderProps = Readonly<{
  title?: string
  action?: ReactNode
}>

export function SiteHeader({ title = '仪表盘', action }: SiteHeaderProps) {
  return (
    <header className='shrink-0 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)'>
      <div className='flex min-h-(--header-height) w-full flex-wrap items-center gap-2 px-4 py-2 lg:px-6'>
        <div className='flex min-w-0 items-center gap-1 lg:gap-2'>
          <SidebarTrigger className='-ml-1' />
          <Separator className='mx-2 data-[orientation=vertical]:h-4' orientation='vertical' />
          <h1 className='truncate text-base font-medium'>{title}</h1>
        </div>
        <div className='ml-auto flex w-full items-center justify-end gap-2 sm:w-auto'>{action}</div>
      </div>
    </header>
  )
}
