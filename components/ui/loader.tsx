"use client"

import { cn } from "@/lib/utils"

interface LoaderProps {
  size?: "sm" | "md" | "lg"
  fullScreen?: boolean
  text?: string
}

export function Loader({ size = "md", fullScreen = false, text }: LoaderProps) {
  const sizeClasses = {
    sm: "h-5 w-5 border-2",
    md: "h-8 w-8 border-3",
    lg: "h-12 w-12 border-4"
  }

  const loader = (
    <div className={cn(
      "flex flex-col items-center justify-center",
      fullScreen && "fixed inset-0 bg-white/80 backdrop-blur-sm z-50"
    )}>
      <div className={cn(
        "animate-spin rounded-full border-t-[#8BC34A]",
        "border-l-[#8BC34A] border-r-[#8BC34A]",
        "border-b-transparent",
        sizeClasses[size]
      )} />
      {text && (
        <p className="mt-4 text-sm text-gray-500 animate-pulse">
          {text}
        </p>
      )}
    </div>
  )

  return fullScreen ? (
    <div className="relative">
      {loader}
    </div>
  ) : loader
} 