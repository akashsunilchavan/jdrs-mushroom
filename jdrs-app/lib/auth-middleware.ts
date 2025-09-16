import type { NextRequest } from "next/server"
import jwt from "jsonwebtoken"

export interface AuthUser {
  userId: string
  email: string
  role: "admin" | "supervisor"
}

export interface AuthResult {
  success: boolean
  user?: AuthUser
  error?: string
}

export async function verifyToken(request: NextRequest): Promise<AuthResult> {
  try {
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { success: false, error: "No token provided" }
    }

    const token = authHeader.substring(7) // Remove "Bearer " prefix

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "jdrs-secret-key") as any

      return {
        success: true,
        user: {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role,
        },
      }
    } catch (jwtError) {
      return { success: false, error: "Invalid token" }
    }
  } catch (error) {
    console.error("Auth middleware error:", error)
    return { success: false, error: "Authentication failed" }
  }
}

export function requireRole(allowedRoles: string[]) {
  return async (request: NextRequest): Promise<AuthResult> => {
    const authResult = await verifyToken(request)

    if (!authResult.success) {
      return authResult
    }

    if (!allowedRoles.includes(authResult.user!.role)) {
      return { success: false, error: "Insufficient permissions" }
    }

    return authResult
  }
}
