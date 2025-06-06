"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"

export const useAuthGuard = () => {
  const auth = useAuth()
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isClient && !auth.isLoading && !auth.isAuthenticated) {
      router.push("/login")
    }
  }, [auth.isAuthenticated, auth.isLoading, router, isClient])

  return auth
}
