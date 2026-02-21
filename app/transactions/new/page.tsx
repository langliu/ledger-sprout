"use client"

import Link from "next/link"
import { useEffect, useMemo, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery } from "convex/react"

import { LedgerShell } from "@/components/ledger-shell"
import type { Id } from "@/convex/_generated/dataModel"
import { DateTimePicker } from "@/components/date-time-picker"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { api } from "@/convex/_generated/api"
import { useCurrentLedger } from "@/hooks/use-current-ledger"

type TransactionType = "expense" | "income" | "transfer"

function toMinorUnits(amountText: string) {
  const normalized = amountText.trim().replace(",", ".")
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return null
  }
  const value = Math.round(Number(normalized) * 100)
  return Number.isFinite(value) && value > 0 ? value : null
}

function nowMinuteTimestamp() {
  const now = new Date()
  now.setSeconds(0, 0)
  return now.getTime()
}

function getTypeLabel(type: TransactionType) {
  if (type === "expense") {
    return "支出"
  }
  if (type === "income") {
    return "收入"
  }
  return "转账"
}

function toDateTimeLabel(timestamp: number) {
  return new Date(timestamp).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function NewTransactionPage() {
  const router = useRouter()
  const { session, isSessionPending, currentLedger, ledgerError } = useCurrentLedger()
  const createExpense = useMutation(api.transactions.createExpense)
  const createIncome = useMutation(api.transactions.createIncome)
  const createTransfer = useMutation(api.transactions.createTransfer)

  const [type, setType] = useState<TransactionType>("expense")
  const [accountId, setAccountId] = useState<Id<"accounts"> | "">("")
  const [toAccountId, setToAccountId] = useState<Id<"accounts"> | "">("")
  const [categoryId, setCategoryId] = useState<Id<"categories"> | "">("")
  const [amount, setAmount] = useState("")
  const [occurredAt, setOccurredAt] = useState(nowMinuteTimestamp)
  const [note, setNote] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const accounts = useQuery(
    api.accounts.list,
    currentLedger ? { ledgerId: currentLedger._id, status: "active" } : "skip",
  )
  const categories = useQuery(
    api.categories.list,
    currentLedger
      ? {
          ledgerId: currentLedger._id,
          type: type === "transfer" ? undefined : type,
          status: "active",
        }
      : "skip",
  )

  useEffect(() => {
    if (!accounts || accounts.length === 0) {
      return
    }
    if (!accountId || !accounts.some((account) => account._id === accountId)) {
      setAccountId(accounts[0]._id)
    }
    if (
      type === "transfer" &&
      (!toAccountId || !accounts.some((account) => account._id === toAccountId))
    ) {
      const fallback = accounts.find((account) => account._id !== accountId) ?? accounts[0]
      setToAccountId(fallback._id)
    }
  }, [accountId, accounts, toAccountId, type])

  useEffect(() => {
    if (type === "transfer") {
      setCategoryId("")
      return
    }
    if (!categories || categories.length === 0) {
      setCategoryId("")
      return
    }
    if (!categories.some((category) => category._id === categoryId)) {
      setCategoryId(categories[0]._id)
    }
  }, [categories, categoryId, type])

  const canSubmit = useMemo(() => {
    if (!currentLedger || !accountId || !amount || occurredAt <= 0) {
      return false
    }
    if (type === "transfer") {
      return Boolean(toAccountId && toAccountId !== accountId)
    }
    return Boolean(categoryId)
  }, [accountId, amount, categoryId, currentLedger, occurredAt, toAccountId, type])
  const sourceAccountName = useMemo(() => {
    return (accounts ?? []).find((account) => account._id === accountId)?.name ?? "-"
  }, [accountId, accounts])
  const targetAccountName = useMemo(() => {
    if (type !== "transfer") {
      return "-"
    }
    return (accounts ?? []).find((account) => account._id === toAccountId)?.name ?? "-"
  }, [accounts, toAccountId, type])
  const categoryName = useMemo(() => {
    if (type === "transfer") {
      return "-"
    }
    return (categories ?? []).find((category) => category._id === categoryId)?.name ?? "-"
  }, [categories, categoryId, type])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(null)

    if (!currentLedger) {
      setErrorMessage("当前账本不可用，请稍后重试。")
      return
    }
    if (!accountId) {
      setErrorMessage("请选择账户。")
      return
    }

    const minorUnits = toMinorUnits(amount)
    if (!minorUnits) {
      setErrorMessage("金额格式不正确，请输入正数，最多两位小数。")
      return
    }

    if (!Number.isFinite(occurredAt) || occurredAt <= 0) {
      setErrorMessage("日期时间格式不正确。")
      return
    }

    if (type === "transfer" && accountId === toAccountId) {
      setErrorMessage("转出账户和转入账户不能相同。")
      return
    }
    if (type === "transfer" && !toAccountId) {
      setErrorMessage("请选择转入账户。")
      return
    }
    if (type !== "transfer" && !categoryId) {
      setErrorMessage("请选择分类。")
      return
    }

    setIsSubmitting(true)
    try {
      const typedCategoryId = categoryId as Id<"categories">
      const payload = {
        ledgerId: currentLedger._id,
        amount: minorUnits,
        occurredAt,
        ...(note.trim() ? { note: note.trim() } : {}),
      }

      if (type === "expense") {
        await createExpense({
          ...payload,
          accountId,
          categoryId: typedCategoryId,
        })
      } else if (type === "income") {
        await createIncome({
          ...payload,
          accountId,
          categoryId: typedCategoryId,
        })
      } else {
        await createTransfer({
          ...payload,
          fromAccountId: accountId,
          toAccountId: toAccountId as Id<"accounts">,
        })
      }

      router.push("/transactions")
      router.refresh()
    } catch (error: unknown) {
      if (error && typeof error === "object" && "message" in error) {
        setErrorMessage(String(error.message))
      } else {
        setErrorMessage("保存失败，请稍后重试。")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSessionPending) {
    return (
      <LedgerShell title="新增记账">
        <div className="px-4 text-sm text-muted-foreground lg:px-6">正在加载会话...</div>
      </LedgerShell>
    )
  }

  if (!session) {
    return (
      <LedgerShell
        title="新增记账"
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
              <CardDescription>登录后才能新增流水记录。</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </LedgerShell>
    )
  }

  if (ledgerError) {
    return (
      <LedgerShell title="新增记账">
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
      title="新增记账"
      headerAction={
        <Button asChild variant="outline" size="sm">
          <Link href="/transactions">返回流水</Link>
        </Button>
      }
    >
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Card>
          <CardHeader>
            <CardTitle>记一笔</CardTitle>
            <CardDescription>金额单位为元，系统会按分存储避免精度误差。</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="type">类型</Label>
                  <Select value={type} onValueChange={(value: TransactionType) => setType(value)}>
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense">支出</SelectItem>
                      <SelectItem value="income">收入</SelectItem>
                      <SelectItem value="transfer">转账</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">金额（元）</Label>
                  <Input
                    id="amount"
                    placeholder="例如 36.50"
                    value={amount}
                    onChange={(event) => {
                      setAmount(event.target.value)
                    }}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="account">账户</Label>
                  <Select
                    value={accountId}
                    onValueChange={(value) => setAccountId(value as Id<"accounts">)}
                  >
                    <SelectTrigger id="account">
                      <SelectValue placeholder="请选择账户" />
                    </SelectTrigger>
                    <SelectContent>
                      {(accounts ?? []).map((account) => (
                        <SelectItem key={account._id} value={account._id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {type === "transfer" ? (
                  <div className="space-y-2">
                    <Label htmlFor="toAccount">转入账户</Label>
                    <Select
                      value={toAccountId}
                      onValueChange={(value) => setToAccountId(value as Id<"accounts">)}
                    >
                      <SelectTrigger id="toAccount">
                        <SelectValue placeholder="请选择转入账户" />
                      </SelectTrigger>
                      <SelectContent>
                        {(accounts ?? [])
                          .filter((account) => account._id !== accountId)
                          .map((account) => (
                            <SelectItem key={account._id} value={account._id}>
                              {account.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="category">分类</Label>
                    <Select
                      value={categoryId}
                      onValueChange={(value) => setCategoryId(value as Id<"categories">)}
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="请选择分类" />
                      </SelectTrigger>
                      <SelectContent>
                        {(categories ?? []).map((category) => (
                          <SelectItem key={category._id} value={category._id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>日期时间</Label>
                  <DateTimePicker value={occurredAt} onChange={setOccurredAt} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="note">备注</Label>
                  <Input
                    id="note"
                    placeholder="可选"
                    value={note}
                    onChange={(event) => {
                      setNote(event.target.value)
                    }}
                  />
                </div>
              </div>

              {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

              <CardFooter className="px-0 pb-0">
                <Button type="submit" disabled={!canSubmit || isSubmitting}>
                  {isSubmitting ? "正在保存..." : "保存流水"}
                </Button>
              </CardFooter>
            </form>
          </CardContent>
        </Card>

        <Card className="h-fit xl:sticky xl:top-24">
          <CardHeader>
            <CardTitle>录入预览</CardTitle>
            <CardDescription>提交前可快速确认关键信息。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">类型</span>
              <span className="font-medium">{getTypeLabel(type)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">金额</span>
              <span className="font-medium">{amount.trim() || "-"}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">时间</span>
              <span className="font-medium">{toDateTimeLabel(occurredAt)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">账户</span>
              <span className="font-medium">{sourceAccountName}</span>
            </div>
            {type === "transfer" ? (
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">转入账户</span>
                <span className="font-medium">{targetAccountName}</span>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">分类</span>
                <span className="font-medium">{categoryName}</span>
              </div>
            )}
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">备注</span>
              <span className="max-w-[65%] truncate font-medium">{note.trim() || "-"}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </LedgerShell>
  )
}
