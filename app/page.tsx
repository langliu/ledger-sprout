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
  { day: '一', height: 38, id: 'bar-mon' },
  { day: '二', height: 54, id: 'bar-tue' },
  { day: '三', height: 46, id: 'bar-wed' },
  { day: '四', height: 70, id: 'bar-thu' },
  { day: '五', height: 57, id: 'bar-fri' },
  { day: '六', height: 63, id: 'bar-sat' },
  { day: '日', height: 82, id: 'bar-sun' },
] as const

const footerPrimaryLinks = [
  { href: '/sign-in', label: '开始记账' },
  { href: '/dashboard', label: '我的账本' },
  { href: '/reports', label: '查看报表' },
] as const

const footerFeaturePills = [
  '默认账本自动创建',
  '按天回溯流水',
  '月度报表复盘',
  '登录回跳保护',
] as const

export default function HomePage() {
  const currentYear = new Date().getFullYear()

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

        <div className='grid items-start gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-10'>
          <div className='max-w-4xl'>
            <Badge
              className='animate-in fade-in-0 slide-in-from-bottom-3 border-amber-700/20 bg-amber-50 text-[13px] font-medium tracking-[0.01em] text-amber-800 duration-700'
              variant='outline'
            >
              账芽 · 慢慢记，慢慢长
            </Badge>
            <p
              className='animate-in fade-in-0 slide-in-from-bottom-4 mt-5 text-[13px] tracking-[0.08em] text-amber-700/85 duration-700'
              style={{ animationDelay: '70ms', animationFillMode: 'both' }}
            >
              LEDGER SPROUT
            </p>
            <h1
              className='animate-in fade-in-0 slide-in-from-bottom-5 mt-3 max-w-4xl text-4xl font-semibold tracking-tight text-zinc-900 duration-700 text-balance sm:text-5xl lg:text-[4.35rem]'
              style={{ animationDelay: '90ms', animationFillMode: 'both' }}
            >
              <span className='block leading-[1.02]'>账芽 ·</span>
              <span className='mt-2 block leading-[0.98] text-zinc-900/95'>慢慢记，慢慢长</span>
            </h1>
            <p
              className='animate-in fade-in-0 slide-in-from-bottom-5 mt-6 max-w-2xl text-base leading-8 text-zinc-700 duration-700 sm:text-lg sm:leading-8'
              style={{ animationDelay: '170ms', animationFillMode: 'both' }}
            >
              账芽把「记录、分类、复盘」串成一条轻松路径。今天记下一笔，月底就能更从容地安排下一步。
            </p>
            <div
              className='animate-in fade-in-0 slide-in-from-bottom-5 mt-8 flex flex-col gap-4 sm:flex-row sm:items-end duration-700'
              style={{ animationDelay: '250ms', animationFillMode: 'both' }}
            >
              <div className='space-y-1.5'>
                <Button
                  asChild
                  className='h-11 min-w-[11.5rem] rounded-xl bg-amber-700 px-5 text-[15px] font-medium tracking-[0.01em] hover:bg-amber-800'
                >
                  <Link className='inline-flex items-baseline gap-2' href='/sign-in'>
                    <span className='leading-none'>开始今天第一笔</span>
                    <ArrowRight className='relative top-px size-4' />
                  </Link>
                </Button>
                <p className='pl-1 text-[11px] text-zinc-500'>30 秒完成开账准备</p>
              </div>
              <div className='space-y-1.5'>
                <Button
                  asChild
                  className='h-11 min-w-[11.5rem] rounded-xl border-rose-900/20 bg-rose-50 px-5 text-[15px] font-medium tracking-[0.01em] text-rose-900 hover:bg-rose-100'
                  variant='outline'
                >
                  <Link className='inline-flex items-baseline leading-none' href='/dashboard'>
                    去看看我的账本
                  </Link>
                </Button>
                <p className='pl-1 text-[11px] text-zinc-500'>先看本月收支结构</p>
              </div>
            </div>
            <div
              className='animate-in fade-in-0 slide-in-from-bottom-5 mt-6 flex flex-wrap items-center gap-2 duration-700'
              style={{ animationDelay: '320ms', animationFillMode: 'both' }}
            >
              {['默认账本自动创建', '按天回溯流水', '月度报表复盘'].map((item) => (
                <span
                  className='rounded-full border border-amber-200/70 bg-white/70 px-3 py-1 text-xs text-zinc-700'
                  key={item}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <Card
            className='animate-in fade-in-0 slide-in-from-right-6 border-amber-900/10 bg-white/85 pt-0 shadow-sm backdrop-blur duration-700 lg:mt-2'
            style={{ animationDelay: '220ms', animationFillMode: 'both' }}
          >
            <CardHeader className='border-b border-amber-900/8 py-4'>
              <div className='flex items-start justify-between gap-3'>
                <CardTitle className='flex items-center gap-2 text-base'>
                  <Sparkles className='size-4 text-amber-500' />
                  这个月的你
                </CardTitle>
                <span className='rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700'>
                  结余 +¥3,920
                </span>
              </div>
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

              <div className='rounded-xl border border-amber-100/80 bg-amber-50/50 p-3'>
                <p className='text-[11px] text-zinc-500'>近 7 天支出趋势</p>
                <div className='mt-3 grid grid-cols-7 gap-1.5'>
                  {sparklineBars.map((bar) => (
                    <div className='flex flex-col items-center gap-1' key={bar.id}>
                      <div className='flex h-16 w-full items-end rounded-md bg-white/80 p-1'>
                        <div
                          className='w-full rounded-[3px] bg-[linear-gradient(180deg,#b56a2d_0%,#e6a35f_100%)]'
                          style={{ height: `${bar.height}%` }}
                        />
                      </div>
                      <span className='text-[10px] text-zinc-500'>{bar.day}</span>
                    </div>
                  ))}
                </div>
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

      <section className='mx-auto w-full max-w-6xl px-4 pb-18 sm:px-6 lg:pb-24'>
        <Card className='relative overflow-hidden border-zinc-900/10 bg-[linear-gradient(140deg,rgba(255,251,245,0.95)_0%,rgba(255,244,231,0.93)_50%,rgba(251,252,248,0.92)_100%)] shadow-[0_12px_36px_-20px_rgba(150,108,46,0.35)]'>
          <div className='pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-[radial-gradient(circle,rgba(244,185,120,0.32),transparent_65%)] blur-2xl' />
          <div className='pointer-events-none absolute -left-20 bottom-0 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(228,150,114,0.2),transparent_70%)] blur-2xl' />
          <CardHeader className='relative space-y-3 pb-4'>
            <Badge
              className='w-fit border-amber-700/20 bg-amber-50/80 text-[11px] tracking-[0.06em] text-amber-800'
              variant='outline'
            >
              DAILY RHYTHM
            </Badge>
            <CardTitle className='text-3xl leading-[1.15] sm:text-4xl'>
              从今天开始，慢慢把日子记清楚
            </CardTitle>
            <CardDescription className='max-w-2xl text-base leading-7 text-zinc-600'>
              不追求一次做满，只追求每天都愿意打开它。
            </CardDescription>
          </CardHeader>
          <CardContent className='relative grid gap-4 lg:grid-cols-3'>
            {processSteps.map((item, index) => (
              <article
                className='group animate-in fade-in-0 slide-in-from-bottom-5 rounded-2xl border border-zinc-900/10 bg-white/78 p-5 shadow-[0_1px_0_rgba(255,255,255,0.8)] backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:bg-white/95 hover:shadow-[0_14px_28px_-18px_rgba(90,67,39,0.45)]'
                key={item.step}
                style={{ animationDelay: `${140 + index * 120}ms`, animationFillMode: 'both' }}
              >
                <div className='mb-3 flex items-center justify-between'>
                  <span className='inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold tracking-[0.08em] text-amber-800'>
                    {item.step}
                  </span>
                  <span className='h-px w-14 bg-gradient-to-r from-amber-300/80 to-transparent' />
                </div>
                <h3 className='text-2xl leading-tight font-semibold text-zinc-900 transition-colors duration-300 group-hover:text-amber-800'>
                  {item.title}
                </h3>
                <p className='mt-3 text-base leading-8 text-zinc-700'>{item.body}</p>
              </article>
            ))}
          </CardContent>
        </Card>
      </section>

      <footer className='border-t border-amber-900/10 bg-[linear-gradient(180deg,rgba(255,248,238,0.9)_0%,rgba(255,255,255,0.92)_100%)]'>
        <div className='mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:gap-10'>
          <div className='space-y-5'>
            <div className='flex items-center gap-2 text-sm font-semibold tracking-wide text-zinc-900'>
              <Leaf className='size-4 text-amber-700' />
              <span>账芽 Ledger Sprout</span>
            </div>
            <p className='max-w-xl text-sm leading-7 text-zinc-700 sm:text-base'>
              账芽 · 慢慢记，慢慢长。用温柔但清晰的方式，陪你记录每一笔支出。
            </p>
            <div className='flex flex-wrap gap-2'>
              {footerFeaturePills.map((item) => (
                <span
                  className='rounded-full border border-amber-200/70 bg-white/75 px-3 py-1 text-xs text-zinc-700'
                  key={item}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className='grid gap-6 sm:grid-cols-2'>
            <div className='space-y-3'>
              <p className='text-xs tracking-[0.08em] text-zinc-500'>快速入口</p>
              <ul className='space-y-2'>
                {footerPrimaryLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      className='text-sm text-zinc-700 transition-colors hover:text-amber-700'
                      href={link.href}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className='space-y-3'>
              <p className='text-xs tracking-[0.08em] text-zinc-500'>产品定位</p>
              <p className='text-sm leading-7 text-zinc-700'>
                面向个人用户的轻量记账工具，围绕“记录-分类-复盘”构建长期可持续的财务习惯。
              </p>
            </div>
          </div>
        </div>

        <div className='border-t border-amber-900/10'>
          <div className='mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-4 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:px-6'>
            <p>© {currentYear} Ledger Sprout. All rights reserved.</p>
            <p>Built with Next.js 16 · React 19 · Convex</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
