"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { LoginForm } from "@/components/auth/login-form"
import { authService } from "@/lib/auth"
import { offlineStorage } from "@/lib/offline-storage"

export default function LoginPage() {
  const router = useRouter()

  useEffect(() => {
    // Initialize offline storage and create default admin
    const initializeApp = async () => {
      await offlineStorage.init()
      await authService.createDefaultAdmin()
    }

    initializeApp()

    // Check if user is already logged in
    const user = authService.getCurrentUser()
    if (user) {
      if (user.role === "admin") {
        router.push("/admin/dashboard")
      } else {
        router.push("/supervisor/dashboard")
      }
    }
  }, [router])

  return <LoginForm />
}
