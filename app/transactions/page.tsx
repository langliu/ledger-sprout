'use client'

import { useMutation, useQuery } from 'convex/react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { DatePicker } from '@/components/date-picker'
import { DateTimePicker } from '@/components/date-time-picker'
import { LedgerShell } from '@/components/ledger-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { api } from '@/convex/_generated/api'
import type { Doc, Id } from '@/convex/_generated/dataModel'
import { useAuthRedirect } from '@/hooks/use-auth-redirect'
import { useCurrentLedger } from '@/hooks/use-current-ledger'

type TransactionFilter = 'all' | 'expense' | 'income' | 'transfer'
type OptionalMinorUnits = number | null | undefined

const PAGE_SIZE = 50
const MAX_TRANSACTIONS_LIMIT = 500

function toCurrency(minorUnits: number) {
  return new Intl.NumberFormat('zh-CN', {
    currency: 'CNY',
    style: 'currency',
  }).format(minorUnits / 100)
}

function toMinorUnits(amountText: string) {
  const normalized = amountText.trim().replace(',', '.')
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return null
  }
  const value = Math.round(Number(normalized) * 100)
  return Number.isFinite(value) && value > 0 ? value : null
}

function toOptionalMinorUnits(amountText: string): OptionalMinorUnits {
  const normalized = amountText.trim().replace(',', '.')
  if (!normalized) {
    return undefined
  }
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return null
  }
  const value = Math.round(Number(normalized) * 100)
  if (!Number.isFinite(value) || value < 0) {
    return null
  }
  return value
}

function toDateTimeLabel(timestamp: number) {
  return new Date(timestamp).toLocaleString('zh-CN', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function toDayStartTimestamp(dateText: string) {
  if (!dateText) {
    return undefined
  }
  const ts = new Date(`${dateText}T00:00:00`).getTime()
  return Number.isNaN(ts) ? undefined : ts
}

function toDayEndTimestamp(dateText: string) {
  if (!dateText) {
    return undefined
  }
  const ts = new Date(`${dateText}T23:59:59`).getTime()
  return Number.isNaN(ts) ? undefined : ts
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

export default function TransactionsPage() {
  const { session, isSessionPending, currentLedger, ledgerError } = useCurrentLedger()
  const { isRedirecting } = useAuthRedirect({ isSessionPending, session })
  const removeTransaction = useMutation(api.transactions.remove)
  const updateTransaction = useMutation(api.transactions.update)

  const [type, setType] = useState<TransactionFilter>('all')
  const [search, setSearch] = useState('')
  const [filterAccountId, setFilterAccountId] = useState<Id<'accounts'> | ''>('')
  const [filterCategoryId, setFilterCategoryId] = useState<Id<'categories'> | ''>('')
  const [filterFromDate, setFilterFromDate] = useState('')
  const [filterToDate, setFilterToDate] = useState('')
  const [filterMinAmount, setFilterMinAmount] = useState('')
  const [filterMaxAmount, setFilterMaxAmount] = useState('')
  const [visibleLimit, setVisibleLimit] = useState(PAGE_SIZE)
  const [isDeletingId, setIsDeletingId] = useState<Id<'transactions'> | null>(null)
  const [editingId, setEditingId] = useState<Id<'transactions'> | null>(null)
  const [editingType, setEditingType] = useState<'expense' | 'income' | 'transfer' | null>(null)
  const [editingAccountId, setEditingAccountId] = useState<Id<'accounts'> | ''>('')
  const [editingTransferAccountId, setEditingTransferAccountId] = useState<Id<'accounts'> | ''>('')
  const [editingAmount, setEditingAmount] = useState('')
  const [editingOccurredAt, setEditingOccurredAt] = useState<number | null>(null)
  const [editingCategoryId, setEditingCategoryId] = useState<Id<'categories'> | ''>('')
  const [editingNote, setEditingNote] = useState('')
  const [editingOriginalNote, setEditingOriginalNote] = useState('')
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [pageError, setPageError] = useState<string | null>(null)
  const [drawerError, setDrawerError] = useState<string | null>(null)

  const parsedMinAmount = useMemo(() => {
    return toOptionalMinorUnits(filterMinAmount)
  }, [filterMinAmount])
  const parsedMaxAmount = useMemo(() => {
    return toOptionalMinorUnits(filterMaxAmount)
  }, [filterMaxAmount])
  const filterValidationMessage = useMemo(() => {
    if (parsedMinAmount === null || parsedMaxAmount === null) {
      return '金额筛选格式不正确，请输入非负数字，最多两位小数。'
    }
    if (
      typeof parsedMinAmount === 'number' &&
      typeof parsedMaxAmount === 'number' &&
      parsedMinAmount > parsedMaxAmount
    ) {
      return '最小金额不能大于最大金额。'
    }
    return null
  }, [parsedMaxAmount, parsedMinAmount])
  const requestLimit = Math.min(visibleLimit, MAX_TRANSACTIONS_LIMIT)

  const accounts = useQuery(
    api.accounts.list,
    currentLedger ? { ledgerId: currentLedger._id } : 'skip',
  )
  const categories = useQuery(
    api.categories.list,
    currentLedger ? { ledgerId: currentLedger._id } : 'skip',
  )
  const transactions = useQuery(
    api.transactions.list,
    currentLedger && !filterValidationMessage
      ? {
          accountId: filterAccountId || undefined,
          categoryId: filterCategoryId || undefined,
          from: toDayStartTimestamp(filterFromDate),
          ledgerId: currentLedger._id,
          limit: requestLimit,
          maxAmount: typeof parsedMaxAmount === 'number' ? parsedMaxAmount : undefined,
          minAmount: typeof parsedMinAmount === 'number' ? parsedMinAmount : undefined,
          search: search.trim() ? search.trim() : undefined,
          to: toDayEndTimestamp(filterToDate),
          type: type === 'all' ? undefined : type,
        }
      : 'skip',
  )

  const accountMap = useMemo(() => {
    return new Map((accounts ?? []).map((account) => [account._id, account]))
  }, [accounts])
  const categoryMap = useMemo(() => {
    return new Map((categories ?? []).map((category) => [category._id, category]))
  }, [categories])
  const editableCategories = useMemo(() => {
    if (!categories || !editingType || editingType === 'transfer') {
      return []
    }
    return categories.filter((category) => category.type === editingType)
  }, [categories, editingType])
  const editableTransferAccounts = useMemo(() => {
    if (!accounts || editingType !== 'transfer') {
      return []
    }
    return accounts.filter((account) => account._id !== editingAccountId)
  }, [accounts, editingAccountId, editingType])
  const activeFilterCount = useMemo(() => {
    return [
      type !== 'all',
      Boolean(filterAccountId),
      Boolean(filterCategoryId),
      Boolean(filterFromDate),
      Boolean(filterToDate),
      filterMinAmount.trim().length > 0,
      filterMaxAmount.trim().length > 0,
      search.trim().length > 0,
    ].filter(Boolean).length
  }, [
    filterAccountId,
    filterCategoryId,
    filterFromDate,
    filterMaxAmount,
    filterMinAmount,
    filterToDate,
    search,
    type,
  ])
  const hasMoreTransactions =
    !filterValidationMessage &&
    (transactions?.length ?? 0) >= requestLimit &&
    requestLimit < MAX_TRANSACTIONS_LIMIT

  useEffect(() => {
    if (editingType !== 'transfer') {
      return
    }
    if (!editableTransferAccounts.length) {
      return
    }
    if (
      !editingTransferAccountId ||
      !editableTransferAccounts.some((account) => account._id === editingTransferAccountId)
    ) {
      setEditingTransferAccountId(editableTransferAccounts[0]._id)
    }
  }, [editableTransferAccounts, editingTransferAccountId, editingType])

  // biome-ignore lint/correctness/useExhaustiveDependencies: Dependencies intentionally drive pagination reset when filters change.
  useEffect(() => {
    setVisibleLimit(PAGE_SIZE)
  }, [
    currentLedger?._id,
    filterAccountId,
    filterCategoryId,
    filterFromDate,
    filterMaxAmount,
    filterMinAmount,
    filterToDate,
    search,
    type,
  ])

  const resetEditState = () => {
    setEditingId(null)
    setEditingType(null)
    setEditingAccountId('')
    setEditingTransferAccountId('')
    setEditingAmount('')
    setEditingOccurredAt(null)
    setEditingCategoryId('')
    setEditingNote('')
    setEditingOriginalNote('')
    setDrawerError(null)
  }

  const startEdit = (transaction: Doc<'transactions'>) => {
    setEditingId(transaction._id)
    setEditingType(transaction.type)
    setEditingAccountId(transaction.accountId)
    setEditingTransferAccountId(transaction.transferAccountId ?? '')
    setEditingAmount((transaction.amount / 100).toFixed(2))
    setEditingOccurredAt(transaction.occurredAt)
    setEditingCategoryId(transaction.categoryId ?? '')
    const note = transaction.note ?? ''
    setEditingNote(note)
    setEditingOriginalNote(note)
    setDrawerError(null)
  }

  const handleDelete = async (transactionId: Id<'transactions'>) => {
    if (!currentLedger || isDeletingId) {
      return
    }

    setPageError(null)
    setIsDeletingId(transactionId)
    try {
      await removeTransaction({
        transactionId,
      })
      if (editingId === transactionId) {
        resetEditState()
      }
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'message' in error) {
        setPageError(String(error.message))
      } else {
        setPageError('删除失败，请稍后重试。')
      }
    } finally {
      setIsDeletingId(null)
    }
  }

  const handleSaveEdit = async () => {
    if (!editingId || !editingType) {
      return
    }
    if (!editingAccountId) {
      setDrawerError('请选择账户。')
      return
    }

    const amount = toMinorUnits(editingAmount)
    if (!amount) {
      setDrawerError('金额格式不正确，请输入正数，最多两位小数。')
      return
    }

    if (!editingOccurredAt || !Number.isFinite(editingOccurredAt) || editingOccurredAt <= 0) {
      setDrawerError('日期时间格式不正确。')
      return
    }

    if (editingType !== 'transfer' && !editingCategoryId) {
      setDrawerError('请选择分类。')
      return
    }
    if (editingType === 'transfer') {
      if (!editingTransferAccountId) {
        setDrawerError('请选择转入账户。')
        return
      }
      if (editingTransferAccountId === editingAccountId) {
        setDrawerError('转出账户和转入账户不能相同。')
        return
      }
    }

    setDrawerError(null)
    setIsSavingEdit(true)
    try {
      const trimmedNote = editingNote.trim()
      const originalTrimmedNote = editingOriginalNote.trim()
      await updateTransaction({
        accountId: editingAccountId,
        transactionId: editingId,
        ...(editingType === 'transfer'
          ? { transferAccountId: editingTransferAccountId as Id<'accounts'> }
          : {}),
        amount,
        occurredAt: editingOccurredAt,
        ...(editingType !== 'transfer'
          ? { categoryId: editingCategoryId as Id<'categories'> }
          : {}),
        ...(trimmedNote.length > 0
          ? { note: trimmedNote }
          : originalTrimmedNote.length > 0
            ? { clearNote: true }
            : {}),
      })
      resetEditState()
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'message' in error) {
        setDrawerError(String(error.message))
      } else {
        setDrawerError('更新失败，请稍后重试。')
      }
    } finally {
      setIsSavingEdit(false)
    }
  }

  if (isSessionPending || isRedirecting) {
    return (
      <LedgerShell title='流水记录'>
        <div className='px-4 text-sm text-muted-foreground lg:px-6'>
          {isSessionPending ? '正在加载会话...' : '正在跳转到登录页...'}
        </div>
      </LedgerShell>
    )
  }

  if (ledgerError) {
    return (
      <LedgerShell title='流水记录'>
        <div className='px-4 lg:px-6'>
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
      headerAction={
        <Button asChild size='sm'>
          <Link href='/transactions/new'>新增记账</Link>
        </Button>
      }
      title='流水记录'
    >
      <div className='space-y-4 px-4 lg:space-y-6 lg:px-6'>
        <Card>
          <CardHeader>
            <CardTitle>流水筛选</CardTitle>
            <CardDescription>支持按类型、账户、分类、日期区间和备注关键词过滤。</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 gap-3 md:grid-cols-6 xl:grid-cols-12'>
              <div className='space-y-2 md:col-span-2 xl:col-span-2'>
                <p className='text-sm text-muted-foreground'>类型</p>
                <Select onValueChange={(value) => setType(value as TransactionFilter)} value={type}>
                  <SelectTrigger className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>全部</SelectItem>
                    <SelectItem value='expense'>支出</SelectItem>
                    <SelectItem value='income'>收入</SelectItem>
                    <SelectItem value='transfer'>转账</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2 md:col-span-2 xl:col-span-2'>
                <p className='text-sm text-muted-foreground'>账户</p>
                <Select
                  onValueChange={(value) =>
                    setFilterAccountId(value === 'all' ? '' : (value as Id<'accounts'>))
                  }
                  value={filterAccountId || 'all'}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>全部账户</SelectItem>
                    {(accounts ?? []).map((account) => (
                      <SelectItem key={account._id} value={account._id}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2 md:col-span-2 xl:col-span-2'>
                <p className='text-sm text-muted-foreground'>分类</p>
                <Select
                  onValueChange={(value) =>
                    setFilterCategoryId(value === 'all' ? '' : (value as Id<'categories'>))
                  }
                  value={filterCategoryId || 'all'}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>全部分类</SelectItem>
                    {(categories ?? [])
                      .filter((category) =>
                        type === 'all' || type === 'transfer' ? true : category.type === type,
                      )
                      .map((category) => (
                        <SelectItem key={category._id} value={category._id}>
                          {category.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2 md:col-span-2 xl:col-span-2'>
                <p className='text-sm text-muted-foreground'>开始日期</p>
                <DatePicker onChange={setFilterFromDate} value={filterFromDate} />
              </div>
              <div className='space-y-2 md:col-span-2 xl:col-span-2'>
                <p className='text-sm text-muted-foreground'>结束日期</p>
                <DatePicker onChange={setFilterToDate} value={filterToDate} />
              </div>
              <div className='space-y-2 md:col-span-2 xl:col-span-2'>
                <p className='text-sm text-muted-foreground'>最小金额（元）</p>
                <Input
                  onChange={(event) => {
                    setFilterMinAmount(event.target.value)
                  }}
                  placeholder='例如 10.00'
                  value={filterMinAmount}
                />
              </div>
              <div className='space-y-2 md:col-span-2 xl:col-span-2'>
                <p className='text-sm text-muted-foreground'>最大金额（元）</p>
                <Input
                  onChange={(event) => {
                    setFilterMaxAmount(event.target.value)
                  }}
                  placeholder='例如 500.00'
                  value={filterMaxAmount}
                />
              </div>
              <div className='space-y-2 md:col-span-4 xl:col-span-10'>
                <p className='text-sm text-muted-foreground'>关键词（备注）</p>
                <Input
                  onChange={(event) => {
                    setSearch(event.target.value)
                  }}
                  placeholder='例如：午饭、地铁、工资'
                  value={search}
                />
              </div>
            </div>
            <div className='mt-4 flex flex-wrap items-center justify-between gap-2'>
              <p className='text-xs text-muted-foreground'>
                {activeFilterCount > 0
                  ? `已启用 ${activeFilterCount} 个筛选条件`
                  : '当前未启用筛选条件'}
              </p>
              <Button
                onClick={() => {
                  setType('all')
                  setFilterAccountId('')
                  setFilterCategoryId('')
                  setFilterFromDate('')
                  setFilterToDate('')
                  setFilterMinAmount('')
                  setFilterMaxAmount('')
                  setSearch('')
                  setVisibleLimit(PAGE_SIZE)
                }}
                size='sm'
                type='button'
                variant='outline'
              >
                重置筛选
              </Button>
            </div>
            {filterValidationMessage ? (
              <p className='mt-3 text-xs text-destructive'>{filterValidationMessage}</p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>流水列表</CardTitle>
            <CardDescription>
              {transactions?.length ?? 0} 条记录（当前最多加载 {requestLimit} 条）
              {activeFilterCount > 0 ? ` · ${activeFilterCount} 个筛选条件生效` : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pageError ? <p className='mb-3 text-sm text-destructive'>{pageError}</p> : null}
            {filterValidationMessage ? (
              <div className='text-sm text-destructive'>请先修正金额筛选条件后再查询。</div>
            ) : !transactions || transactions.length === 0 ? (
              <div className='text-sm text-muted-foreground'>暂无符合条件的流水。</div>
            ) : (
              <>
                <Table className='min-w-[980px]'>
                  <TableHeader>
                    <TableRow>
                      <TableHead>日期时间</TableHead>
                      <TableHead>类型</TableHead>
                      <TableHead>账户</TableHead>
                      <TableHead>分类</TableHead>
                      <TableHead>备注</TableHead>
                      <TableHead className='text-right'>金额</TableHead>
                      <TableHead className='w-44 text-right'>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => {
                      const sourceAccount =
                        accountMap.get(transaction.accountId)?.name ?? '未知账户'
                      const targetAccount = transaction.transferAccountId
                        ? (accountMap.get(transaction.transferAccountId)?.name ?? '未知账户')
                        : null
                      const categoryName = transaction.categoryId
                        ? (categoryMap.get(transaction.categoryId)?.name ?? '未分类')
                        : '-'
                      const accountDetail =
                        transaction.type === 'transfer'
                          ? `${sourceAccount} -> ${targetAccount ?? '-'}`
                          : sourceAccount
                      const categoryDetail = transaction.type === 'transfer' ? '-' : categoryName
                      const sign = transaction.type === 'expense' ? '-' : '+'
                      return (
                        <TableRow key={transaction._id}>
                          <TableCell>{toDateTimeLabel(transaction.occurredAt)}</TableCell>
                          <TableCell>{getTypeLabel(transaction.type)}</TableCell>
                          <TableCell className='max-w-[260px] truncate'>{accountDetail}</TableCell>
                          <TableCell className='max-w-[160px] truncate'>{categoryDetail}</TableCell>
                          <TableCell className='max-w-[240px] truncate'>
                            {transaction.note && transaction.note.trim().length > 0
                              ? transaction.note
                              : '-'}
                          </TableCell>
                          <TableCell className='text-right font-medium'>
                            {sign}
                            {toCurrency(transaction.amount)}
                          </TableCell>
                          <TableCell className='text-right'>
                            <div className='inline-flex flex-wrap justify-end gap-2'>
                              <Button
                                onClick={() => startEdit(transaction)}
                                size='sm'
                                type='button'
                                variant='outline'
                              >
                                编辑
                              </Button>
                              <Button
                                disabled={isDeletingId === transaction._id}
                                onClick={() => {
                                  void handleDelete(transaction._id)
                                }}
                                size='sm'
                                type='button'
                                variant='ghost'
                              >
                                {isDeletingId === transaction._id ? '删除中...' : '删除'}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
                <div className='mt-4 flex flex-wrap items-center justify-between gap-2'>
                  <p className='text-xs text-muted-foreground'>
                    已显示 {transactions.length} 条，最多可加载 {MAX_TRANSACTIONS_LIMIT} 条
                  </p>
                  {hasMoreTransactions ? (
                    <Button
                      onClick={() => {
                        setVisibleLimit((previous) =>
                          Math.min(previous + PAGE_SIZE, MAX_TRANSACTIONS_LIMIT),
                        )
                      }}
                      size='sm'
                      type='button'
                      variant='outline'
                    >
                      加载更多
                    </Button>
                  ) : null}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Drawer
          direction='right'
          onOpenChange={(open) => {
            if (!open) {
              resetEditState()
            }
          }}
          open={Boolean(editingId)}
        >
          <DrawerContent className='data-[vaul-drawer-direction=right]:sm:max-w-md data-[vaul-drawer-direction=right]:lg:max-w-xl'>
            <DrawerHeader>
              <DrawerTitle>编辑流水</DrawerTitle>
              <DrawerDescription>
                可修改金额、日期时间、账户、分类和备注。转账不支持修改分类。
              </DrawerDescription>
            </DrawerHeader>
            <div className='space-y-4 overflow-y-auto px-4 pb-2'>
              {drawerError ? <p className='text-sm text-destructive'>{drawerError}</p> : null}
              <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
                <div className='space-y-2'>
                  <p className='text-sm text-muted-foreground'>类型</p>
                  <Input disabled value={getTypeLabel(editingType ?? 'expense')} />
                </div>
                <div className='space-y-2'>
                  <p className='text-sm text-muted-foreground'>账户</p>
                  <Select
                    onValueChange={(value) => setEditingAccountId(value as Id<'accounts'>)}
                    value={editingAccountId || undefined}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='请选择账户' />
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
                <div className='space-y-2 md:col-span-2'>
                  <p className='text-sm text-muted-foreground'>金额（元）</p>
                  <Input
                    onChange={(event) => {
                      setEditingAmount(event.target.value)
                    }}
                    value={editingAmount}
                  />
                </div>
                <div className='space-y-2 md:col-span-2'>
                  <p className='text-sm text-muted-foreground'>日期时间</p>
                  <DateTimePicker onChange={setEditingOccurredAt} value={editingOccurredAt} />
                </div>
              </div>

              {editingType === 'transfer' ? (
                <div className='space-y-2'>
                  <p className='text-sm text-muted-foreground'>转入账户</p>
                  <Select
                    onValueChange={(value) => setEditingTransferAccountId(value as Id<'accounts'>)}
                    value={editingTransferAccountId || undefined}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='请选择转入账户' />
                    </SelectTrigger>
                    <SelectContent>
                      {editableTransferAccounts.map((account) => (
                        <SelectItem key={account._id} value={account._id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              {editingType !== 'transfer' ? (
                <div className='space-y-2'>
                  <p className='text-sm text-muted-foreground'>分类</p>
                  <Select
                    onValueChange={(value) => setEditingCategoryId(value as Id<'categories'>)}
                    value={editingCategoryId || undefined}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='请选择分类' />
                    </SelectTrigger>
                    <SelectContent>
                      {editableCategories.map((category) => (
                        <SelectItem key={category._id} value={category._id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              <div className='space-y-2'>
                <p className='text-sm text-muted-foreground'>备注</p>
                <textarea
                  className='border-input focus-visible:border-ring focus-visible:ring-ring/50 min-h-24 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]'
                  onChange={(event) => {
                    setEditingNote(event.target.value)
                  }}
                  placeholder='删除全部内容后保存可清空备注'
                  value={editingNote}
                />
              </div>
            </div>
            <DrawerFooter className='sm:flex-row sm:justify-end'>
              <Button disabled={isSavingEdit} onClick={() => void handleSaveEdit()} type='button'>
                {isSavingEdit ? '保存中...' : '保存修改'}
              </Button>
              <DrawerClose asChild>
                <Button onClick={resetEditState} type='button' variant='outline'>
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
