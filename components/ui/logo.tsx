import Image from "next/image"

interface LogoProps {
  size?: "sm" | "md" | "lg"
  showText?: boolean
}

export function Logo({ size = "md", showText = true }: LogoProps) {
  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-14 h-14",
    lg: "w-20 h-20",
  }

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  }

  return (
    <div className="flex items-center space-x-2">
      <Image
        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-AF2FLEwBKx7hat8PRMra16eCdiaygU.png"
        alt="Wheel Logo"
        width={size === "sm" ? 40 : size === "md" ? 56 : 80}
        height={size === "sm" ? 40 : size === "md" ? 56 : 80}
        className={`${sizeClasses[size]} object-contain`}
        style={{ mixBlendMode: "multiply" }}
      />
      {showText && <span className={`font-bold text-gray-900 ${textSizeClasses[size]}`}>Wheel</span>}
    </div>
  )
}
