"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { LogOut, Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { useTheme } from "next-themes"
import { BottomNav } from "@/components/navigation/bottom-nav"

const settingsSchema = z.object({
  name: z.string().min(2),
  gender: z.enum(["male", "female", "other"]),
  dateOfBirth: z.string(),
  unitPreference: z.enum(["metric", "imperial"]),
  weight: z.number().positive(),
  height: z.number().positive(),
  bodyFat: z.number().min(0).max(100).optional(),
})

export default function SettingsPage() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: "",
      gender: "male",
      dateOfBirth: "",
      unitPreference: "metric",
      weight: 0,
      height: 0,
      bodyFat: 0,
    },
  })

  // Auto-save on form changes
  useEffect(() => {
    const subscription = form.watch((value) => {
      console.log("Saving...", value)
      // Implement auto-save logic here
    })
    return () => subscription.unsubscribe()
  }, [form.watch])

  return (
    <div className="pb-20">
      <PageHeader
        title="Settings"
        rightContent={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => router.push("/auth")}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        }
      />

      <div className="p-4 space-y-6">
        <Card>
          <CardContent className="p-4">
            <Form {...form}>
              <form className="space-y-6">
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
                  name="unitPreference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit Preference</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight ({form.watch("unitPreference") === "metric" ? "kg" : "lb"})</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
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
                      <FormLabel>Height ({form.watch("unitPreference") === "metric" ? "cm" : "ft/in"})</FormLabel>
                      <FormControl>
                        {form.watch("unitPreference") === "metric" ? (
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(Number.parseFloat(e.target.value))}
                          />
                        ) : (
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              placeholder="ft"
                              className="w-20"
                              onChange={(e) => {
                                const feet = Number.parseFloat(e.target.value)
                                const inches = Number.parseFloat(
                                  (document.querySelector('input[placeholder="in"]') as HTMLInputElement)?.value || "0",
                                )
                                field.onChange((feet * 12 + inches) * 2.54)
                              }}
                            />
                            <Input
                              type="number"
                              placeholder="in"
                              className="w-20"
                              onChange={(e) => {
                                const inches = Number.parseFloat(e.target.value)
                                const feet = Number.parseFloat(
                                  (document.querySelector('input[placeholder="ft"]') as HTMLInputElement)?.value || "0",
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
                          {...field}
                          onChange={(e) => field.onChange(Number.parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  )
}

