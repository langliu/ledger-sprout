import { IconTrendingDown, IconTrendingUp } from '@tabler/icons-react'

import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function SectionCards() {
  return (
    <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4'>
      <Card className='@container/card'>
        <CardHeader>
          <CardDescription>本月收入</CardDescription>
          <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
            $1,250.00
          </CardTitle>
          <CardContent>
            <Badge variant='outline'>
              <IconTrendingUp />
              +12.5%
            </Badge>
          </CardContent>
        </CardHeader>
        <CardFooter className='flex-col items-start gap-1.5 text-sm'>
          <div className='line-clamp-1 flex gap-2 font-medium'>
            本月持续增长 <IconTrendingUp className='size-4' />
          </div>
          <div className='text-muted-foreground'>近 6 个月访问趋势向好</div>
        </CardFooter>
      </Card>
      <Card className='@container/card'>
        <CardHeader>
          <CardDescription>新增用户</CardDescription>
          <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
            1,234
          </CardTitle>
          <CardContent>
            <Badge variant='outline'>
              <IconTrendingDown />
              -20%
            </Badge>
          </CardContent>
        </CardHeader>
        <CardFooter className='flex-col items-start gap-1.5 text-sm'>
          <div className='line-clamp-1 flex gap-2 font-medium'>
            本周期下降 20% <IconTrendingDown className='size-4' />
          </div>
          <div className='text-muted-foreground'>拉新效率需要重点关注</div>
        </CardFooter>
      </Card>
      <Card className='@container/card'>
        <CardHeader>
          <CardDescription>活跃账户</CardDescription>
          <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
            45,678
          </CardTitle>
          <CardContent>
            <Badge variant='outline'>
              <IconTrendingUp />
              +12.5%
            </Badge>
          </CardContent>
        </CardHeader>
        <CardFooter className='flex-col items-start gap-1.5 text-sm'>
          <div className='line-clamp-1 flex gap-2 font-medium'>
            用户留存表现强劲 <IconTrendingUp className='size-4' />
          </div>
          <div className='text-muted-foreground'>互动指标已超过预期目标</div>
        </CardFooter>
      </Card>
      <Card className='@container/card'>
        <CardHeader>
          <CardDescription>增长率</CardDescription>
          <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
            4.5%
          </CardTitle>
          <CardContent>
            <Badge variant='outline'>
              <IconTrendingUp />
              +4.5%
            </Badge>
          </CardContent>
        </CardHeader>
        <CardFooter className='flex-col items-start gap-1.5 text-sm'>
          <div className='line-clamp-1 flex gap-2 font-medium'>
            整体表现稳步提升 <IconTrendingUp className='size-4' />
          </div>
          <div className='text-muted-foreground'>当前增长符合阶段性预期</div>
        </CardFooter>
      </Card>
    </div>
  )
}
