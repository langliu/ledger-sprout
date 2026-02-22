'use client'

import { IconArrowDownRight, IconArrowUpRight, IconWallet } from '@tabler/icons-react'
import { useQuery } from 'convex/react'
import Link from 'next/link'
import { useMemo } from 'react'
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'

import { LedgerShell } from '@/components/ledger-shell'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { api } from '@/convex/_generated/api'
import { useAuthRedirect } from '@/hooks/use-auth-redirect'
import { useCurrentLedger } from '@/hooks/use-current-ledger'

const chartConfig = {
  expense: {
    color: 'var(--chart-2)',
    label: '支出',
  },
  income: {
    color: 'var(--chart-1)',
    label: '收入',
  },
} satisfies ChartConfig

function toCurrency(minorUnits: number) {
  return new Intl.NumberFormat('zh-CN', {
    currency: 'CNY',
    style: 'currency',
  }).format(minorUnits / 100)
}

function toDateLabel(timestamp: number) {
  return new Date(timestamp).toLocaleString('zh-CN', {
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function toTrendLabel(bucket: string) {
  return bucket.slice(5).replace('-', '/')
}

function getTypeLabel(type: 'expense' | 'income' | 'transfer') {
  if (type === 'expense') {
    return '支出'
  }
  if (type === 'income') {
    return '收入'
  }
  return '转账'
}

export default function Page() {
  const { session, isSessionPending, currentLedger, ledgerError } = useCurrentLedger()
  const { isRedirecting } = useAuthRedirect({ isSessionPending, session })

  const { year, month, trendStart, trendEnd } = useMemo(() => {
    const now = new Date()
    const end = now.getTime()
    return {
      month: now.getUTCMonth() + 1,
      trendEnd: end,
      trendStart: end - 1000 * 60 * 60 * 24 * 30,
      year: now.getUTCFullYear(),
    }
  }, [])

  const summary = useQuery(
    api.reports.monthlySummary,
    currentLedger ? { ledgerId: currentLedger._id, month, year } : 'skip',
  )
  const trend = useQuery(
    api.reports.trend,
    currentLedger
      ? {
          from: trendStart,
          granularity: 'day',
          ledgerId: currentLedger._id,
          to: trendEnd,
        }
      : 'skip',
  )
  const transactions = useQuery(
    api.transactions.list,
    currentLedger ? { ledgerId: currentLedger._id, limit: 8 } : 'skip',
  )
  const accounts = useQuery(
    api.accounts.list,
    currentLedger ? { ledgerId: currentLedger._id } : 'skip',
  )
  const categories = useQuery(
    api.categories.list,
    currentLedger ? { ledgerId: currentLedger._id } : 'skip',
  )

  const accountMap = useMemo(() => {
    return new Map((accounts ?? []).map((account) => [account._id, account]))
  }, [accounts])
  const categoryMap = useMemo(() => {
    return new Map((categories ?? []).map((category) => [category._id, category]))
  }, [categories])
  const activeAccountCount = (accounts ?? []).filter(
    (account) => account.status === 'active',
  ).length
  const totalBalance = (accounts ?? []).reduce((sum, account) => sum + account.currentBalance, 0)

  const trendData = (trend ?? []).map((item) => ({
    date: item.bucket,
    expense: item.expense / 100,
    income: item.income / 100,
  }))

  if (isSessionPending || isRedirecting) {
    return (
      <LedgerShell title='数据总览'>
        <div className='px-4 text-sm text-muted-foreground lg:px-6'>
          {isSessionPending ? '正在加载会话...' : '正在跳转到登录页...'}
        </div>
      </LedgerShell>
    )
  }

  if (ledgerError) {
    return (
      <LedgerShell title='数据总览'>
        <div className='px-4 lg:px-6'>
          <Card>
            <CardHeader>
              <CardTitle>初始化失败</CardTitle>
              <CardDescription>{ledgerError}</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </LedgerShell>
    )
  }

  if (!currentLedger) {
    return (
      <LedgerShell title='数据总览'>
        <div className='px-4 text-sm text-muted-foreground lg:px-6'>正在初始化默认账本...</div>
      </LedgerShell>
    )
  }

  return (
    <LedgerShell
      headerAction={
        <div className='flex flex-wrap items-center justify-end gap-2'>
          <Button asChild size='sm' variant='outline'>
            <Link href='/transactions'>查看流水</Link>
          </Button>
          <Button asChild size='sm'>
            <Link href='/transactions/new'>记一笔</Link>
          </Button>
        </div>
      }
      title='数据总览'
    >
      <div className='space-y-4 px-4 lg:space-y-6 lg:px-6'>
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
          <Card>
            <CardHeader>
              <CardDescription>本月收入</CardDescription>
              <CardTitle>{toCurrency(summary?.income ?? 0)}</CardTitle>
            </CardHeader>
            <CardFooter className='text-sm text-muted-foreground'>
              <IconArrowUpRight className='size-4 text-green-500' />共{' '}
              {summary?.transactionCount ?? 0} 笔记录
            </CardFooter>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>本月支出</CardDescription>
              <CardTitle>{toCurrency(summary?.expense ?? 0)}</CardTitle>
            </CardHeader>
            <CardFooter className='text-sm text-muted-foreground'>
              <IconArrowDownRight className='size-4 text-red-500' />
              转账金额 {toCurrency(summary?.transfer ?? 0)}
            </CardFooter>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>本月结余</CardDescription>
              <CardTitle>{toCurrency(summary?.net ?? 0)}</CardTitle>
            </CardHeader>
            <CardFooter className='text-sm text-muted-foreground'>
              当前账本：{currentLedger.name}
            </CardFooter>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>账户概览</CardDescription>
              <CardTitle className='flex items-center gap-2'>
                <IconWallet className='size-5' />
                {toCurrency(totalBalance)}
              </CardTitle>
            </CardHeader>
            <CardFooter className='text-sm text-muted-foreground'>
              活跃账户 {activeAccountCount} 个
            </CardFooter>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>近 30 天收支趋势</CardTitle>
            <CardDescription>按天聚合展示收入和支出（单位：元）</CardDescription>
          </CardHeader>
          <CardContent>
            {trendData.length === 0 ? (
              <div className='text-sm text-muted-foreground'>暂无趋势数据，先记一笔吧。</div>
            ) : (
              <ChartContainer className='h-[260px] w-full' config={chartConfig}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id='fillIncome' x1='0' x2='0' y1='0' y2='1'>
                      <stop offset='5%' stopColor='var(--color-income)' stopOpacity={0.35} />
                      <stop offset='95%' stopColor='var(--color-income)' stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id='fillExpense' x1='0' x2='0' y1='0' y2='1'>
                      <stop offset='5%' stopColor='var(--color-expense)' stopOpacity={0.35} />
                      <stop offset='95%' stopColor='var(--color-expense)' stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    axisLine={false}
                    dataKey='date'
                    minTickGap={24}
                    tickFormatter={toTrendLabel}
                    tickLine={false}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, name) => [
                          toCurrency(Number(value) * 100),
                          name === 'income' ? '收入' : '支出',
                        ]}
                        indicator='dot'
                        labelFormatter={(value) => value}
                      />
                    }
                    cursor={false}
                  />
                  <Area
                    dataKey='income'
                    fill='url(#fillIncome)'
                    stroke='var(--color-income)'
                    strokeWidth={2}
                    type='monotone'
                  />
                  <Area
                    dataKey='expense'
                    fill='url(#fillExpense)'
                    stroke='var(--color-expense)'
                    strokeWidth={2}
                    type='monotone'
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>最近流水</CardTitle>
            <CardDescription>展示最近 8 条交易记录</CardDescription>
          </CardHeader>
          <CardContent>
            {!transactions || transactions.length === 0 ? (
              <div className='text-sm text-muted-foreground'>暂无流水记录。</div>
            ) : (
              <Table className='min-w-[640px]'>
                <TableHeader>
                  <TableRow>
                    <TableHead>日期时间</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>分类/账户</TableHead>
                    <TableHead className='text-right'>金额</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((item) => {
                    const sourceAccount = accountMap.get(item.accountId)?.name ?? '未知账户'
                    const targetAccount = item.transferAccountId
                      ? (accountMap.get(item.transferAccountId)?.name ?? '未知账户')
                      : null
                    const category = item.categoryId
                      ? (categoryMap.get(item.categoryId)?.name ?? '未分类')
                      : '-'
                    const sign = item.type === 'expense' ? '-' : '+'
                    const label =
                      item.type === 'transfer'
                        ? `${sourceAccount} -> ${targetAccount ?? '-'}`
                        : `${category} / ${sourceAccount}`
                    return (
                      <TableRow key={item._id}>
                        <TableCell>{toDateLabel(item.occurredAt)}</TableCell>
                        <TableCell>{getTypeLabel(item.type)}</TableCell>
                        <TableCell className='max-w-[280px] truncate'>{label}</TableCell>
                        <TableCell className='text-right font-medium'>
                          {sign}
                          {toCurrency(item.amount)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </LedgerShell>
  )
}
