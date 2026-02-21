"use client"

import Link from "next/link"
import { useMemo, useState, type FormEvent } from "react"
import { useMutation, useQuery } from "convex/react"

import type { Doc, Id } from "@/convex/_generated/dataModel"
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
import { api } from "@/convex/_generated/api"
import { useCurrentLedger } from "@/hooks/use-current-ledger"

type CategoryType = "expense" | "income"
type CategoryStatus = "active" | "inactive"

function getTypeLabel(type: CategoryType) {
  return type === "expense" ? "支出" : "收入"
}

export default function CategoriesPage() {
  const { session, isSessionPending, currentLedger, ledgerError } = useCurrentLedger()
  const createCategory = useMutation(api.categories.create)
  const updateCategory = useMutation(api.categories.update)

  const categories = useQuery(
    api.categories.list,
    currentLedger ? { ledgerId: currentLedger._id } : "skip",
  )

  const [name, setName] = useState("")
  const [type, setType] = useState<CategoryType>("expense")
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<Id<"categories"> | null>(null)
  const [editingName, setEditingName] = useState("")
  const [editingStatus, setEditingStatus] = useState<CategoryStatus>("active")
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [filterType, setFilterType] = useState<"all" | CategoryType>("all")
  const [filterStatus, setFilterStatus] = useState<"all" | CategoryStatus>("all")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const filteredCategories = useMemo(() => {
    const docs = categories ?? []
    return docs.filter((category) => {
      const passType = filterType === "all" || category.type === filterType
      const passStatus = filterStatus === "all" || category.status === filterStatus
      return passType && passStatus
    })
  }, [categories, filterStatus, filterType])

  const startEdit = (category: Doc<"categories">) => {
    setEditingId(category._id)
    setEditingName(category.name)
    setEditingStatus(category.status)
    setErrorMessage(null)
  }

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(null)
    if (!currentLedger) {
      setErrorMessage("当前账本不可用，请稍后重试。")
      return
    }
    if (name.trim().length === 0) {
      setErrorMessage("分类名称不能为空。")
      return
    }

    setIsCreating(true)
    try {
      await createCategory({
        ledgerId: currentLedger._id,
        name: name.trim(),
        type,
      })
      setName("")
    } catch (error: unknown) {
      if (error && typeof error === "object" && "message" in error) {
        setErrorMessage(String(error.message))
      } else {
        setErrorMessage("创建分类失败，请稍后重试。")
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
      setErrorMessage("分类名称不能为空。")
      return
    }

    setErrorMessage(null)
    setIsSavingEdit(true)
    try {
      await updateCategory({
        categoryId: editingId,
        name: editingName.trim(),
        status: editingStatus,
      })
      setEditingId(null)
    } catch (error: unknown) {
      if (error && typeof error === "object" && "message" in error) {
        setErrorMessage(String(error.message))
      } else {
        setErrorMessage("保存分类失败，请稍后重试。")
      }
    } finally {
      setIsSavingEdit(false)
    }
  }

  const handleToggleStatus = async (category: Doc<"categories">) => {
    setErrorMessage(null)
    try {
      await updateCategory({
        categoryId: category._id,
        status: category.status === "active" ? "inactive" : "active",
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
      <LedgerShell title="分类管理">
        <div className="px-4 text-sm text-muted-foreground lg:px-6">正在加载会话...</div>
      </LedgerShell>
    )
  }

  if (!session) {
    return (
      <LedgerShell
        title="分类管理"
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
              <CardDescription>登录后才能管理分类。</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </LedgerShell>
    )
  }

  if (ledgerError) {
    return (
      <LedgerShell title="分类管理">
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
      title="分类管理"
      headerAction={
        <Button asChild size="sm">
          <Link href="/transactions/new">去记账</Link>
        </Button>
      }
    >
      <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-2 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>新增分类</CardTitle>
            <CardDescription>创建后可用于新增收入或支出流水。</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleCreate}>
              <div className="space-y-2">
                <Label htmlFor="categoryName">分类名称</Label>
                <Input
                  id="categoryName"
                  placeholder="例如：外卖"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value)
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoryType">分类类型</Label>
                <Select value={type} onValueChange={(value) => setType(value as CategoryType)}>
                  <SelectTrigger id="categoryType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">支出</SelectItem>
                    <SelectItem value="income">收入</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
              <Button type="submit" disabled={isCreating}>
                {isCreating ? "创建中..." : "创建分类"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>编辑分类</CardTitle>
            <CardDescription>可修改名称和启停状态。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {editingId ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="editingCategoryName">名称</Label>
                  <Input
                    id="editingCategoryName"
                    value={editingName}
                    onChange={(event) => {
                      setEditingName(event.target.value)
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editingCategoryStatus">状态</Label>
                  <Select
                    value={editingStatus}
                    onValueChange={(value) => setEditingStatus(value as CategoryStatus)}
                  >
                    <SelectTrigger id="editingCategoryStatus">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">启用</SelectItem>
                      <SelectItem value="inactive">停用</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" onClick={() => void handleSaveEdit()} disabled={isSavingEdit}>
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
              <p className="text-sm text-muted-foreground">请选择下方分类进入编辑模式。</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>分类列表</CardTitle>
            <CardDescription>可按类型与状态过滤。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">类型过滤</p>
                <Select value={filterType} onValueChange={(value) => setFilterType(value as "all" | CategoryType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    <SelectItem value="expense">支出</SelectItem>
                    <SelectItem value="income">收入</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">状态过滤</p>
                <Select
                  value={filterStatus}
                  onValueChange={(value) => setFilterStatus(value as "all" | CategoryStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    <SelectItem value="active">启用</SelectItem>
                    <SelectItem value="inactive">停用</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {filteredCategories.length === 0 ? (
              <div className="text-sm text-muted-foreground">暂无符合条件的分类。</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>名称</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="w-52 text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories.map((category) => (
                    <TableRow key={category._id}>
                      <TableCell>{category.name}</TableCell>
                      <TableCell>{getTypeLabel(category.type)}</TableCell>
                      <TableCell>{category.status === "active" ? "启用" : "停用"}</TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex gap-2">
                          <Button type="button" size="sm" variant="outline" onClick={() => startEdit(category)}>
                            编辑
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              void handleToggleStatus(category)
                            }}
                          >
                            {category.status === "active" ? "停用" : "启用"}
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
