'use client'

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  type UniqueIdentifier,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCircleCheckFilled,
  IconDotsVertical,
  IconGripVertical,
  IconLayoutColumns,
  IconLoader,
  IconPlus,
  IconTrendingUp,
} from '@tabler/icons-react'
import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type Row,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from '@tanstack/react-table'
import * as React from 'react'
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'
import { toast } from 'sonner'
import { z } from 'zod'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useIsMobile } from '@/hooks/use-mobile'

export const schema = z.object({
  header: z.string(),
  id: z.number(),
  limit: z.string(),
  reviewer: z.string(),
  status: z.string(),
  target: z.string(),
  type: z.string(),
})

const UNASSIGNED_REVIEWER = 'Assign reviewer'

const STATUS_LABEL_MAP: Record<string, string> = {
  Done: '已完成',
  'In Process': '处理中',
  'In Progress': '处理中',
  'Not Started': '未开始',
}

function getStatusLabel(status: string) {
  return STATUS_LABEL_MAP[status] ?? status
}

// Create a separate component for the drag handle
function DragHandle({ id }: { id: number }) {
  const { attributes, listeners } = useSortable({
    id,
  })

  return (
    <Button
      {...attributes}
      {...listeners}
      className='text-muted-foreground size-7 hover:bg-transparent'
      size='icon'
      variant='ghost'
    >
      <IconGripVertical className='text-muted-foreground size-3' />
      <span className='sr-only'>拖拽调整顺序</span>
    </Button>
  )
}

const columns: ColumnDef<z.infer<typeof schema>>[] = [
  {
    cell: ({ row }) => <DragHandle id={row.original.id} />,
    header: () => null,
    id: 'drag',
  },
  {
    cell: ({ row }) => (
      <div className='flex items-center justify-center'>
        <Checkbox
          aria-label='选择行'
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      </div>
    ),
    enableHiding: false,
    enableSorting: false,
    header: ({ table }) => (
      <div className='flex items-center justify-center'>
        <Checkbox
          aria-label='选择全部'
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      </div>
    ),
    id: 'select',
  },
  {
    accessorKey: 'header',
    cell: ({ row }) => {
      return <TableCellViewer item={row.original} />
    },
    enableHiding: false,
    header: '标题',
  },
  {
    accessorKey: 'type',
    cell: ({ row }) => (
      <div className='w-32'>
        <Badge className='text-muted-foreground px-1.5' variant='outline'>
          {row.original.type}
        </Badge>
      </div>
    ),
    header: '文档类型',
  },
  {
    accessorKey: 'status',
    cell: ({ row }) => (
      <Badge className='text-muted-foreground px-1.5' variant='outline'>
        {row.original.status === 'Done' ? (
          <IconCircleCheckFilled className='fill-green-500 dark:fill-green-400' />
        ) : (
          <IconLoader />
        )}
        {getStatusLabel(row.original.status)}
      </Badge>
    ),
    header: '状态',
  },
  {
    accessorKey: 'target',
    cell: ({ row }) => (
      <form
        onSubmit={(e) => {
          e.preventDefault()
          toast.promise(new Promise((resolve) => setTimeout(resolve, 1000)), {
            error: '保存失败',
            loading: `正在保存：${row.original.header}`,
            success: '保存成功',
          })
        }}
      >
        <Label className='sr-only' htmlFor={`${row.original.id}-target`}>
          目标
        </Label>
        <Input
          className='hover:bg-input/30 focus-visible:bg-background dark:hover:bg-input/30 dark:focus-visible:bg-input/30 h-8 w-16 border-transparent bg-transparent text-right shadow-none focus-visible:border dark:bg-transparent'
          defaultValue={row.original.target}
          id={`${row.original.id}-target`}
        />
      </form>
    ),
    header: () => <div className='w-full text-right'>目标</div>,
  },
  {
    accessorKey: 'limit',
    cell: ({ row }) => (
      <form
        onSubmit={(e) => {
          e.preventDefault()
          toast.promise(new Promise((resolve) => setTimeout(resolve, 1000)), {
            error: '保存失败',
            loading: `正在保存：${row.original.header}`,
            success: '保存成功',
          })
        }}
      >
        <Label className='sr-only' htmlFor={`${row.original.id}-limit`}>
          上限
        </Label>
        <Input
          className='hover:bg-input/30 focus-visible:bg-background dark:hover:bg-input/30 dark:focus-visible:bg-input/30 h-8 w-16 border-transparent bg-transparent text-right shadow-none focus-visible:border dark:bg-transparent'
          defaultValue={row.original.limit}
          id={`${row.original.id}-limit`}
        />
      </form>
    ),
    header: () => <div className='w-full text-right'>上限</div>,
  },
  {
    accessorKey: 'reviewer',
    cell: ({ row }) => {
      const isAssigned = row.original.reviewer !== UNASSIGNED_REVIEWER

      if (isAssigned) {
        return row.original.reviewer
      }

      return (
        <>
          <Label className='sr-only' htmlFor={`${row.original.id}-reviewer`}>
            审核人
          </Label>
          <Select>
            <SelectTrigger
              className='w-38 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate'
              id={`${row.original.id}-reviewer`}
              size='sm'
            >
              <SelectValue placeholder='指派审核人' />
            </SelectTrigger>
            <SelectContent align='end'>
              <SelectItem value='Eddie Lake'>Eddie Lake</SelectItem>
              <SelectItem value='Jamik Tashpulatov'>Jamik Tashpulatov</SelectItem>
            </SelectContent>
          </Select>
        </>
      )
    },
    header: '审核人',
  },
  {
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className='data-[state=open]:bg-muted text-muted-foreground flex size-8'
            size='icon'
            variant='ghost'
          >
            <IconDotsVertical />
            <span className='sr-only'>打开菜单</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-32'>
          <DropdownMenuItem>编辑</DropdownMenuItem>
          <DropdownMenuItem>创建副本</DropdownMenuItem>
          <DropdownMenuItem>收藏</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant='destructive'>删除</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    id: 'actions',
  },
]

function DraggableRow({ row }: { row: Row<z.infer<typeof schema>> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  })

  return (
    <TableRow
      className='relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80'
      data-dragging={isDragging}
      data-state={row.getIsSelected() && 'selected'}
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  )
}

export function DataTable({ data: initialData }: { data: z.infer<typeof schema>[] }) {
  const [data, setData] = React.useState(() => initialData)
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const sortableId = React.useId()
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {}),
  )

  const dataIds = React.useMemo<UniqueIdentifier[]>(() => data?.map(({ id }) => id) || [], [data])

  const table = useReactTable({
    columns,
    data,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (row) => row.id.toString(),
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    state: {
      columnFilters,
      columnVisibility,
      pagination,
      rowSelection,
      sorting,
    },
  })

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      setData((data) => {
        const oldIndex = dataIds.indexOf(active.id)
        const newIndex = dataIds.indexOf(over.id)
        return arrayMove(data, oldIndex, newIndex)
      })
    }
  }

  return (
    <Tabs className='w-full flex-col justify-start gap-6' defaultValue='outline'>
      <div className='flex items-center justify-between px-4 lg:px-6'>
        <Label className='sr-only' htmlFor='view-selector'>
          视图
        </Label>
        <Select defaultValue='outline'>
          <SelectTrigger className='flex w-fit @4xl/main:hidden' id='view-selector' size='sm'>
            <SelectValue placeholder='选择视图' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='outline'>文档大纲</SelectItem>
            <SelectItem value='past-performance'>历史表现</SelectItem>
            <SelectItem value='key-personnel'>关键人员</SelectItem>
            <SelectItem value='focus-documents'>重点文档</SelectItem>
          </SelectContent>
        </Select>
        <TabsList className='**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex'>
          <TabsTrigger value='outline'>文档大纲</TabsTrigger>
          <TabsTrigger value='past-performance'>
            历史表现 <Badge variant='secondary'>3</Badge>
          </TabsTrigger>
          <TabsTrigger value='key-personnel'>
            关键人员 <Badge variant='secondary'>2</Badge>
          </TabsTrigger>
          <TabsTrigger value='focus-documents'>重点文档</TabsTrigger>
        </TabsList>
        <div className='flex items-center gap-2'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size='sm' variant='outline'>
                <IconLayoutColumns />
                <span className='hidden lg:inline'>自定义列</span>
                <span className='lg:hidden'>列</span>
                <IconChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-56'>
              {table
                .getAllColumns()
                .filter((column) => typeof column.accessorFn !== 'undefined' && column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      checked={column.getIsVisible()}
                      className='capitalize'
                      key={column.id}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size='sm' variant='outline'>
            <IconPlus />
            <span className='hidden lg:inline'>新增分区</span>
          </Button>
        </div>
      </div>
      <TabsContent
        className='relative flex flex-col gap-4 overflow-auto px-4 lg:px-6'
        value='outline'
      >
        <div className='overflow-hidden rounded-lg border'>
          <DndContext
            collisionDetection={closestCenter}
            id={sortableId}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
          >
            <Table>
              <TableHeader className='bg-muted sticky top-0 z-10'>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead colSpan={header.colSpan} key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className='**:data-[slot=table-cell]:first:w-8'>
                {table.getRowModel().rows?.length ? (
                  <SortableContext items={dataIds} strategy={verticalListSortingStrategy}>
                    {table.getRowModel().rows.map((row) => (
                      <DraggableRow key={row.id} row={row} />
                    ))}
                  </SortableContext>
                ) : (
                  <TableRow>
                    <TableCell className='h-24 text-center' colSpan={columns.length}>
                      暂无数据。
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>
        <div className='flex items-center justify-between px-4'>
          <div className='text-muted-foreground hidden flex-1 text-sm lg:flex'>
            已选择 {table.getFilteredSelectedRowModel().rows.length} /{' '}
            {table.getFilteredRowModel().rows.length} 行
          </div>
          <div className='flex w-full items-center gap-8 lg:w-fit'>
            <div className='hidden items-center gap-2 lg:flex'>
              <Label className='text-sm font-medium' htmlFor='rows-per-page'>
                每页行数
              </Label>
              <Select
                onValueChange={(value) => {
                  table.setPageSize(Number(value))
                }}
                value={`${table.getState().pagination.pageSize}`}
              >
                <SelectTrigger className='w-20' id='rows-per-page' size='sm'>
                  <SelectValue placeholder={table.getState().pagination.pageSize} />
                </SelectTrigger>
                <SelectContent side='top'>
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='flex w-fit items-center justify-center text-sm font-medium'>
              第 {table.getState().pagination.pageIndex + 1} 页，共 {table.getPageCount()} 页
            </div>
            <div className='ml-auto flex items-center gap-2 lg:ml-0'>
              <Button
                className='hidden h-8 w-8 p-0 lg:flex'
                disabled={!table.getCanPreviousPage()}
                onClick={() => table.setPageIndex(0)}
                variant='outline'
              >
                <span className='sr-only'>跳转到第一页</span>
                <IconChevronsLeft />
              </Button>
              <Button
                className='size-8'
                disabled={!table.getCanPreviousPage()}
                onClick={() => table.previousPage()}
                size='icon'
                variant='outline'
              >
                <span className='sr-only'>上一页</span>
                <IconChevronLeft />
              </Button>
              <Button
                className='size-8'
                disabled={!table.getCanNextPage()}
                onClick={() => table.nextPage()}
                size='icon'
                variant='outline'
              >
                <span className='sr-only'>下一页</span>
                <IconChevronRight />
              </Button>
              <Button
                className='hidden size-8 lg:flex'
                disabled={!table.getCanNextPage()}
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                size='icon'
                variant='outline'
              >
                <span className='sr-only'>跳转到最后一页</span>
                <IconChevronsRight />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
      <TabsContent className='flex flex-col px-4 lg:px-6' value='past-performance'>
        <div className='aspect-video w-full flex-1 rounded-lg border border-dashed'></div>
      </TabsContent>
      <TabsContent className='flex flex-col px-4 lg:px-6' value='key-personnel'>
        <div className='aspect-video w-full flex-1 rounded-lg border border-dashed'></div>
      </TabsContent>
      <TabsContent className='flex flex-col px-4 lg:px-6' value='focus-documents'>
        <div className='aspect-video w-full flex-1 rounded-lg border border-dashed'></div>
      </TabsContent>
    </Tabs>
  )
}

const chartData = [
  { desktop: 186, mobile: 80, month: 'January' },
  { desktop: 305, mobile: 200, month: 'February' },
  { desktop: 237, mobile: 120, month: 'March' },
  { desktop: 73, mobile: 190, month: 'April' },
  { desktop: 209, mobile: 130, month: 'May' },
  { desktop: 214, mobile: 140, month: 'June' },
]

const chartConfig = {
  desktop: {
    color: 'var(--primary)',
    label: '桌面端',
  },
  mobile: {
    color: 'var(--primary)',
    label: '移动端',
  },
} satisfies ChartConfig

function TableCellViewer({ item }: { item: z.infer<typeof schema> }) {
  const isMobile = useIsMobile()

  return (
    <Drawer direction={isMobile ? 'bottom' : 'right'}>
      <DrawerTrigger asChild>
        <Button className='text-foreground w-fit px-0 text-left' variant='link'>
          {item.header}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className='gap-1'>
          <DrawerTitle>{item.header}</DrawerTitle>
          <DrawerDescription>展示近 6 个月访问趋势</DrawerDescription>
        </DrawerHeader>
        <div className='flex flex-col gap-4 overflow-y-auto px-4 text-sm'>
          {!isMobile && (
            <>
              <ChartContainer config={chartConfig}>
                <AreaChart
                  accessibilityLayer
                  data={chartData}
                  margin={{
                    left: 0,
                    right: 10,
                  }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    axisLine={false}
                    dataKey='month'
                    hide
                    tickFormatter={(value) => value.slice(0, 3)}
                    tickLine={false}
                    tickMargin={8}
                  />
                  <ChartTooltip content={<ChartTooltipContent indicator='dot' />} cursor={false} />
                  <Area
                    dataKey='mobile'
                    fill='var(--color-mobile)'
                    fillOpacity={0.6}
                    stackId='a'
                    stroke='var(--color-mobile)'
                    type='natural'
                  />
                  <Area
                    dataKey='desktop'
                    fill='var(--color-desktop)'
                    fillOpacity={0.4}
                    stackId='a'
                    stroke='var(--color-desktop)'
                    type='natural'
                  />
                </AreaChart>
              </ChartContainer>
              <Separator />
              <div className='grid gap-2'>
                <div className='flex gap-2 leading-none font-medium'>
                  本月增长 5.2% <IconTrendingUp className='size-4' />
                </div>
                <div className='text-muted-foreground'>
                  这里展示最近六个月访问趋势，文案用于占位，验证抽屉在多行文本下的排版表现。
                </div>
              </div>
              <Separator />
            </>
          )}
          <form className='flex flex-col gap-4'>
            <div className='flex flex-col gap-3'>
              <Label htmlFor='header'>标题</Label>
              <Input defaultValue={item.header} id='header' />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div className='flex flex-col gap-3'>
                <Label htmlFor='type'>类型</Label>
                <Select defaultValue={item.type}>
                  <SelectTrigger className='w-full' id='type'>
                    <SelectValue placeholder='选择类型' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='Table of contents'>目录页</SelectItem>
                    <SelectItem value='Executive summary'>执行摘要</SelectItem>
                    <SelectItem value='Technical approach'>技术方案</SelectItem>
                    <SelectItem value='Design'>设计说明</SelectItem>
                    <SelectItem value='Capabilities'>能力介绍</SelectItem>
                    <SelectItem value='Focus Documents'>重点文档</SelectItem>
                    <SelectItem value='Narrative'>叙述文档</SelectItem>
                    <SelectItem value='Cover page'>封面页</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='flex flex-col gap-3'>
                <Label htmlFor='status'>状态</Label>
                <Select defaultValue={item.status}>
                  <SelectTrigger className='w-full' id='status'>
                    <SelectValue placeholder='选择状态' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='Done'>已完成</SelectItem>
                    <SelectItem value='In Process'>处理中</SelectItem>
                    <SelectItem value='Not Started'>未开始</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div className='flex flex-col gap-3'>
                <Label htmlFor='target'>目标</Label>
                <Input defaultValue={item.target} id='target' />
              </div>
              <div className='flex flex-col gap-3'>
                <Label htmlFor='limit'>上限</Label>
                <Input defaultValue={item.limit} id='limit' />
              </div>
            </div>
            <div className='flex flex-col gap-3'>
              <Label htmlFor='reviewer'>审核人</Label>
              <Select defaultValue={item.reviewer}>
                <SelectTrigger className='w-full' id='reviewer'>
                  <SelectValue placeholder='选择审核人' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='Eddie Lake'>Eddie Lake</SelectItem>
                  <SelectItem value='Jamik Tashpulatov'>Jamik Tashpulatov</SelectItem>
                  <SelectItem value='Emily Whalen'>Emily Whalen</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </form>
        </div>
        <DrawerFooter>
          <Button>保存</Button>
          <DrawerClose asChild>
            <Button variant='outline'>完成</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
