"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, User, Lock, Eye, EyeOff, Shield, BarChart3, Headphones } from "lucide-react"
import { authService, setAuthToken } from "@/lib/authService"
import { useToast } from "@/hooks/use-toast"

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

type LoginValues = z.infer<typeof loginSchema>

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onSubmit",
  })

  const onSubmit = async (values: LoginValues) => {
    setIsLoading(true)
    setError("")

    try {
      const result = await authService.login(values.email, values.password)

      if (!result.success || !result.token || !result.user) {
        const message = result.error || "Login failed"
        setError(message)
        toast({ title: "Login failed", description: message })
        return
      }

      // Persist auth state with consistent keys
      localStorage.setItem("token", result.token)
      localStorage.setItem("user", JSON.stringify(result.user))
      setAuthToken(result.token)

      toast({ title: "Welcome", description: `Signed in as ${result.user.email}` })

      // Redirect by role
      if (result.user.role === "admin") {
        router.push("/admin/dashboard")
      } else {
        router.push("/supervisor/dashboard")
      }
    } catch (err: any) {
      const message = err?.message || "Error during login. Check server or network."
      setError(message)
      toast({ title: "Error", description: message })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left Panel - Features */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-600 to-blue-600 p-12 text-white flex-col justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">JDRS Mobile</h1>
          <p className="text-green-100">Harvesting Data Management System</p>
        </div>

        <div className="space-y-8">
          <div className="flex items-start space-x-4">
            <div className="bg-white/20 p-3 rounded-full">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-1">Secure authentication with 2FA</h3>
              <p className="text-green-100">Enterprise-grade security to protect your data</p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="bg-white/20 p-3 rounded-full">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-1">Real-time analytics dashboard</h3>
              <p className="text-green-100">Monitor operations with live data visualization</p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="bg-white/20 p-3 rounded-full">
              <Headphones className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-1">24/7 premium customer support</h3>
              <p className="text-green-100">Our team is always ready to assist you</p>
            </div>
          </div>
        </div>

        <div>
          <p className="text-green-100 text-sm">© 2023 JDRS Mobile. All rights reserved.</p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 ">
        <Card className="w-full max-w-md shadow-lg border border-gray-300 ">
          <CardHeader className="text-center space-y-4 pb-8">
            <div className="flex justify-center">
              <div className="bg-green-100 p-3 rounded-full">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-800">Welcome Back</CardTitle>
              <CardDescription className="text-gray-500 mt-2">Sign in to continue to your account</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">
                  Email Address
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    {...register("email")}
                    className="pl-10 h-11 rounded-lg"
                    aria-invalid={!!errors.email}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-600">{errors.email.message as string}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-gray-700">
                    Password
                  </Label>
                  <Button
                    variant="link"
                    className="text-green-600 hover:text-green-800 p-0 h-auto text-sm font-normal"
                    type="button"
                  >
                    Forgot password?
                  </Button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    {...register("password")}
                    className="pl-10 pr-10 h-11 rounded-lg"
                    aria-invalid={!!errors.password}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-600">{errors.password.message as string}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <Button variant="link" className="text-green-600 hover:text-green-800 p-0 font-semibold">
                  Sign up
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}