/**
 * Authentication Page Component
 *
 * Handles both login and signup flows with a unified form interface.
 * Provides a seamless experience for user authentication with form validation
 * and smooth transitions between login and signup modes.
 *
 * Features:
 * - Toggle between login and signup forms
 * - Form validation using Zod
 * - Unit preference handling for weight/height
 * - Error handling and feedback
 * - Loading states
 *
 * UX Considerations:
 * - Smooth animations between form states
 * - Clear error messages
 * - Proper input types for mobile
 * - Haptic feedback
 * - iOS-native feel
 */

"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import type { UserProfile } from "@/contexts/auth-context"

// Form validation schemas
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

const signupSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  gender: z.enum(["male", "female", "other"]),
  dateOfBirth: z.string().refine((date) => !isNaN(Date.parse(date)), "Please enter a valid date"),
  weight: z.number().positive("Weight must be positive"),
  height: z.number().positive("Height must be positive"),
  bodyFat: z.number().min(0, "Body fat must be positive").max(100, "Body fat must be less than 100").optional(),
  unitPreference: z.enum(["metric", "imperial"]),
})

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [unitPreference, setUnitPreference] = useState<"metric" | "imperial">("metric")
  const [isLoading, setIsLoading] = useState(false)
  const { login, signup } = useAuth()

  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(isLogin ? loginSchema : signupSchema),
    defaultValues: {
      email: "",
      password: "",
      unitPreference: "metric",
    },
  })

  const onSubmit = async (values: z.infer<typeof signupSchema>) => {
    setIsLoading(true)

    try {
      if (isLogin) {
        await login(values.email, values.password)
      } else {
        const userProfile: UserProfile = {
          email: values.email,
          name: values.name,
          gender: values.gender,
          dateOfBirth: values.dateOfBirth,
          weight: values.weight,
          height: values.height,
          bodyFat: values.bodyFat,
          unitPreference: values.unitPreference,
        }
        await signup(userProfile, values.password)
      }
    } catch (error) {
      form.setError("root", {
        message: error instanceof Error ? error.message : "An error occurred",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container max-w-lg p-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={isLogin ? "login" : "signup"}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>{isLogin ? "Login" : "Sign Up"}</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Email and Password fields */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="email@example.com"
                            type="email"
                            autoCapitalize="none"
                            autoComplete="email"
                            autoCorrect="off"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            autoComplete={isLogin ? "current-password" : "new-password"}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Signup-only fields */}
                  <AnimatePresence>
                    {!isLogin && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-6"
                      >
                        {/* Additional signup fields */}
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="gender"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Gender</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select gender" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="male">Male</SelectItem>
                                  <SelectItem value="female">Female</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="dateOfBirth"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Date of Birth</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="weight"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Weight ({unitPreference === "metric" ? "kg" : "lb"})</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.1"
                                  inputMode="decimal"
                                  {...field}
                                  onChange={(e) => field.onChange(Number.parseFloat(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="height"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Height ({unitPreference === "metric" ? "cm" : "ft/in"})</FormLabel>
                              <FormControl>
                                {unitPreference === "metric" ? (
                                  <Input
                                    type="number"
                                    inputMode="decimal"
                                    {...field}
                                    onChange={(e) => field.onChange(Number.parseFloat(e.target.value))}
                                  />
                                ) : (
                                  <div className="flex gap-2">
                                    <Input
                                      type="number"
                                      inputMode="decimal"
                                      placeholder="ft"
                                      className="w-20"
                                      onChange={(e) => {
                                        const feet = Number.parseFloat(e.target.value)
                                        const inches = Number.parseFloat(
                                          (document.querySelector('input[placeholder="in"]') as HTMLInputElement)
                                            ?.value || "0",
                                        )
                                        field.onChange((feet * 12 + inches) * 2.54)
                                      }}
                                    />
                                    <Input
                                      type="number"
                                      inputMode="decimal"
                                      placeholder="in"
                                      className="w-20"
                                      onChange={(e) => {
                                        const inches = Number.parseFloat(e.target.value)
                                        const feet = Number.parseFloat(
                                          (document.querySelector('input[placeholder="ft"]') as HTMLInputElement)
                                            ?.value || "0",
                                        )
                                        field.onChange((feet * 12 + inches) * 2.54)
                                      }}
                                    />
                                  </div>
                                )}
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="bodyFat"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Body Fat %</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.1"
                                  inputMode="decimal"
                                  {...field}
                                  onChange={(e) => field.onChange(Number.parseFloat(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="unitPreference"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Unit Preference</FormLabel>
                              <Select
                                onValueChange={(value: "metric" | "imperial") => {
                                  field.onChange(value)
                                  setUnitPreference(value)
                                }}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select units" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="metric">Metric (kg/cm)</SelectItem>
                                  <SelectItem value="imperial">Imperial (lb/ft-in)</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Form actions */}
                  <div className="space-y-4">
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Loading..." : isLogin ? "Login" : "Sign Up"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setIsLogin(!isLogin)
                      }}
                      disabled={isLoading}
                    >
                      {isLogin ? "Create an account" : "Already have an account?"}
                    </Button>
                  </div>

                  {/* Form error message */}
                  {form.formState.errors.root && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm font-medium text-destructive text-center"
                    >
                      {form.formState.errors.root.message}
                    </motion.div>
                  )}
                </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

