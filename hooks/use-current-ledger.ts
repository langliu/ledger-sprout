"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useMutation, useQuery } from "convex/react"

import type { Doc } from "@/convex/_generated/dataModel"
import { api } from "@/convex/_generated/api"
import { authClient } from "@/lib/auth-client"

type UseCurrentLedgerResult = {
  session: ReturnType<typeof authClient.useSession>["data"]
  isSessionPending: boolean
  ledgers: Doc<"ledgers">[] | undefined
  currentLedger: Doc<"ledgers"> | undefined
  ledgerError: string | null
}

export function useCurrentLedger(): UseCurrentLedgerResult {
  const { data: session, isPending: isSessionPending } = authClient.useSession()
  const ensureDefault = useMutation(api.ledgers.ensureDefault)
  const ledgers = useQuery(api.ledgers.list, session ? {} : "skip")
  const [ledgerError, setLedgerError] = useState<string | null>(null)
  const requestedRef = useRef(false)

  useEffect(() => {
    if (!session || ledgers === undefined || ledgers.length > 0 || requestedRef.current) {
      return
    }

    requestedRef.current = true
    void ensureDefault({})
      .catch((error: unknown) => {
        requestedRef.current = false
        if (error && typeof error === "object" && "message" in error) {
          setLedgerError(String(error.message))
          return
        }
        setLedgerError("初始化默认账本失败")
      })
  }, [ensureDefault, ledgers, session])

  const currentLedger = useMemo(() => {
    if (!ledgers || ledgers.length === 0) {
      return undefined
    }
    return ledgers.find((ledger) => ledger.isDefault) ?? ledgers[0]
  }, [ledgers])

  return {
    session,
    isSessionPending,
    ledgers,
    currentLedger,
    ledgerError,
  }
}
