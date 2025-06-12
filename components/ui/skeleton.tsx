import { cn } from "@/lib/utils"
import React from "react"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  shimmer?: boolean
  pulse?: boolean
}

function Skeleton({ className, shimmer = false, pulse = true, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-md bg-muted relative overflow-hidden",
        pulse && "animate-pulse",
        shimmer && "skeleton-shimmer",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }

// Estilos para shimmer (agregar en global.css o en el archivo correspondiente):
// .skeleton-shimmer::after {
//   content: '';
//   position: absolute;
//   top: 0; left: -150px; height: 100%; width: 150px;
//   background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
//   animation: shimmer 1.2s infinite;
// }
// @keyframes shimmer { 100% { left: 100%; } }
