"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useQuery } from "convex/react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import { LedgerShell } from "@/components/ledger-shell"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { api } from "@/convex/_generated/api"
import { useAuthRedirect } from "@/hooks/use-auth-redirect"
import { useCurrentLedger } from "@/hooks/use-current-ledger"

const chartConfig = {
  income: {
    label: "收入",
    color: "var(--chart-1)",
  },
  expense: {
    label: "支出",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

function defaultMonthValue() {
  const now = new Date()
  const year = now.getUTCFullYear()
  const month = String(now.getUTCMonth() + 1).padStart(2, "0")
  return `${year}-${month}`
}

function parseMonth(monthValue: string) {
  const [yearString, monthString] = monthValue.split("-")
  const year = Number(yearString)
  const month = Number(monthString)
  if (!Number.isInteger(year) || !Number.isInteger(month)) {
    return null
  }
  return { year, month }
}

function toCurrency(minorUnits: number) {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
  }).format(minorUnits / 100)
}

function toPercent(ratio: number) {
  return `${(ratio * 100).toFixed(1)}%`
}

function toDayLabel(bucket: string) {
  const [, month, day] = bucket.split("-")
  return `${month}/${day}`
}

export default function ReportsPage() {
  const { session, isSessionPending, currentLedger, ledgerError } = useCurrentLedger()
  const { isRedirecting } = useAuthRedirect({ session, isSessionPending })
  const [monthValue, setMonthValue] = useState(defaultMonthValue)

  const monthInfo = useMemo(() => parseMonth(monthValue), [monthValue])
  const trendRange = useMemo(() => {
    if (!monthInfo) {
      return null
    }
    const from = Date.UTC(monthInfo.year, monthInfo.month - 1, 1)
    const to = Date.UTC(monthInfo.year, monthInfo.month, 1) - 1
    return { from, to }
  }, [monthInfo])

  const summary = useQuery(
    api.reports.monthlySummary,
    currentLedger && monthInfo
      ? {
          ledgerId: currentLedger._id,
          year: monthInfo.year,
          month: monthInfo.month,
        }
      : "skip",
  )

  const expenseBreakdown = useQuery(
    api.reports.categoryBreakdown,
    currentLedger && monthInfo
      ? {
          ledgerId: currentLedger._id,
          year: monthInfo.year,
          month: monthInfo.month,
          type: "expense",
        }
      : "skip",
  )
  const incomeBreakdown = useQuery(
    api.reports.categoryBreakdown,
    currentLedger && monthInfo
      ? {
          ledgerId: currentLedger._id,
          year: monthInfo.year,
          month: monthInfo.month,
          type: "income",
        }
      : "skip",
  )
  const trend = useQuery(
    api.reports.trend,
    currentLedger && trendRange
      ? {
          ledgerId: currentLedger._id,
          from: trendRange.from,
          to: trendRange.to,
          granularity: "day",
        }
      : "skip",
  )

  const trendData = (trend ?? []).map((item) => ({
    bucket: item.bucket,
    income: item.income / 100,
    expense: item.expense / 100,
  }))

  if (isSessionPending || isRedirecting) {
    return (
      <LedgerShell title="报表分析">
        <div className="px-4 text-sm text-muted-foreground lg:px-6">
          {isSessionPending ? "正在加载会话..." : "正在跳转到登录页..."}
        </div>
      </LedgerShell>
    )
  }

  if (ledgerError) {
    return (
      <LedgerShell title="报表分析">
        <div className="px-4 lg:px-6">
          <Card>
            <CardHeader>
              <CardTitle>账本初始化失败</CardTitle>
              <CardDescription>{ledgerError}</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </LedgerShell>
    )
  }

  return (
    <LedgerShell
      title="报表分析"
      headerAction={
        <Button asChild size="sm">
          <Link href="/transactions/new">记一笔</Link>
        </Button>
      }
    >
      <div className="space-y-4 px-4 lg:space-y-6 lg:px-6">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,3fr)]">
          <Card>
            <CardHeader>
              <CardTitle>报表月份</CardTitle>
              <CardDescription>选择月份查看该月收入、支出与分类占比。</CardDescription>
            </CardHeader>
            <CardContent className="max-w-xs space-y-2">
              <Input
                type="month"
                value={monthValue}
                onChange={(event) => {
                  setMonthValue(event.target.value)
                }}
              />
              {!monthInfo ? (
                <p className="text-xs text-destructive">月份格式无效，请重新选择。</p>
              ) : null}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader>
                <CardDescription>本月收入</CardDescription>
                <CardTitle>{toCurrency(summary?.income ?? 0)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>本月支出</CardDescription>
                <CardTitle>{toCurrency(summary?.expense ?? 0)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>本月结余</CardDescription>
                <CardTitle>{toCurrency(summary?.net ?? 0)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>交易笔数</CardDescription>
                <CardTitle>{summary?.transactionCount ?? 0}</CardTitle>
              </CardHeader>
            </Card>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>每日收支趋势（元）</CardTitle>
            <CardDescription>按天聚合，便于观察月内波动。</CardDescription>
          </CardHeader>
          <CardContent>
            {trendData.length === 0 ? (
              <div className="text-sm text-muted-foreground">暂无趋势数据。</div>
            ) : (
              <ChartContainer config={chartConfig} className="h-[280px] w-full">
                <BarChart data={trendData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="bucket" tickFormatter={toDayLabel} tickLine={false} axisLine={false} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        indicator="dot"
                        labelFormatter={(value) => value}
                        formatter={(value, name) => [
                          toCurrency(Number(value) * 100),
                          name === "income" ? "收入" : "支出",
                        ]}
                      />
                    }
                  />
                  <Bar dataKey="income" fill="var(--color-income)" radius={4} />
                  <Bar dataKey="expense" fill="var(--color-expense)" radius={4} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>支出分类占比</CardTitle>
              <CardDescription>按金额排序</CardDescription>
            </CardHeader>
            <CardContent>
              {!expenseBreakdown || expenseBreakdown.length === 0 ? (
                <div className="text-sm text-muted-foreground">暂无支出数据。</div>
              ) : (
                <Table className="min-w-[520px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>分类</TableHead>
                      <TableHead className="text-right">金额</TableHead>
                      <TableHead className="text-right">占比</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenseBreakdown.map((item) => (
                      <TableRow key={item.categoryId}>
                        <TableCell>{item.categoryName}</TableCell>
                        <TableCell className="text-right">{toCurrency(item.amount)}</TableCell>
                        <TableCell className="text-right">{toPercent(item.ratio)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>收入分类占比</CardTitle>
              <CardDescription>按金额排序</CardDescription>
            </CardHeader>
            <CardContent>
              {!incomeBreakdown || incomeBreakdown.length === 0 ? (
                <div className="text-sm text-muted-foreground">暂无收入数据。</div>
              ) : (
                <Table className="min-w-[520px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>分类</TableHead>
                      <TableHead className="text-right">金额</TableHead>
                      <TableHead className="text-right">占比</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incomeBreakdown.map((item) => (
                      <TableRow key={item.categoryId}>
                        <TableCell>{item.categoryName}</TableCell>
                        <TableCell className="text-right">{toCurrency(item.amount)}</TableCell>
                        <TableCell className="text-right">{toPercent(item.ratio)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </LedgerShell>
  )
}
