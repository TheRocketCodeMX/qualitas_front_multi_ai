"use client"

import { useEffect, useState } from "react"
import LoginForm from "@/components/auth/LoginForm"

export default function LoginPage() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Don't render anything on the server
  if (!isMounted) {
    return null
  }

  return <LoginForm />
}
