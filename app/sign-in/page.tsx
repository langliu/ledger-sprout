'use client'

import { ArrowRight, Clock3, Leaf, Loader2, ShieldCheck, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { authClient } from '@/lib/auth-client'
import { normalizeCallbackURL } from '@/lib/auth-redirect'

function getErrorMessage(error: unknown) {
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message
  }

  return '登录失败，请稍后重试。'
}

function toDisplayName(name: string, email: string) {
  const trimmedName = name.trim()
  if (trimmedName.length > 0) {
    return trimmedName
  }
  const prefix = email.trim().split('@')[0] ?? ''
  return prefix.length > 0 ? prefix : '账芽用户'
}

export default function SignInPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, isPending: isSessionPending } = authClient.useSession()
  const isLogoutEntry = searchParams.get('logout') === '1'
  const skipAutoRedirectRef = useRef(isLogoutEntry)

  const callbackURL = useMemo(() => {
    return normalizeCallbackURL(searchParams.get('callbackURL'))
  }, [searchParams])

  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [registerName, setRegisterName] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isEmailLoading, setIsEmailLoading] = useState(false)
  const [isSignUpLoading, setIsSignUpLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  useEffect(() => {
    if (!isLogoutEntry) {
      return
    }

    skipAutoRedirectRef.current = true
    let disposed = false

    void authClient
      .signOut()
      .catch((error) => {
        if (process.env.NODE_ENV !== 'production') {
          console.error('Sign out request failed:', error)
        }
      })
      .finally(() => {
        if (disposed) {
          return
        }
        router.replace('/sign-in')
        router.refresh()
      })

    return () => {
      disposed = true
    }
  }, [isLogoutEntry, router])

  useEffect(() => {
    if (skipAutoRedirectRef.current || isSessionPending || !session) {
      return
    }

    let disposed = false

    void authClient
      .getSession()
      .then((result) => {
        if (disposed) {
          return
        }
        if (!result.data) {
          return
        }
        router.replace(callbackURL)
        router.refresh()
      })
      .catch(() => {
        // Keep users on sign-in if session revalidation fails.
      })

    return () => {
      disposed = true
    }
  }, [callbackURL, isSessionPending, router, session])

  const handleEmailSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)
    setIsEmailLoading(true)

    try {
      const result = await authClient.signIn.email({
        callbackURL,
        email: loginEmail,
        password: loginPassword,
      })

      if (result.error) {
        setErrorMessage(result.error.message ?? '邮箱或密码不正确。')
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
    setSuccessMessage(null)

    if (registerPassword.length < 8) {
      setErrorMessage('密码长度至少为 8 位。')
      return
    }
    if (registerPassword !== registerConfirmPassword) {
      setErrorMessage('两次输入的密码不一致。')
      return
    }

    setIsSignUpLoading(true)

    try {
      const result = await authClient.signUp.email({
        callbackURL,
        email: registerEmail,
        name: toDisplayName(registerName, registerEmail),
        password: registerPassword,
      })

      if (result.error) {
        setErrorMessage(result.error.message ?? '注册失败，请稍后重试。')
        return
      }

      setSuccessMessage('注册成功！一封验证邮件已发送到您的邮箱，请点击邮件中的链接完成注册。')
      setRegisterPassword('')
      setRegisterConfirmPassword('')
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsSignUpLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setErrorMessage(null)
    setSuccessMessage(null)
    setIsGoogleLoading(true)

    try {
      await authClient.signIn.social({
        callbackURL,
        provider: 'google',
      })
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
      setIsGoogleLoading(false)
    }
  }

  if (isLogoutEntry) {
    return (
      <div className='relative flex min-h-screen items-center justify-center overflow-hidden bg-[linear-gradient(180deg,#fff7ed_0%,#fffef8_55%,#ffffff_100%)] px-4'>
        <div className='pointer-events-none absolute inset-0 -z-10'>
          <div className='absolute -top-28 left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(244,165,96,0.28),transparent_66%)] blur-3xl' />
          <div className='absolute bottom-0 right-[-8rem] h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(56,189,149,0.2),transparent_62%)] blur-3xl' />
        </div>
        <div className='rounded-2xl border border-amber-200/70 bg-white/90 px-6 py-5 shadow-lg backdrop-blur-sm'>
          <p className='text-sm font-medium tracking-wide text-zinc-700'>正在退出登录...</p>
        </div>
      </div>
    )
  }

  return (
    <div className='relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#fff8ef_0%,#fffdf7_48%,#ffffff_100%)] px-4 py-8 sm:py-12'>
      <div className='pointer-events-none absolute inset-0 -z-20 bg-[repeating-linear-gradient(120deg,rgba(180,83,9,0.03),rgba(180,83,9,0.03)_16px,transparent_16px,transparent_40px)]' />
      <div className='pointer-events-none absolute inset-0 -z-10'>
        <div className='absolute -top-28 left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(244,165,96,0.28),transparent_66%)] blur-3xl' />
        <div className='absolute left-[-9rem] top-1/3 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(251,191,36,0.18),transparent_62%)] blur-3xl' />
        <div className='absolute bottom-[-8rem] right-[-8rem] h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.2),transparent_64%)] blur-3xl' />
      </div>

      <div className='mx-auto grid w-full max-w-6xl items-stretch gap-5 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:gap-6'>
        <Card className='hidden overflow-hidden border-amber-200/70 bg-white/82 shadow-lg backdrop-blur-sm lg:block'>
          <CardHeader className='space-y-5 border-b border-amber-100/80 pb-6'>
            <div className='inline-flex w-fit items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700'>
              <Leaf className='size-3.5' />
              账芽 Ledger Sprout
            </div>
            <div className='space-y-3'>
              <CardTitle className='text-4xl leading-tight tracking-tight text-zinc-900'>
                账芽 · 慢慢记
                <br className='hidden xl:block' />
                慢慢长
              </CardTitle>
              <CardDescription className='max-w-md text-base leading-7 text-zinc-600'>
                今天记一笔，月底看趋势。账芽把记录、筛选、复盘串成一条轻负担的路径。
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className='space-y-4 pt-6'>
            <div className='rounded-xl border border-amber-100 bg-amber-50/80 p-4'>
              <p className='mb-2 flex items-center gap-2 text-sm font-semibold text-amber-700'>
                <Clock3 className='size-4' />
                低门槛开始
              </p>
              <p className='text-sm leading-6 text-zinc-700'>
                首次注册自动创建默认账本与分类，通常 30 秒内就能完成第一笔记录。
              </p>
            </div>
            <div className='rounded-xl border border-emerald-100 bg-emerald-50/80 p-4'>
              <p className='mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-700'>
                <ShieldCheck className='size-4' />
                稳定登录态
              </p>
              <p className='text-sm leading-6 text-zinc-700'>
                登录态与回跳已优化，退出后可稳定停留登录页，流程更可预期。
              </p>
            </div>
            <div className='rounded-xl border border-teal-100 bg-teal-50/80 p-4'>
              <p className='mb-2 flex items-center gap-2 text-sm font-semibold text-teal-700'>
                <Sparkles className='size-4' />
                持续复盘
              </p>
              <p className='text-sm leading-6 text-zinc-700'>
                流水、账户、报表同源联动，帮助你每月更快定位真正值得优化的开销。
              </p>
            </div>
          </CardContent>
          <CardFooter className='pt-2'>
            <Button
              asChild
              className='group h-10 rounded-lg px-4 text-zinc-700 hover:text-zinc-900'
              variant='ghost'
            >
              <Link className='inline-flex items-center gap-1.5' href='/'>
                返回首页
                <ArrowRight className='size-4 transition-transform group-hover:translate-x-0.5' />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className='overflow-hidden border-amber-200/70 bg-white/90 shadow-xl backdrop-blur-sm'>
          <CardHeader className='space-y-4 border-b border-amber-100/80 pb-6'>
            <div className='inline-flex w-fit items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700'>
              <Leaf className='size-3.5' />
              账芽 · 慢慢记，慢慢长
            </div>
            <div className='space-y-1'>
              <CardTitle className='text-3xl tracking-tight text-zinc-900'>账号入口</CardTitle>
              <CardDescription className='text-base leading-7 text-zinc-600'>
                使用邮箱密码登录或注册，也可用 Google 账号继续。
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className='space-y-5 pt-6'>
            <Tabs className='space-y-5' defaultValue='sign-in'>
              <TabsList className='h-11 w-full rounded-xl border border-amber-200/80 bg-amber-50/60 p-1'>
                <TabsTrigger
                  className='rounded-lg text-sm data-[state=active]:bg-white data-[state=active]:text-amber-800 data-[state=active]:shadow-sm'
                  value='sign-in'
                >
                  登录
                </TabsTrigger>
                <TabsTrigger
                  className='rounded-lg text-sm data-[state=active]:bg-white data-[state=active]:text-amber-800 data-[state=active]:shadow-sm'
                  value='sign-up'
                >
                  注册
                </TabsTrigger>
              </TabsList>

              <TabsContent className='space-y-4' value='sign-in'>
                <form className='space-y-4' onSubmit={handleEmailSignIn}>
                  <div className='space-y-2'>
                    <Label className='text-sm font-medium text-zinc-700' htmlFor='signInEmail'>
                      邮箱
                    </Label>
                    <Input
                      autoComplete='email'
                      className='h-12 rounded-xl border-zinc-200 bg-white text-base shadow-none'
                      id='signInEmail'
                      name='email'
                      onChange={(event) => {
                        setLoginEmail(event.target.value)
                      }}
                      placeholder='you@example.com'
                      required
                      type='email'
                      value={loginEmail}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label className='text-sm font-medium text-zinc-700' htmlFor='signInPassword'>
                      密码
                    </Label>
                    <Input
                      autoComplete='current-password'
                      className='h-12 rounded-xl border-zinc-200 bg-white text-base shadow-none'
                      id='signInPassword'
                      name='password'
                      onChange={(event) => {
                        setLoginPassword(event.target.value)
                      }}
                      placeholder='请输入密码'
                      required
                      type='password'
                      value={loginPassword}
                    />
                  </div>
                  <Button
                    className='h-12 w-full rounded-xl bg-amber-700 text-base font-medium text-white hover:bg-amber-800'
                    disabled={isEmailLoading}
                    type='submit'
                  >
                    {isEmailLoading ? <Loader2 className='size-4 animate-spin' /> : null}
                    邮箱登录
                  </Button>
                </form>
              </TabsContent>

              <TabsContent className='space-y-4' value='sign-up'>
                <form className='space-y-4' onSubmit={handleEmailSignUp}>
                  <div className='space-y-2'>
                    <Label className='text-sm font-medium text-zinc-700' htmlFor='signUpName'>
                      昵称（可选）
                    </Label>
                    <Input
                      autoComplete='name'
                      className='h-12 rounded-xl border-zinc-200 bg-white text-base shadow-none'
                      id='signUpName'
                      name='name'
                      onChange={(event) => {
                        setRegisterName(event.target.value)
                      }}
                      placeholder='例如：小李'
                      type='text'
                      value={registerName}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label className='text-sm font-medium text-zinc-700' htmlFor='signUpEmail'>
                      邮箱
                    </Label>
                    <Input
                      autoComplete='email'
                      className='h-12 rounded-xl border-zinc-200 bg-white text-base shadow-none'
                      id='signUpEmail'
                      name='email'
                      onChange={(event) => {
                        setRegisterEmail(event.target.value)
                      }}
                      placeholder='you@example.com'
                      required
                      type='email'
                      value={registerEmail}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label className='text-sm font-medium text-zinc-700' htmlFor='signUpPassword'>
                      密码
                    </Label>
                    <Input
                      autoComplete='new-password'
                      className='h-12 rounded-xl border-zinc-200 bg-white text-base shadow-none'
                      id='signUpPassword'
                      name='password'
                      onChange={(event) => {
                        setRegisterPassword(event.target.value)
                      }}
                      placeholder='至少 8 位'
                      required
                      type='password'
                      value={registerPassword}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label
                      className='text-sm font-medium text-zinc-700'
                      htmlFor='signUpConfirmPassword'
                    >
                      确认密码
                    </Label>
                    <Input
                      autoComplete='new-password'
                      className='h-12 rounded-xl border-zinc-200 bg-white text-base shadow-none'
                      id='signUpConfirmPassword'
                      name='confirmPassword'
                      onChange={(event) => {
                        setRegisterConfirmPassword(event.target.value)
                      }}
                      placeholder='再次输入密码'
                      required
                      type='password'
                      value={registerConfirmPassword}
                    />
                  </div>
                  <Button
                    className='h-12 w-full rounded-xl bg-amber-700 text-base font-medium text-white hover:bg-amber-800'
                    disabled={isSignUpLoading}
                    type='submit'
                  >
                    {isSignUpLoading ? <Loader2 className='size-4 animate-spin' /> : null}
                    邮箱注册
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className='text-muted-foreground my-1 flex items-center gap-3 text-xs'>
              <div className='h-px flex-1 bg-amber-100' />
              <span>或</span>
              <div className='h-px flex-1 bg-amber-100' />
            </div>
            <Button
              className='h-12 w-full rounded-xl border-amber-200 bg-white text-base font-medium text-zinc-800 hover:bg-amber-50'
              disabled={isGoogleLoading}
              onClick={handleGoogleSignIn}
              type='button'
              variant='outline'
            >
              {isGoogleLoading ? <Loader2 className='size-4 animate-spin' /> : null}
              使用 Google 登录
            </Button>
            {errorMessage ? (
              <p className='rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive'>
                {errorMessage}
              </p>
            ) : null}
            {successMessage ? (
              <p className='rounded-lg border border-emerald-200/50 bg-emerald-50 px-3 py-2 text-sm text-emerald-700'>
                {successMessage}
              </p>
            ) : null}
          </CardContent>
          <CardFooter className='flex flex-wrap items-center justify-between gap-2 border-t border-amber-100/80 pt-5 text-xs text-zinc-500'>
            <span>登录即表示你同意应用的使用条款与隐私政策。</span>
            <Button asChild className='h-auto p-0 text-xs text-zinc-700' variant='link'>
              <Link href='/'>返回首页</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
