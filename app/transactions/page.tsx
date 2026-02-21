"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useMutation, useQuery } from "convex/react"

import type { Id } from "@/convex/_generated/dataModel"
import { LedgerShell } from "@/components/ledger-shell"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { api } from "@/convex/_generated/api"
import { useCurrentLedger } from "@/hooks/use-current-ledger"

type TransactionFilter = "all" | "expense" | "income" | "transfer"

function toCurrency(minorUnits: number) {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
  }).format(minorUnits / 100)
}

function toDateLabel(timestamp: number) {
  return new Date(timestamp).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
}

function getTypeLabel(type: "expense" | "income" | "transfer") {
  if (type === "expense") {
    return "支出"
  }
  if (type === "income") {
    return "收入"
  }
  return "转账"
}

export default function TransactionsPage() {
  const { session, isSessionPending, currentLedger, ledgerError } = useCurrentLedger()
  const removeTransaction = useMutation(api.transactions.remove)

  const [type, setType] = useState<TransactionFilter>("all")
  const [search, setSearch] = useState("")
  const [isDeletingId, setIsDeletingId] = useState<Id<"transactions"> | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const accounts = useQuery(
    api.accounts.list,
    currentLedger ? { ledgerId: currentLedger._id } : "skip",
  )
  const categories = useQuery(
    api.categories.list,
    currentLedger ? { ledgerId: currentLedger._id } : "skip",
  )
  const transactions = useQuery(
    api.transactions.list,
    currentLedger
      ? {
          ledgerId: currentLedger._id,
          type: type === "all" ? undefined : type,
          search: search.trim() ? search.trim() : undefined,
          limit: 200,
        }
      : "skip",
  )

  const accountMap = useMemo(() => {
    return new Map((accounts ?? []).map((account) => [account._id, account]))
  }, [accounts])
  const categoryMap = useMemo(() => {
    return new Map((categories ?? []).map((category) => [category._id, category]))
  }, [categories])

  const handleDelete = async (transactionId: Id<"transactions">) => {
    if (!currentLedger || isDeletingId) {
      return
    }

    setErrorMessage(null)
    setIsDeletingId(transactionId)
    try {
      await removeTransaction({
        transactionId,
      })
    } catch (error: unknown) {
      if (error && typeof error === "object" && "message" in error) {
        setErrorMessage(String(error.message))
      } else {
        setErrorMessage("删除失败，请稍后重试。")
      }
    } finally {
      setIsDeletingId(null)
    }
  }

  if (isSessionPending) {
    return (
      <LedgerShell title="流水记录">
        <div className="px-4 text-sm text-muted-foreground lg:px-6">正在加载会话...</div>
      </LedgerShell>
    )
  }

  if (!session) {
    return (
      <LedgerShell
        title="流水记录"
        headerAction={
          <Button asChild size="sm">
            <Link href="/sign-in">去登录</Link>
          </Button>
        }
      >
        <div className="px-4 lg:px-6">
          <Card>
            <CardHeader>
              <CardTitle>请先登录</CardTitle>
              <CardDescription>登录后才能查看流水记录。</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </LedgerShell>
    )
  }

  if (ledgerError) {
    return (
      <LedgerShell title="流水记录">
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
      title="流水记录"
      headerAction={
        <Button asChild size="sm">
          <Link href="/transactions/new">新增记账</Link>
        </Button>
      }
    >
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>流水筛选</CardTitle>
            <CardDescription>支持按类型和备注关键词过滤。</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">类型</p>
                <Select value={type} onValueChange={(value: TransactionFilter) => setType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    <SelectItem value="expense">支出</SelectItem>
                    <SelectItem value="income">收入</SelectItem>
                    <SelectItem value="transfer">转账</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <p className="text-sm text-muted-foreground">关键词（备注）</p>
                <Input
                  placeholder="例如：午饭、地铁、工资"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value)
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>流水列表</CardTitle>
            <CardDescription>{transactions?.length ?? 0} 条记录</CardDescription>
          </CardHeader>
          <CardContent>
            {errorMessage ? <p className="mb-3 text-sm text-destructive">{errorMessage}</p> : null}
            {!transactions || transactions.length === 0 ? (
              <div className="text-sm text-muted-foreground">暂无符合条件的流水。</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>日期</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>账户/分类</TableHead>
                    <TableHead>备注</TableHead>
                    <TableHead className="text-right">金额</TableHead>
                    <TableHead className="w-28 text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => {
                    const sourceAccount =
                      accountMap.get(transaction.accountId)?.name ?? "未知账户"
                    const targetAccount = transaction.transferAccountId
                      ? accountMap.get(transaction.transferAccountId)?.name ?? "未知账户"
                      : null
                    const categoryName = transaction.categoryId
                      ? categoryMap.get(transaction.categoryId)?.name ?? "未分类"
                      : "-"
                    const detail =
                      transaction.type === "transfer"
                        ? `${sourceAccount} -> ${targetAccount ?? "-"}`
                        : `${sourceAccount} / ${categoryName}`
                    const sign = transaction.type === "expense" ? "-" : "+"
                    return (
                      <TableRow key={transaction._id}>
                        <TableCell>{toDateLabel(transaction.occurredAt)}</TableCell>
                        <TableCell>{getTypeLabel(transaction.type)}</TableCell>
                        <TableCell className="max-w-[260px] truncate">{detail}</TableCell>
                        <TableCell className="max-w-[240px] truncate">
                          {transaction.note ?? "-"}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {sign}
                          {toCurrency(transaction.amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isDeletingId === transaction._id}
                            onClick={() => {
                              void handleDelete(transaction._id)
                            }}
                          >
                            {isDeletingId === transaction._id ? "删除中..." : "删除"}
                          </Button>
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
