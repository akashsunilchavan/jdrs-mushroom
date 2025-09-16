"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authService, type User } from "@/lib/auth"
import { Sidebar } from "./sidebar"
import { Loader2 } from "lucide-react"

interface DashboardLayoutProps {
  children: React.ReactNode
  requiredRole?: "admin" | "supervisor"
}

export function DashboardLayout({ children, requiredRole }: DashboardLayoutProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = () => {
      const currentUser = authService.getCurrentUser()

      if (!currentUser) {
        router.push("/")
        return
      }

      if (requiredRole && currentUser.role !== requiredRole) {
        // Redirect to appropriate dashboard based on role
        if (currentUser.role === "admin") {
          router.push("/admin/dashboard")
        } else {
          router.push("/supervisor/dashboard")
        }
        return
      }

      setUser(currentUser)
      setIsLoading(false)
    }

    checkAuth()
  }, [router, requiredRole])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar user={user} />
      <div className="md:pl-80">
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
