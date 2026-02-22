"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState, type FormEvent } from "react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { authClient } from "@/lib/auth-client"
import { normalizeCallbackURL } from "@/lib/auth-redirect"

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

function toDisplayName(name: string, email: string) {
  const trimmedName = name.trim()
  if (trimmedName.length > 0) {
    return trimmedName
  }
  const prefix = email.trim().split("@")[0] ?? ""
  return prefix.length > 0 ? prefix : "账芽用户"
}

export default function SignInPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, isPending: isSessionPending } = authClient.useSession()

  const callbackURL = useMemo(() => {
    return normalizeCallbackURL(searchParams.get("callbackURL"))
  }, [searchParams])

  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [registerName, setRegisterName] = useState("")
  const [registerEmail, setRegisterEmail] = useState("")
  const [registerPassword, setRegisterPassword] = useState("")
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isEmailLoading, setIsEmailLoading] = useState(false)
  const [isSignUpLoading, setIsSignUpLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  useEffect(() => {
    if (isSessionPending || !session) {
      return
    }

    router.replace(callbackURL)
    router.refresh()
  }, [callbackURL, isSessionPending, router, session])

  const handleEmailSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(null)
    setIsEmailLoading(true)

    try {
      const result = await authClient.signIn.email({
        email: loginEmail,
        password: loginPassword,
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

  const handleEmailSignUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(null)

    if (registerPassword.length < 8) {
      setErrorMessage("密码长度至少为 8 位。")
      return
    }
    if (registerPassword !== registerConfirmPassword) {
      setErrorMessage("两次输入的密码不一致。")
      return
    }

    setIsSignUpLoading(true)

    try {
      const result = await authClient.signUp.email({
        name: toDisplayName(registerName, registerEmail),
        email: registerEmail,
        password: registerPassword,
        callbackURL,
      })

      if (result.error) {
        setErrorMessage(result.error.message ?? "注册失败，请稍后重试。")
        return
      }

      router.push(callbackURL)
      router.refresh()
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsSignUpLoading(false)
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

  if (!isSessionPending && session) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <p className="text-sm text-muted-foreground">正在跳转到 {callbackURL}...</p>
      </div>
    )
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
            <p>1. 首次注册会自动创建默认账本与分类。</p>
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
            <CardTitle className="text-2xl">账号入口</CardTitle>
            <CardDescription>
              使用邮箱密码登录或注册，也可使用 Google 账号直接继续。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="sign-in" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="sign-in">登录</TabsTrigger>
                <TabsTrigger value="sign-up">注册</TabsTrigger>
              </TabsList>

              <TabsContent value="sign-in" className="space-y-4">
                <form className="space-y-4" onSubmit={handleEmailSignIn}>
                  <div className="space-y-2">
                    <Label htmlFor="signInEmail">邮箱</Label>
                    <Input
                      id="signInEmail"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={loginEmail}
                      onChange={(event) => {
                        setLoginEmail(event.target.value)
                      }}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signInPassword">密码</Label>
                    <Input
                      id="signInPassword"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      placeholder="请输入密码"
                      value={loginPassword}
                      onChange={(event) => {
                        setLoginPassword(event.target.value)
                      }}
                      required
                    />
                  </div>
                  <Button className="w-full" type="submit" disabled={isEmailLoading}>
                    {isEmailLoading ? <Loader2 className="size-4 animate-spin" /> : null}
                    邮箱登录
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="sign-up" className="space-y-4">
                <form className="space-y-4" onSubmit={handleEmailSignUp}>
                  <div className="space-y-2">
                    <Label htmlFor="signUpName">昵称（可选）</Label>
                    <Input
                      id="signUpName"
                      name="name"
                      type="text"
                      autoComplete="name"
                      placeholder="例如：小李"
                      value={registerName}
                      onChange={(event) => {
                        setRegisterName(event.target.value)
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signUpEmail">邮箱</Label>
                    <Input
                      id="signUpEmail"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={registerEmail}
                      onChange={(event) => {
                        setRegisterEmail(event.target.value)
                      }}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signUpPassword">密码</Label>
                    <Input
                      id="signUpPassword"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      placeholder="至少 8 位"
                      value={registerPassword}
                      onChange={(event) => {
                        setRegisterPassword(event.target.value)
                      }}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signUpConfirmPassword">确认密码</Label>
                    <Input
                      id="signUpConfirmPassword"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      placeholder="再次输入密码"
                      value={registerConfirmPassword}
                      onChange={(event) => {
                        setRegisterConfirmPassword(event.target.value)
                      }}
                      required
                    />
                  </div>
                  <Button className="w-full" type="submit" disabled={isSignUpLoading}>
                    {isSignUpLoading ? <Loader2 className="size-4 animate-spin" /> : null}
                    邮箱注册
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

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
