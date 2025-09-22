import axios from "axios"

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/$/, "")

export type LoginUser = {
  id: string | number
  email: string
  role: "admin" | "supervisor"
}

export type LoginResult = {
  success: boolean
  token?: string
  user?: LoginUser
  message?: string
  error?: string
  raw?: any
}

export function setAuthToken(token?: string) {
  if (token) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
  } else {
    delete axios.defaults.headers.common["Authorization"]
  }
}

export const authService = {
  login: async (email: string, password: string): Promise<LoginResult> => {
    try {
      const res = await axios.post(`${API_BASE}/admin/login`, { email, password })
      const data = res.data || {}

      const token: string | undefined = data.token
      const admin = data.admin || data.user || {}

      if (!token) {
        return { success: false, error: data.message || "No token received from server", raw: data }
      }

      const user: LoginUser = {
        id: admin.id,
        email: admin.email,
        role: (admin.role as "admin" | "supervisor") || "admin",
      }

      return { success: true, token, user, message: data.message, raw: data }
    } catch (err: any) {
      const message = err?.response?.data?.message || err.message || "Login failed"
      return { success: false, error: message }
    }
  },
}
