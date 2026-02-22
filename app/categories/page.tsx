"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
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
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
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
import { useAuthRedirect } from "@/hooks/use-auth-redirect"
import { useCurrentLedger } from "@/hooks/use-current-ledger"

type CategoryType = "expense" | "income"
type CategoryStatus = "active" | "inactive"
type CategoryDrawerMode = "create" | "edit" | null

function getTypeLabel(type: CategoryType) {
  return type === "expense" ? "支出" : "收入"
}

export default function CategoriesPage() {
  const { session, isSessionPending, currentLedger, ledgerError } = useCurrentLedger()
  const { isRedirecting } = useAuthRedirect({ session, isSessionPending })
  const createCategory = useMutation(api.categories.create)
  const updateCategory = useMutation(api.categories.update)

  const categories = useQuery(
    api.categories.list,
    currentLedger ? { ledgerId: currentLedger._id } : "skip",
  )

  const [drawerMode, setDrawerMode] = useState<CategoryDrawerMode>(null)
  const [drawerError, setDrawerError] = useState<string | null>(null)

  const [createName, setCreateName] = useState("")
  const [createType, setCreateType] = useState<CategoryType>("expense")
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

  const totalCategories = categories?.length ?? 0
  const activeCategories = useMemo(() => {
    return (categories ?? []).filter((category) => category.status === "active").length
  }, [categories])
  const inactiveCategories = totalCategories - activeCategories
  const activeFilterCount = useMemo(() => {
    return [filterType !== "all", filterStatus !== "all"].filter(Boolean).length
  }, [filterStatus, filterType])

  const resetCreateState = () => {
    setCreateName("")
    setCreateType("expense")
  }

  const resetEditState = () => {
    setEditingId(null)
    setEditingName("")
    setEditingStatus("active")
  }

  const closeDrawer = () => {
    setDrawerMode(null)
    setDrawerError(null)
    resetCreateState()
    resetEditState()
  }

  const openCreateDrawer = () => {
    setDrawerError(null)
    resetCreateState()
    setDrawerMode("create")
  }

  const startEdit = (category: Doc<"categories">) => {
    setEditingId(category._id)
    setEditingName(category.name)
    setEditingStatus(category.status)
    setDrawerError(null)
    setErrorMessage(null)
    setDrawerMode("edit")
  }

  const handleCreate = async () => {
    setDrawerError(null)
    if (!currentLedger) {
      setDrawerError("当前账本不可用，请稍后重试。")
      return
    }
    if (createName.trim().length === 0) {
      setDrawerError("分类名称不能为空。")
      return
    }

    setIsCreating(true)
    try {
      await createCategory({
        ledgerId: currentLedger._id,
        name: createName.trim(),
        type: createType,
      })
      closeDrawer()
    } catch (error: unknown) {
      if (error && typeof error === "object" && "message" in error) {
        setDrawerError(String(error.message))
      } else {
        setDrawerError("创建分类失败，请稍后重试。")
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
      setDrawerError("分类名称不能为空。")
      return
    }

    setDrawerError(null)
    setIsSavingEdit(true)
    try {
      await updateCategory({
        categoryId: editingId,
        name: editingName.trim(),
        status: editingStatus,
      })
      closeDrawer()
    } catch (error: unknown) {
      if (error && typeof error === "object" && "message" in error) {
        setDrawerError(String(error.message))
      } else {
        setDrawerError("保存分类失败，请稍后重试。")
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

  if (isSessionPending || isRedirecting) {
    return (
      <LedgerShell title="分类管理">
        <div className="px-4 text-sm text-muted-foreground lg:px-6">
          {isSessionPending ? "正在加载会话..." : "正在跳转到登录页..."}
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
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={openCreateDrawer}>
            新增分类
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/transactions/new">去记账</Link>
          </Button>
        </div>
      }
    >
      <div className="space-y-4 px-4 lg:space-y-6 lg:px-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Card>
            <CardHeader>
              <CardDescription>分类总数</CardDescription>
              <CardTitle>{totalCategories}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>启用分类</CardDescription>
              <CardTitle>{activeCategories}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>停用分类</CardDescription>
              <CardTitle>{inactiveCategories}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {errorMessage ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>分类筛选</CardTitle>
            <CardDescription>
              可按类型与状态过滤。
              {activeFilterCount > 0 ? ` · ${activeFilterCount} 个筛选条件生效` : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">类型过滤</p>
                <Select value={filterType} onValueChange={(value) => setFilterType(value as "all" | CategoryType)}>
                  <SelectTrigger className="w-full">
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
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    <SelectItem value="active">启用</SelectItem>
                    <SelectItem value="inactive">停用</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end md:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFilterType("all")
                    setFilterStatus("all")
                  }}
                >
                  重置筛选
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {activeFilterCount > 0 ? `已启用 ${activeFilterCount} 个筛选条件` : "当前未启用筛选条件"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>分类列表</CardTitle>
            <CardDescription>当前展示 {filteredCategories.length} 条分类记录。</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredCategories.length === 0 ? (
              <div className="text-sm text-muted-foreground">暂无符合条件的分类。</div>
            ) : (
              <Table className="min-w-[700px]">
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
                        <div className="inline-flex flex-wrap justify-end gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => startEdit(category)}
                          >
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

        <Drawer
          open={drawerMode !== null}
          direction="right"
          onOpenChange={(open) => {
            if (!open) {
              closeDrawer()
            }
          }}
        >
          <DrawerContent className="data-[vaul-drawer-direction=right]:sm:max-w-md data-[vaul-drawer-direction=right]:lg:max-w-xl">
            <DrawerHeader>
              <DrawerTitle>{drawerMode === "create" ? "新增分类" : "编辑分类"}</DrawerTitle>
              <DrawerDescription>
                {drawerMode === "create"
                  ? "创建后可用于新增收入或支出流水。"
                  : "可修改分类名称和启停状态。"}
              </DrawerDescription>
            </DrawerHeader>
            <div className="space-y-4 overflow-y-auto px-4 pb-2">
              {drawerError ? <p className="text-sm text-destructive">{drawerError}</p> : null}

              {drawerMode === "create" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="createCategoryName">分类名称</Label>
                    <Input
                      id="createCategoryName"
                      placeholder="例如：外卖"
                      value={createName}
                      onChange={(event) => {
                        setCreateName(event.target.value)
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="createCategoryType">分类类型</Label>
                    <Select
                      value={createType}
                      onValueChange={(value) => setCreateType(value as CategoryType)}
                    >
                      <SelectTrigger id="createCategoryType" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="expense">支出</SelectItem>
                        <SelectItem value="income">收入</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : null}

              {drawerMode === "edit" ? (
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
                      <SelectTrigger id="editingCategoryStatus" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">启用</SelectItem>
                        <SelectItem value="inactive">停用</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : null}
            </div>
            <DrawerFooter className="sm:flex-row sm:justify-end">
              {drawerMode === "create" ? (
                <Button type="button" disabled={isCreating} onClick={() => void handleCreate()}>
                  {isCreating ? "创建中..." : "创建分类"}
                </Button>
              ) : (
                <Button
                  type="button"
                  disabled={isSavingEdit}
                  onClick={() => void handleSaveEdit()}
                >
                  {isSavingEdit ? "保存中..." : "保存修改"}
                </Button>
              )}
              <DrawerClose asChild>
                <Button type="button" variant="outline" onClick={closeDrawer}>
                  取消
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    </LedgerShell>
  )
}
