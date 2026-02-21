"use client"

import Link from "next/link"
import { useEffect, useMemo, useState, type FormEvent } from "react"
import { useMutation, useQuery } from "convex/react"

import type { Doc, Id } from "@/convex/_generated/dataModel"
import { api } from "@/convex/_generated/api"
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
import { Label } from "@/components/ui/label"
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
import { useCurrentLedger } from "@/hooks/use-current-ledger"

type AccountType = "cash" | "bank" | "credit" | "wallet"

const ACCOUNT_TYPE_OPTIONS: Array<{ value: AccountType; label: string }> = [
  { value: "cash", label: "现金" },
  { value: "bank", label: "银行卡" },
  { value: "credit", label: "信用卡" },
  { value: "wallet", label: "电子钱包" },
]

function toMinorUnits(amountText: string) {
  const normalized = amountText.trim().replace(",", ".")
  if (!/^-?\d+(\.\d{1,2})?$/.test(normalized)) {
    return null
  }
  return Math.round(Number(normalized) * 100)
}

function toCurrency(minorUnits: number) {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
  }).format(minorUnits / 100)
}

function getTypeLabel(type: AccountType) {
  return ACCOUNT_TYPE_OPTIONS.find((item) => item.value === type)?.label ?? type
}

export default function AccountsPage() {
  const { session, isSessionPending, currentLedger, ledgerError } = useCurrentLedger()
  const createAccount = useMutation(api.accounts.create)
  const updateAccount = useMutation(api.accounts.update)
  const adjustBalance = useMutation(api.accounts.adjustBalance)

  const accounts = useQuery(
    api.accounts.list,
    currentLedger ? { ledgerId: currentLedger._id } : "skip",
  )

  const [name, setName] = useState("")
  const [type, setType] = useState<AccountType>("cash")
  const [initialBalance, setInitialBalance] = useState("0")
  const [isCreating, setIsCreating] = useState(false)

  const [editingId, setEditingId] = useState<Id<"accounts"> | null>(null)
  const [editingName, setEditingName] = useState("")
  const [editingType, setEditingType] = useState<AccountType>("cash")
  const [editingStatus, setEditingStatus] = useState<"active" | "inactive">("active")
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  const [adjustAccountId, setAdjustAccountId] = useState<Id<"accounts"> | "">("")
  const [adjustDelta, setAdjustDelta] = useState("")
  const [adjustReason, setAdjustReason] = useState("")
  const [isAdjusting, setIsAdjusting] = useState(false)

  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const activeCount = useMemo(() => {
    return (accounts ?? []).filter((account) => account.status === "active").length
  }, [accounts])
  const totalBalance = useMemo(() => {
    return (accounts ?? []).reduce((sum, account) => sum + account.currentBalance, 0)
  }, [accounts])

  useEffect(() => {
    if (!accounts || accounts.length === 0) {
      return
    }
    if (!adjustAccountId || !accounts.some((account) => account._id === adjustAccountId)) {
      setAdjustAccountId(accounts[0]._id)
    }
  }, [accounts, adjustAccountId])

  const startEdit = (account: Doc<"accounts">) => {
    setEditingId(account._id)
    setEditingName(account.name)
    setEditingType(account.type)
    setEditingStatus(account.status)
    setErrorMessage(null)
  }

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(null)
    if (!currentLedger) {
      setErrorMessage("当前账本不可用，请稍后重试。")
      return
    }

    const minorUnits = toMinorUnits(initialBalance)
    if (minorUnits === null) {
      setErrorMessage("初始余额格式不正确。")
      return
    }
    if (name.trim().length === 0) {
      setErrorMessage("账户名称不能为空。")
      return
    }

    setIsCreating(true)
    try {
      await createAccount({
        ledgerId: currentLedger._id,
        name: name.trim(),
        type,
        initialBalance: minorUnits,
      })
      setName("")
      setType("cash")
      setInitialBalance("0")
    } catch (error: unknown) {
      if (error && typeof error === "object" && "message" in error) {
        setErrorMessage(String(error.message))
      } else {
        setErrorMessage("创建账户失败，请稍后重试。")
      }
    } finally {
      setIsCreating(false)
    }
  }

  const handleSaveEdit = async () => {
    if (!editingId) {
      return
    }
    if (editingName.trim().length === 0) {
      setErrorMessage("账户名称不能为空。")
      return
    }

    setErrorMessage(null)
    setIsSavingEdit(true)
    try {
      await updateAccount({
        accountId: editingId,
        name: editingName.trim(),
        type: editingType,
        status: editingStatus,
      })
      setEditingId(null)
    } catch (error: unknown) {
      if (error && typeof error === "object" && "message" in error) {
        setErrorMessage(String(error.message))
      } else {
        setErrorMessage("保存账户失败，请稍后重试。")
      }
    } finally {
      setIsSavingEdit(false)
    }
  }

  const handleAdjustBalance = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(null)

    if (!adjustAccountId) {
      setErrorMessage("请选择账户。")
      return
    }
    const delta = toMinorUnits(adjustDelta)
    if (delta === null || delta === 0) {
      setErrorMessage("调整金额格式不正确，且不能为 0。")
      return
    }

    setIsAdjusting(true)
    try {
      await adjustBalance({
        accountId: adjustAccountId,
        delta,
        ...(adjustReason.trim().length > 0 ? { reason: adjustReason.trim() } : {}),
      })
      setAdjustDelta("")
      setAdjustReason("")
    } catch (error: unknown) {
      if (error && typeof error === "object" && "message" in error) {
        setErrorMessage(String(error.message))
      } else {
        setErrorMessage("余额调整失败，请稍后重试。")
      }
    } finally {
      setIsAdjusting(false)
    }
  }

  const handleToggleStatus = async (account: Doc<"accounts">) => {
    setErrorMessage(null)
    try {
      await updateAccount({
        accountId: account._id,
        status: account.status === "active" ? "inactive" : "active",
      })
    } catch (error: unknown) {
      if (error && typeof error === "object" && "message" in error) {
        setErrorMessage(String(error.message))
      } else {
        setErrorMessage("更新状态失败，请稍后重试。")
      }
    }
  }

  if (isSessionPending) {
    return (
      <LedgerShell title="账户管理">
        <div className="px-4 text-sm text-muted-foreground lg:px-6">正在加载会话...</div>
      </LedgerShell>
    )
  }

  if (!session) {
    return (
      <LedgerShell
        title="账户管理"
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
              <CardDescription>登录后才能管理账户。</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </LedgerShell>
    )
  }

  if (ledgerError) {
    return (
      <LedgerShell title="账户管理">
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
      title="账户管理"
      headerAction={
        <Button asChild size="sm">
          <Link href="/transactions/new">记一笔</Link>
        </Button>
      }
    >
      <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-3 lg:px-6">
        <Card>
          <CardHeader>
            <CardDescription>账户总数</CardDescription>
            <CardTitle>{accounts?.length ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>活跃账户</CardDescription>
            <CardTitle>{activeCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>当前总余额</CardDescription>
            <CardTitle>{toCurrency(totalBalance)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-3 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>新增账户</CardTitle>
            <CardDescription>初始余额可为负数（如信用卡欠款）。</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleCreate}>
              <div className="space-y-2">
                <Label htmlFor="name">名称</Label>
                <Input
                  id="name"
                  placeholder="例如：招商银行卡"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value)
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">类型</Label>
                <Select value={type} onValueChange={(value) => setType(value as AccountType)}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_TYPE_OPTIONS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="initialBalance">初始余额（元）</Label>
                <Input
                  id="initialBalance"
                  value={initialBalance}
                  onChange={(event) => {
                    setInitialBalance(event.target.value)
                  }}
                />
              </div>
              {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
              <Button type="submit" disabled={isCreating}>
                {isCreating ? "创建中..." : "创建账户"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>编辑账户</CardTitle>
            <CardDescription>选择下方账户后可编辑名称、类型和状态。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {editingId ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="editingName">名称</Label>
                  <Input
                    id="editingName"
                    value={editingName}
                    onChange={(event) => {
                      setEditingName(event.target.value)
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editingType">类型</Label>
                  <Select
                    value={editingType}
                    onValueChange={(value) => setEditingType(value as AccountType)}
                  >
                    <SelectTrigger id="editingType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACCOUNT_TYPE_OPTIONS.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editingStatus">状态</Label>
                  <Select
                    value={editingStatus}
                    onValueChange={(value) => setEditingStatus(value as "active" | "inactive")}
                  >
                    <SelectTrigger id="editingStatus">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">启用</SelectItem>
                      <SelectItem value="inactive">停用</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" disabled={isSavingEdit} onClick={() => void handleSaveEdit()}>
                    {isSavingEdit ? "保存中..." : "保存修改"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingId(null)
                    }}
                  >
                    取消
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">请选择一个账户进入编辑模式。</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>余额调整</CardTitle>
            <CardDescription>输入正数为增加，负数为减少，例如 `-100.00`。</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleAdjustBalance}>
              <div className="space-y-2">
                <Label htmlFor="adjustAccount">账户</Label>
                <Select
                  value={adjustAccountId || undefined}
                  onValueChange={(value) => setAdjustAccountId(value as Id<"accounts">)}
                >
                  <SelectTrigger id="adjustAccount">
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
              <div className="space-y-2">
                <Label htmlFor="adjustDelta">调整金额（元）</Label>
                <Input
                  id="adjustDelta"
                  placeholder="例如：100.00 或 -35.50"
                  value={adjustDelta}
                  onChange={(event) => {
                    setAdjustDelta(event.target.value)
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adjustReason">原因（可选）</Label>
                <Input
                  id="adjustReason"
                  placeholder="例如：月初对账"
                  value={adjustReason}
                  onChange={(event) => {
                    setAdjustReason(event.target.value)
                  }}
                />
              </div>
              <Button type="submit" disabled={isAdjusting}>
                {isAdjusting ? "调整中..." : "确认调整"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>账户列表</CardTitle>
            <CardDescription>可直接启停账户，编辑请点击“编辑”。</CardDescription>
          </CardHeader>
          <CardContent>
            {!accounts || accounts.length === 0 ? (
              <div className="text-sm text-muted-foreground">暂无账户，请先创建一个账户。</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>名称</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="text-right">当前余额</TableHead>
                    <TableHead className="w-48 text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((account) => (
                    <TableRow key={account._id}>
                      <TableCell>{account.name}</TableCell>
                      <TableCell>{getTypeLabel(account.type)}</TableCell>
                      <TableCell>{account.status === "active" ? "启用" : "停用"}</TableCell>
                      <TableCell className="text-right">{toCurrency(account.currentBalance)}</TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex gap-2">
                          <Button type="button" size="sm" variant="outline" onClick={() => startEdit(account)}>
                            编辑
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              void handleToggleStatus(account)
                            }}
                          >
                            {account.status === "active" ? "停用" : "启用"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </LedgerShell>
  )
}
