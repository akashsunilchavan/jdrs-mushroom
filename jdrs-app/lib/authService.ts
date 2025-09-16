import axios from "axios"

const API_URL = "http://localhost:5000/api"

export const authService = {
  login: async (email: string, password: string) => {
    try {
      const res = await axios.post(`${API_URL}/admin/login`, { email, password })
      return res.data
    } catch (err: any) {
      return {
        success: false,
        error: err.response?.data?.message || "Login failed"
      }
    }
  }
}
