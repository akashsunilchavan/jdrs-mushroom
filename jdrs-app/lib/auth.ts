import bcrypt from "bcryptjs"
import { offlineStorage } from "./offline-storage"

export interface User {
  id: string
  name: string
  email: string
  phone: string
  role: "admin" | "supervisor"
  isActive: boolean
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
}

class AuthService {
  private currentUser: User | null = null

  async login(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const user = await offlineStorage.getUserByEmail(email)

      if (!user) {
        return { success: false, error: "User not found" }
      }

      if (!user.isActive) {
        return { success: false, error: "Account is deactivated" }
      }

      const isValidPassword = await bcrypt.compare(password, user.password)

      if (!isValidPassword) {
        return { success: false, error: "Invalid password" }
      }

      const { password: _, syncStatus, ...userWithoutPassword } = user
      this.currentUser = userWithoutPassword

      // Store in localStorage for persistence
      localStorage.setItem("jdrs_user", JSON.stringify(userWithoutPassword))

      return { success: true, user: userWithoutPassword }
    } catch (error) {
      return { success: false, error: "Login failed" }
    }
  }

  async logout() {
    this.currentUser = null
    localStorage.removeItem("jdrs_user")
  }

  getCurrentUser(): User | null {
    if (this.currentUser) {
      return this.currentUser
    }

    // Try to get from localStorage
    const stored = localStorage.getItem("user")
    if (stored) {
      try {
        this.currentUser = JSON.parse(stored)
        return this.currentUser
      } catch {
        localStorage.removeItem("user")
      }
    }

    return null
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null
  }

  hasRole(role: "admin" | "supervisor"): boolean {
    const user = this.getCurrentUser()
    return user?.role === role
  }

  async createDefaultAdmin() {
    try {
      // Check if admin already exists
      const existingAdmin = await offlineStorage.getUserByEmail("admin@jdrs.com")
      if (existingAdmin) return

      // Create default admin user
      const hashedPassword = await bcrypt.hash("admin123", 10)
      await offlineStorage.addUser({
        id: crypto.randomUUID(),
        name: "System Admin",
        email: "admin@jdrs.com",
        phone: "1234567890",
        role: "admin",
        password: hashedPassword,
        isActive: true,
        createdAt: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Failed to create default admin:", error)
    }
  }
}

export const authService = new AuthService()
