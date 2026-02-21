import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-muted/20 px-4 py-8 sm:py-12">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,oklch(0.97_0_0),transparent_55%)]" />
      <div className="absolute inset-y-0 right-0 -z-10 hidden w-2/5 bg-[linear-gradient(180deg,oklch(0.99_0_0),oklch(0.96_0_0))] lg:block" />

      <section className="mx-auto grid w-full max-w-5xl gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <Card className="border-border/60">
          <CardContent className="space-y-6 p-8 sm:p-10">
            <p className="text-muted-foreground text-sm">账芽 · Ledger Sprout</p>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">慢慢记，慢慢长</h1>
              <p className="text-muted-foreground max-w-xl text-sm leading-6 sm:text-base">
                轻量、温和的记账体验，先从每天一笔开始。记录清晰、分类明确、趋势直观。
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <Link href="/sign-in">去登录</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard">进入控制台</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">今天就能开始</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-2 text-sm">
              <p>1. 登录后自动生成默认账本与分类</p>
              <p>2. 新增流水时支持到分钟的时间记录</p>
              <p>3. 账户余额与报表趋势实时联动</p>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">适合长期使用</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-2 text-sm">
              <p>账本、账户、分类全部可控。</p>
              <p>支持按天筛选流水，定位问题更快。</p>
              <p>月度报表帮助你看清收支结构。</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}
