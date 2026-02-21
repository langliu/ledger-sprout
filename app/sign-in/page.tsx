"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useMemo, useState, type FormEvent } from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authClient } from "@/lib/auth-client"

const DEFAULT_CALLBACK_URL = "/dashboard"

function getErrorMessage(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message
  }

  return "登录失败，请稍后重试。"
}

export default function SignInPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackURL = useMemo(() => {
    return searchParams.get("callbackURL") ?? DEFAULT_CALLBACK_URL
  }, [searchParams])

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isEmailLoading, setIsEmailLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  const handleEmailSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(null)
    setIsEmailLoading(true)

    try {
      const result = await authClient.signIn.email({
        email,
        password,
        callbackURL,
      })

      if (result.error) {
        setErrorMessage(result.error.message ?? "邮箱或密码不正确。")
        return
      }

      router.push(callbackURL)
      router.refresh()
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsEmailLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setErrorMessage(null)
    setIsGoogleLoading(true)

    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL,
      })
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-muted/20 px-4 py-8 sm:py-12">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,oklch(0.97_0_0),transparent_55%)]" />
      <div className="mx-auto grid w-full max-w-5xl gap-4 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
        <Card className="border-border/60 hidden lg:block">
          <CardHeader>
            <CardTitle className="text-2xl">登录账芽</CardTitle>
            <CardDescription>登录后即可查看账本、流水和报表分析。</CardDescription>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-3 text-sm">
            <p>1. 首次登录会自动创建默认账本与分类。</p>
            <p>2. 支持账户管理、分类管理、流水编辑与报表分析。</p>
            <p>3. 记账时间支持精确到分钟，筛选支持按天回溯。</p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="ghost" className="px-0">
              <Link href="/">返回首页</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="w-full">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">账号登录</CardTitle>
            <CardDescription>
              使用邮箱密码或 Google 账号登录，继续记录你的收支。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleEmailSignIn}>
              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value)
                  }}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="请输入密码"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value)
                  }}
                  required
                />
              </div>
              <Button className="w-full" type="submit" disabled={isEmailLoading}>
                {isEmailLoading ? <Loader2 className="size-4 animate-spin" /> : null}
                邮箱登录
              </Button>
            </form>
            <div className="text-muted-foreground my-4 flex items-center gap-3 text-xs">
              <div className="bg-border h-px flex-1" />
              <span>或</span>
              <div className="bg-border h-px flex-1" />
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
            >
              {isGoogleLoading ? <Loader2 className="size-4 animate-spin" /> : null}
              使用 Google 登录
            </Button>
            {errorMessage ? (
              <p className="text-destructive mt-4 text-sm">{errorMessage}</p>
            ) : null}
          </CardContent>
          <CardFooter className="text-muted-foreground flex flex-wrap justify-between gap-2 text-xs">
            <span>登录即表示你同意应用的使用条款与隐私政策。</span>
            <Button asChild variant="link" className="h-auto p-0 text-xs">
              <Link href="/">返回首页</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
