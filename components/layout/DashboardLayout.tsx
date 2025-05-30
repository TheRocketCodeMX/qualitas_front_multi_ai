"use client"

import type React from "react"
import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Search, Database, LogOut, ChevronLeft, User } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Logo } from "@/components/ui/logo"

interface DashboardLayoutProps {
  children: React.ReactNode
}

const navigation = [
  { name: "Cotizador manual", href: "/cotizador", icon: Search },
  { name: "Catálogo de datos", href: "/catalogo", icon: Database },
]

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  const handleLogout = () => {
    logout()
  }

  const Sidebar = ({ isMobile = false }) => (
    <div
      className={`flex flex-col h-full ${isMobile ? "w-full" : isSidebarCollapsed ? "w-16" : "w-64"} bg-white border-r border-gray-200 transition-all duration-300`}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        {!isSidebarCollapsed && <Logo size="md" showText={true} />}
        {isSidebarCollapsed && (
          <div className="flex justify-center w-full">
            <Logo size="sm" showText={false} />
          </div>
        )}
        {!isMobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className={`h-4 w-4 transition-transform ${isSidebarCollapsed ? "rotate-180" : ""}`} />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                isActive ? "bg-[#8BC34A] text-white" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              }`}
              onClick={() => isMobile && setIsMobileMenuOpen(false)}
            >
              <item.icon className={`h-5 w-5 ${isSidebarCollapsed ? "" : "mr-3"}`} />
              {!isSidebarCollapsed && <span>{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3 mb-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-[#8BC34A] rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
          </div>
          {!isSidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">Juan Pérez</p>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className={`${isSidebarCollapsed ? "w-8 h-8 p-0" : "w-full justify-start"} text-gray-600 hover:text-gray-900`}
          onClick={handleLogout}
        >
          <LogOut className={`h-4 w-4 ${isSidebarCollapsed ? "" : "mr-2"}`} />
          {!isSidebarCollapsed && "Cerrar sesión"}
        </Button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar Desktop */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Sidebar Mobile */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="md:hidden fixed top-4 left-4 z-50">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar isMobile />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-end px-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-[#8BC34A] rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">JP</span>
            </div>
            <span className="text-sm font-medium text-gray-900">Juan Pérez</span>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
