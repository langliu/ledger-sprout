'use client'

import { useMutation, useQuery } from 'convex/react'
import Link from 'next/link'
import { useMemo, useState } from 'react'
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
import { Label } from '@/components/ui/label'
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

type AccountType = 'cash' | 'bank' | 'credit' | 'wallet'
type AccountStatus = 'active' | 'inactive'
type AccountDrawerMode = 'create' | 'edit' | 'adjust' | null

const ACCOUNT_TYPE_OPTIONS: Array<{ value: AccountType; label: string }> = [
  { label: '现金', value: 'cash' },
  { label: '银行卡', value: 'bank' },
  { label: '信用卡', value: 'credit' },
  { label: '电子钱包', value: 'wallet' },
]

function toMinorUnits(amountText: string) {
  const normalized = amountText.trim().replace(',', '.')
  if (!/^-?\d+(\.\d{1,2})?$/.test(normalized)) {
    return null
  }
  return Math.round(Number(normalized) * 100)
}

function toCurrency(minorUnits: number) {
  return new Intl.NumberFormat('zh-CN', {
    currency: 'CNY',
    style: 'currency',
  }).format(minorUnits / 100)
}

function toSignedCurrency(minorUnits: number) {
  const absolute = toCurrency(Math.abs(minorUnits))
  return minorUnits >= 0 ? `+${absolute}` : `-${absolute}`
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

function getTypeLabel(type: AccountType) {
  return ACCOUNT_TYPE_OPTIONS.find((item) => item.value === type)?.label ?? type
}

export default function AccountsPage() {
  const { session, isSessionPending, currentLedger, ledgerError } = useCurrentLedger()
  const { isRedirecting } = useAuthRedirect({ isSessionPending, session })
  const createAccount = useMutation(api.accounts.create)
  const updateAccount = useMutation(api.accounts.update)
  const adjustBalance = useMutation(api.accounts.adjustBalance)

  const accounts = useQuery(
    api.accounts.list,
    currentLedger ? { ledgerId: currentLedger._id } : 'skip',
  )
  const adjustments = useQuery(
    api.accounts.listAdjustments,
    currentLedger ? { ledgerId: currentLedger._id, limit: 20 } : 'skip',
  )

  const [drawerMode, setDrawerMode] = useState<AccountDrawerMode>(null)
  const [drawerError, setDrawerError] = useState<string | null>(null)

  const [createName, setCreateName] = useState('')
  const [createType, setCreateType] = useState<AccountType>('cash')
  const [createInitialBalance, setCreateInitialBalance] = useState('0')
  const [isCreating, setIsCreating] = useState(false)

  const [editingId, setEditingId] = useState<Id<'accounts'> | null>(null)
  const [editingName, setEditingName] = useState('')
  const [editingType, setEditingType] = useState<AccountType>('cash')
  const [editingStatus, setEditingStatus] = useState<AccountStatus>('active')
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  const [adjustAccountId, setAdjustAccountId] = useState<Id<'accounts'> | null>(null)
  const [adjustDelta, setAdjustDelta] = useState('')
  const [adjustReason, setAdjustReason] = useState('')
  const [isAdjusting, setIsAdjusting] = useState(false)

  const [filterType, setFilterType] = useState<'all' | AccountType>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | AccountStatus>('all')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const activeCount = useMemo(() => {
    return (accounts ?? []).filter((account) => account.status === 'active').length
  }, [accounts])
  const totalBalance = useMemo(() => {
    return (accounts ?? []).reduce((sum, account) => sum + account.currentBalance, 0)
  }, [accounts])
  const accountMap = useMemo(() => {
    return new Map((accounts ?? []).map((account) => [account._id, account]))
  }, [accounts])
  const filteredAccounts = useMemo(() => {
    return (accounts ?? []).filter((account) => {
      const passType = filterType === 'all' || account.type === filterType
      const passStatus = filterStatus === 'all' || account.status === filterStatus
      return passType && passStatus
    })
  }, [accounts, filterStatus, filterType])
  const activeFilterCount = useMemo(() => {
    return [filterType !== 'all', filterStatus !== 'all'].filter(Boolean).length
  }, [filterStatus, filterType])

  const resetCreateState = () => {
    setCreateName('')
    setCreateType('cash')
    setCreateInitialBalance('0')
  }

  const resetEditState = () => {
    setEditingId(null)
    setEditingName('')
    setEditingType('cash')
    setEditingStatus('active')
  }

  const resetAdjustState = () => {
    setAdjustAccountId(null)
    setAdjustDelta('')
    setAdjustReason('')
  }

  const closeDrawer = () => {
    setDrawerMode(null)
    setDrawerError(null)
    resetCreateState()
    resetEditState()
    resetAdjustState()
  }

  const openCreateDrawer = () => {
    setDrawerError(null)
    resetCreateState()
    setDrawerMode('create')
  }

  const startEdit = (account: Doc<'accounts'>) => {
    setEditingId(account._id)
    setEditingName(account.name)
    setEditingType(account.type)
    setEditingStatus(account.status)
    setDrawerError(null)
    setErrorMessage(null)
    setDrawerMode('edit')
  }

  const startAdjust = (account: Doc<'accounts'>) => {
    setAdjustAccountId(account._id)
    setAdjustDelta('')
    setAdjustReason('')
    setDrawerError(null)
    setErrorMessage(null)
    setDrawerMode('adjust')
  }

  const handleCreate = async () => {
    setDrawerError(null)
    if (!currentLedger) {
      setDrawerError('当前账本不可用，请稍后重试。')
      return
    }

    const minorUnits = toMinorUnits(createInitialBalance)
    if (minorUnits === null) {
      setDrawerError('初始余额格式不正确。')
      return
    }
    if (createName.trim().length === 0) {
      setDrawerError('账户名称不能为空。')
      return
    }

    setIsCreating(true)
    try {
      await createAccount({
        initialBalance: minorUnits,
        ledgerId: currentLedger._id,
        name: createName.trim(),
        type: createType,
      })
      closeDrawer()
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'message' in error) {
        setDrawerError(String(error.message))
      } else {
        setDrawerError('创建账户失败，请稍后重试。')
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
      setDrawerError('账户名称不能为空。')
      return
    }

    setDrawerError(null)
    setIsSavingEdit(true)
    try {
      await updateAccount({
        accountId: editingId,
        name: editingName.trim(),
        status: editingStatus,
        type: editingType,
      })
      closeDrawer()
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'message' in error) {
        setDrawerError(String(error.message))
      } else {
        setDrawerError('保存账户失败，请稍后重试。')
      }
    } finally {
      setIsSavingEdit(false)
    }
  }

  const handleAdjustBalance = async () => {
    setDrawerError(null)

    if (!adjustAccountId) {
      setDrawerError('请选择账户。')
      return
    }
    const delta = toMinorUnits(adjustDelta)
    if (delta === null || delta === 0) {
      setDrawerError('调整金额格式不正确，且不能为 0。')
      return
    }

    setIsAdjusting(true)
    try {
      await adjustBalance({
        accountId: adjustAccountId,
        delta,
        ...(adjustReason.trim().length > 0 ? { reason: adjustReason.trim() } : {}),
      })
      closeDrawer()
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'message' in error) {
        setDrawerError(String(error.message))
      } else {
        setDrawerError('余额调整失败，请稍后重试。')
      }
    } finally {
      setIsAdjusting(false)
    }
  }

  const handleToggleStatus = async (account: Doc<'accounts'>) => {
    setErrorMessage(null)
    try {
      await updateAccount({
        accountId: account._id,
        status: account.status === 'active' ? 'inactive' : 'active',
      })
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'message' in error) {
        setErrorMessage(String(error.message))
      } else {
        setErrorMessage('更新状态失败，请稍后重试。')
      }
    }
  }

  if (isSessionPending || isRedirecting) {
    return (
      <LedgerShell title='账户管理'>
        <div className='px-4 text-sm text-muted-foreground lg:px-6'>
          {isSessionPending ? '正在加载会话...' : '正在跳转到登录页...'}
        </div>
      </LedgerShell>
    )
  }

  if (ledgerError) {
    return (
      <LedgerShell title='账户管理'>
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
        <div className='flex flex-wrap items-center gap-2'>
          <Button onClick={openCreateDrawer} size='sm'>
            新增账户
          </Button>
          <Button asChild size='sm' variant='outline'>
            <Link href='/transactions/new'>记一笔</Link>
          </Button>
        </div>
      }
      title='账户管理'
    >
      <div className='space-y-4 px-4 lg:space-y-6 lg:px-6'>
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3'>
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

        {errorMessage ? (
          <div className='rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive'>
            {errorMessage}
          </div>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>账户筛选</CardTitle>
            <CardDescription>
              可按类型与状态过滤。
              {activeFilterCount > 0 ? ` · ${activeFilterCount} 个筛选条件生效` : ''}
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-1 gap-3 md:grid-cols-3'>
              <div className='space-y-2'>
                <p className='text-sm text-muted-foreground'>类型过滤</p>
                <Select
                  onValueChange={(value) => setFilterType(value as 'all' | AccountType)}
                  value={filterType}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>全部</SelectItem>
                    {ACCOUNT_TYPE_OPTIONS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <p className='text-sm text-muted-foreground'>状态过滤</p>
                <Select
                  onValueChange={(value) => setFilterStatus(value as 'all' | AccountStatus)}
                  value={filterStatus}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>全部</SelectItem>
                    <SelectItem value='active'>启用</SelectItem>
                    <SelectItem value='inactive'>停用</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='flex items-end md:justify-end'>
                <Button
                  onClick={() => {
                    setFilterType('all')
                    setFilterStatus('all')
                  }}
                  size='sm'
                  type='button'
                  variant='outline'
                >
                  重置筛选
                </Button>
              </div>
            </div>
            <p className='text-xs text-muted-foreground'>
              {activeFilterCount > 0
                ? `已启用 ${activeFilterCount} 个筛选条件`
                : '当前未启用筛选条件'}
            </p>
          </CardContent>
        </Card>

        <div className='grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]'>
          <Card>
            <CardHeader>
              <CardTitle>账户列表</CardTitle>
              <CardDescription>
                当前展示 {filteredAccounts.length} 个账户。
                {activeFilterCount > 0 ? ` · ${activeFilterCount} 个筛选条件生效` : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredAccounts.length === 0 ? (
                <div className='text-sm text-muted-foreground'>暂无符合条件的账户。</div>
              ) : (
                <Table className='min-w-[760px]'>
                  <TableHeader>
                    <TableRow>
                      <TableHead>名称</TableHead>
                      <TableHead>类型</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead className='text-right'>当前余额</TableHead>
                      <TableHead className='w-56 text-right'>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAccounts.map((account) => (
                      <TableRow key={account._id}>
                        <TableCell>{account.name}</TableCell>
                        <TableCell>{getTypeLabel(account.type)}</TableCell>
                        <TableCell>{account.status === 'active' ? '启用' : '停用'}</TableCell>
                        <TableCell className='text-right'>
                          {toCurrency(account.currentBalance)}
                        </TableCell>
                        <TableCell className='text-right'>
                          <div className='inline-flex flex-wrap justify-end gap-2'>
                            <Button
                              onClick={() => startAdjust(account)}
                              size='sm'
                              type='button'
                              variant='secondary'
                            >
                              调整余额
                            </Button>
                            <Button
                              onClick={() => startEdit(account)}
                              size='sm'
                              type='button'
                              variant='outline'
                            >
                              编辑
                            </Button>
                            <Button
                              onClick={() => {
                                void handleToggleStatus(account)
                              }}
                              size='sm'
                              type='button'
                              variant='ghost'
                            >
                              {account.status === 'active' ? '停用' : '启用'}
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

          <Card>
            <CardHeader>
              <CardTitle>最近余额调整记录</CardTitle>
              <CardDescription>记录手动调整账户余额的历史操作。</CardDescription>
            </CardHeader>
            <CardContent>
              {!adjustments || adjustments.length === 0 ? (
                <div className='text-sm text-muted-foreground'>暂无余额调整记录。</div>
              ) : (
                <Table className='min-w-[560px]'>
                  <TableHeader>
                    <TableRow>
                      <TableHead>时间</TableHead>
                      <TableHead>账户</TableHead>
                      <TableHead className='text-right'>调整金额</TableHead>
                      <TableHead>原因</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adjustments.map((item) => (
                      <TableRow key={item._id}>
                        <TableCell>{toDateTimeLabel(item.createdAt)}</TableCell>
                        <TableCell>{accountMap.get(item.accountId)?.name ?? '未知账户'}</TableCell>
                        <TableCell className='text-right font-medium'>
                          {toSignedCurrency(item.delta)}
                        </TableCell>
                        <TableCell>{item.reason ?? '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <Drawer
          direction='right'
          onOpenChange={(open) => {
            if (!open) {
              closeDrawer()
            }
          }}
          open={drawerMode !== null}
        >
          <DrawerContent className='data-[vaul-drawer-direction=right]:sm:max-w-md data-[vaul-drawer-direction=right]:lg:max-w-xl'>
            <DrawerHeader>
              <DrawerTitle>
                {drawerMode === 'create'
                  ? '新增账户'
                  : drawerMode === 'edit'
                    ? '编辑账户'
                    : '调整余额'}
              </DrawerTitle>
              <DrawerDescription>
                {drawerMode === 'create'
                  ? '创建账户后可用于记账与余额调整。'
                  : drawerMode === 'edit'
                    ? '可修改账户名称、类型和启停状态。'
                    : '输入正数为增加，负数为减少，例如 -100.00。'}
              </DrawerDescription>
            </DrawerHeader>
            <div className='space-y-4 overflow-y-auto px-4 pb-2'>
              {drawerError ? <p className='text-sm text-destructive'>{drawerError}</p> : null}

              {drawerMode === 'create' ? (
                <>
                  <div className='space-y-2'>
                    <Label htmlFor='createAccountName'>名称</Label>
                    <Input
                      id='createAccountName'
                      onChange={(event) => {
                        setCreateName(event.target.value)
                      }}
                      placeholder='例如：招商银行卡'
                      value={createName}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='createAccountType'>类型</Label>
                    <Select
                      onValueChange={(value) => setCreateType(value as AccountType)}
                      value={createType}
                    >
                      <SelectTrigger className='w-full' id='createAccountType'>
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
                  <div className='space-y-2'>
                    <Label htmlFor='createInitialBalance'>初始余额（元）</Label>
                    <Input
                      id='createInitialBalance'
                      onChange={(event) => {
                        setCreateInitialBalance(event.target.value)
                      }}
                      value={createInitialBalance}
                    />
                  </div>
                </>
              ) : null}

              {drawerMode === 'edit' ? (
                <>
                  <div className='space-y-2'>
                    <Label htmlFor='editingAccountName'>名称</Label>
                    <Input
                      id='editingAccountName'
                      onChange={(event) => {
                        setEditingName(event.target.value)
                      }}
                      value={editingName}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='editingAccountType'>类型</Label>
                    <Select
                      onValueChange={(value) => setEditingType(value as AccountType)}
                      value={editingType}
                    >
                      <SelectTrigger className='w-full' id='editingAccountType'>
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
                  <div className='space-y-2'>
                    <Label htmlFor='editingAccountStatus'>状态</Label>
                    <Select
                      onValueChange={(value) => setEditingStatus(value as AccountStatus)}
                      value={editingStatus}
                    >
                      <SelectTrigger className='w-full' id='editingAccountStatus'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='active'>启用</SelectItem>
                        <SelectItem value='inactive'>停用</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : null}

              {drawerMode === 'adjust' ? (
                <>
                  <div className='space-y-2'>
                    <Label htmlFor='adjustAccountName'>账户</Label>
                    <Input
                      id='adjustAccountName'
                      readOnly
                      value={
                        adjustAccountId ? (accountMap.get(adjustAccountId)?.name ?? '未知账户') : ''
                      }
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='adjustDelta'>调整金额（元）</Label>
                    <Input
                      id='adjustDelta'
                      onChange={(event) => {
                        setAdjustDelta(event.target.value)
                      }}
                      placeholder='例如：100.00 或 -35.50'
                      value={adjustDelta}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='adjustReason'>原因（可选）</Label>
                    <textarea
                      className='border-input focus-visible:border-ring focus-visible:ring-ring/50 min-h-24 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]'
                      id='adjustReason'
                      onChange={(event) => {
                        setAdjustReason(event.target.value)
                      }}
                      placeholder='例如：月初对账'
                      value={adjustReason}
                    />
                  </div>
                </>
              ) : null}
            </div>
            <DrawerFooter className='sm:flex-row sm:justify-end'>
              {drawerMode === 'create' ? (
                <Button disabled={isCreating} onClick={() => void handleCreate()} type='button'>
                  {isCreating ? '创建中...' : '创建账户'}
                </Button>
              ) : drawerMode === 'edit' ? (
                <Button disabled={isSavingEdit} onClick={() => void handleSaveEdit()} type='button'>
                  {isSavingEdit ? '保存中...' : '保存修改'}
                </Button>
              ) : (
                <Button
                  disabled={isAdjusting || !adjustAccountId}
                  onClick={() => void handleAdjustBalance()}
                  type='button'
                >
                  {isAdjusting ? '调整中...' : '确认调整'}
                </Button>
              )}
              <DrawerClose asChild>
                <Button onClick={closeDrawer} type='button' variant='outline'>
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
