import { ArrowRight, ChartNoAxesCombined, Leaf, ShieldCheck, Sparkles, Wallet } from 'lucide-react'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const highlightMetrics = [
  {
    accentClass: 'from-amber-500 to-orange-400',
    chipClass: 'border-amber-200/80 bg-amber-50 text-amber-700',
    label: '开账准备',
    note: '首次登录后，默认账本与分类会自动就位。',
    progressClass: 'w-[42%]',
    trackClass: 'bg-amber-100',
    value: '30 秒',
  },
  {
    accentClass: 'from-rose-500 to-orange-400',
    chipClass: 'border-rose-200/80 bg-rose-50 text-rose-700',
    label: '日常记录',
    note: '记录一笔流水平均只需选择分类、账户、金额。',
    progressClass: 'w-[74%]',
    trackClass: 'bg-rose-100',
    value: '3 步完成',
  },
  {
    accentClass: 'from-emerald-500 to-teal-400',
    chipClass: 'border-emerald-200/80 bg-emerald-50 text-emerald-700',
    label: '数据同步',
    note: '余额变化与报表联动更新，复盘无需重复计算。',
    progressClass: 'w-[88%]',
    trackClass: 'bg-emerald-100',
    value: '实时更新',
  },
] as const

const features = [
  {
    description: '把账本、账户、分类梳理清楚，让每一笔钱都有安放的位置。',
    icon: Wallet,
    title: '清晰地记',
  },
  {
    description: '按月看看收入和支出走向，花钱习惯的变化自然会浮现出来。',
    icon: ChartNoAxesCombined,
    title: '温和地看趋势',
  },
  {
    description: '内置会话鉴权与回跳保护，登录流程稳定，使用过程更安心。',
    icon: ShieldCheck,
    title: '安心地用',
  },
] as const

const processSteps = [
  {
    body: '第一次进入会自动生成默认账本和分类，让你不用纠结，从记录开始。',
    step: '01',
    title: '先把根扎下去',
  },
  {
    body: '流水可精确到分钟，账户余额会同步变化，记完就能看到真实状态。',
    step: '02',
    title: '每天记一小步',
  },
  {
    body: '在报表里按日期回看，慢慢找到最值得优化的那几类开销。',
    step: '03',
    title: '每月看见成长',
  },
] as const

const sparklineBars = [
  { height: 38, id: 'bar-mon' },
  { height: 54, id: 'bar-tue' },
  { height: 46, id: 'bar-wed' },
  { height: 70, id: 'bar-thu' },
  { height: 57, id: 'bar-fri' },
  { height: 63, id: 'bar-sat' },
  { height: 82, id: 'bar-sun' },
] as const

export default function HomePage() {
  return (
    <main className='relative isolate overflow-hidden bg-[linear-gradient(180deg,#fff7ed_0%,#fffaf3_45%,#ffffff_100%)]'>
      <div className='pointer-events-none absolute inset-0 -z-10'>
        <div className='absolute -top-24 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(248,183,117,0.33),transparent_65%)] blur-3xl' />
        <div className='absolute right-[-8rem] top-1/3 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(234,130,105,0.22),transparent_62%)] blur-3xl' />
        <div className='absolute bottom-0 left-[-10rem] h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(209,178,118,0.22),transparent_65%)] blur-3xl' />
      </div>

      <section className='mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pb-20 sm:pt-10 lg:pb-24'>
        <header className='animate-in fade-in-0 slide-in-from-top-3 mb-10 flex items-center justify-between duration-700'>
          <div className='flex items-center gap-2 text-sm font-medium tracking-wide'>
            <Leaf className='size-4 text-amber-700' />
            <span>账芽 Ledger Sprout</span>
          </div>
          <Button asChild size='sm' variant='ghost'>
            <Link href='/sign-in'>登录</Link>
          </Button>
        </header>

        <div className='grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-8'>
          <div>
            <Badge
              className='animate-in fade-in-0 slide-in-from-bottom-3 border-amber-700/20 bg-amber-50 text-amber-800 duration-700'
              variant='outline'
            >
              温柔记账体验 · Next.js 16 + Convex
            </Badge>
            <h1
              className='animate-in fade-in-0 slide-in-from-bottom-5 mt-4 text-4xl leading-tight font-semibold tracking-tight text-zinc-900 duration-700 sm:text-5xl lg:text-6xl'
              style={{ animationDelay: '90ms', animationFillMode: 'both' }}
            >
              像照料一株小苗那样
              <br />
              让你的财务慢慢长好
            </h1>
            <p
              className='animate-in fade-in-0 slide-in-from-bottom-5 mt-5 max-w-2xl text-sm leading-7 text-zinc-700 duration-700 sm:text-base'
              style={{ animationDelay: '170ms', animationFillMode: 'both' }}
            >
              账芽把「记录、分类、复盘」串成一条轻松路径。今天记下一笔，月底就能更从容地安排下一步。
            </p>
            <div
              className='animate-in fade-in-0 slide-in-from-bottom-5 mt-7 flex flex-col gap-3 sm:flex-row duration-700'
              style={{ animationDelay: '250ms', animationFillMode: 'both' }}
            >
              <Button asChild className='h-10 bg-amber-700 hover:bg-amber-800'>
                <Link href='/sign-in'>
                  开始今天第一笔
                  <ArrowRight className='size-4' />
                </Link>
              </Button>
              <Button
                asChild
                className='h-10 border-rose-900/20 bg-rose-50 text-rose-900 hover:bg-rose-100'
                variant='outline'
              >
                <Link href='/dashboard'>去看看我的账本</Link>
              </Button>
            </div>
          </div>

          <Card
            className='animate-in fade-in-0 slide-in-from-right-6 border-amber-900/10 bg-white/80 pt-0 backdrop-blur duration-700'
            style={{ animationDelay: '220ms', animationFillMode: 'both' }}
          >
            <CardHeader className='border-b border-amber-900/8 py-4'>
              <CardTitle className='flex items-center gap-2 text-base'>
                <Sparkles className='size-4 text-amber-500' />
                这个月的你
              </CardTitle>
              <CardDescription>收入和支出在慢慢变清晰</CardDescription>
            </CardHeader>
            <CardContent className='space-y-5 py-5'>
              <div className='space-y-3'>
                <div className='flex items-center justify-between text-xs text-zinc-600'>
                  <span>收入</span>
                  <span className='font-semibold text-amber-700'>+ ¥12,860</span>
                </div>
                <div className='h-2 rounded-full bg-amber-100'>
                  <div className='h-2 w-[72%] rounded-full bg-amber-600' />
                </div>
                <div className='flex items-center justify-between text-xs text-zinc-600'>
                  <span>支出</span>
                  <span className='font-semibold text-rose-700'>- ¥8,940</span>
                </div>
                <div className='h-2 rounded-full bg-rose-100'>
                  <div className='h-2 w-[51%] rounded-full bg-rose-500' />
                </div>
              </div>

              <div className='grid grid-cols-3 gap-2'>
                {sparklineBars.map((bar) => (
                  <div className='space-y-1' key={bar.id}>
                    <div className='h-16 rounded-lg bg-zinc-100 px-2 pt-2'>
                      <div
                        className='rounded-sm bg-[linear-gradient(180deg,#b56a2d_0%,#e6a35f_100%)]'
                        style={{ height: `${bar.height}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className='mx-auto grid w-full max-w-6xl gap-3 px-4 pb-12 sm:grid-cols-3 sm:px-6 lg:pb-16'>
        {highlightMetrics.map((item, index) => (
          <Card
            className='animate-in fade-in-0 slide-in-from-bottom-5 overflow-hidden border-amber-900/10 bg-white/85 p-0 backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md'
            key={item.label}
            style={{ animationDelay: `${120 + index * 90}ms`, animationFillMode: 'both' }}
          >
            <div className={`h-1 w-full bg-gradient-to-r ${item.accentClass}`} />
            <CardContent className='space-y-4 px-6 py-5 sm:px-7'>
              <div className='flex items-start justify-between gap-3'>
                <div>
                  <p className='text-3xl font-semibold text-zinc-900'>{item.value}</p>
                  <p className='mt-1 text-sm text-zinc-600'>{item.label}</p>
                </div>
                <span
                  className={`rounded-full border px-2 py-1 text-xs font-medium whitespace-nowrap ${item.chipClass}`}
                >
                  核心能力
                </span>
              </div>
              <p className='text-sm leading-6 text-zinc-700'>{item.note}</p>
              <div className={`h-2 rounded-full ${item.trackClass}`}>
                <div
                  className={`h-2 rounded-full bg-gradient-to-r ${item.accentClass} ${item.progressClass}`}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className='mx-auto w-full max-w-6xl px-4 pb-12 sm:px-6 lg:pb-16'>
        <div className='mb-5 max-w-3xl'>
          <h2 className='text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl'>
            温暖但不失秩序的记账体验
          </h2>
          <p className='mt-2 text-sm leading-7 text-zinc-700 sm:text-base'>
            少一点负担，多一点陪伴。你负责认真生活，账芽负责帮你整理脉络。
          </p>
        </div>
        <div className='grid gap-3 lg:grid-cols-3'>
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card
                className='animate-in fade-in-0 slide-in-from-bottom-5 border-zinc-900/10 bg-white/80 p-0 backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md'
                key={feature.title}
                style={{ animationDelay: `${90 + index * 100}ms`, animationFillMode: 'both' }}
              >
                <CardContent className='h-full px-6 py-5 sm:px-7'>
                  <div className='mb-3 flex items-center gap-3'>
                    <span className='inline-flex size-8 items-center justify-center rounded-full bg-amber-100/80 text-amber-700'>
                      <Icon className='size-4' />
                    </span>
                    <CardTitle className='text-xl text-zinc-900'>{feature.title}</CardTitle>
                  </div>
                  <p className='text-base leading-8 text-zinc-700'>{feature.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      <section className='mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 lg:pb-24'>
        <Card className='border-zinc-900/10 bg-[linear-gradient(140deg,rgba(250,252,247,0.9)_0%,rgba(255,246,236,0.92)_100%)]'>
          <CardHeader>
            <CardTitle className='text-2xl leading-tight sm:text-3xl'>
              从今天开始，慢慢把日子记清楚
            </CardTitle>
            <CardDescription>不追求一次做满，只追求每天都愿意打开它。</CardDescription>
          </CardHeader>
          <CardContent className='grid gap-4 lg:grid-cols-3'>
            {processSteps.map((item, index) => (
              <article
                className='animate-in fade-in-0 slide-in-from-bottom-5 rounded-lg border border-zinc-900/10 bg-white/70 p-4 duration-700'
                key={item.step}
                style={{ animationDelay: `${140 + index * 120}ms`, animationFillMode: 'both' }}
              >
                <p className='text-xs tracking-widest text-amber-700'>{item.step}</p>
                <h3 className='mt-2 text-lg font-semibold text-zinc-900'>{item.title}</h3>
                <p className='mt-2 text-sm leading-6 text-zinc-700'>{item.body}</p>
              </article>
            ))}
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
