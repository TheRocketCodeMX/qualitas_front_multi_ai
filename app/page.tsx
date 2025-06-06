"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (isMounted && !isLoading) {
      if (isAuthenticated) {
        router.push("/dashboard")
      } else {
        router.push("/login")
      }
    }
  }, [isAuthenticated, isLoading, router, isMounted])

  // Don't render anything on the server
  if (!isMounted) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
    </div>
  )
}
