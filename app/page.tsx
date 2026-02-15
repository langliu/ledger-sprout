import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-muted/20 px-4">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,oklch(0.97_0_0),transparent_55%)]" />
      <section className="bg-card text-card-foreground w-full max-w-xl rounded-xl border p-8 shadow-sm">
        <p className="text-muted-foreground text-sm">账芽</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">慢慢记，慢慢长</h1>
        <p className="text-muted-foreground mt-3 text-sm leading-6">
          轻量、温和的记账体验，先从每天一笔开始。
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/sign-in">去登录</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">进入控制台</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
