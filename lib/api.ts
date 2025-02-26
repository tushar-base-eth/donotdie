// This file will be the central place for all API calls
// Replace these functions with actual Supabase calls later

import type { Workout } from "@/types/workouts"
import type { UserProfile } from "@/contexts/auth-context"

// Auth API
export async function loginUser(email: string, password: string): Promise<UserProfile> {
  // Mock implementation - replace with Supabase auth
  const users = JSON.parse(localStorage.getItem("donotdie_users") || "[]")
  const user = users.find((u: UserProfile & { password: string }) => u.email === email && u.password === password)

  if (!user) {
    throw new Error("Invalid credentials")
  }

  const { password: _, ...userProfile } = user
  return userProfile
}

export async function signupUser(user: UserProfile, password: string): Promise<UserProfile> {
  // Mock implementation - replace with Supabase auth
  const users = JSON.parse(localStorage.getItem("donotdie_users") || "[]")
  if (users.some((u: UserProfile) => u.email === user.email)) {
    throw new Error("Email already exists")
  }

  users.push({ ...user, password })
  localStorage.setItem("donotdie_users", JSON.stringify(users))
  return user
}

// Workout API
export async function getWorkouts(): Promise<Workout[]> {
  // Mock implementation - replace with Supabase query
  return JSON.parse(localStorage.getItem("workouts") || "[]")
}

export async function saveWorkout(workout: Workout): Promise<void> {
  // Mock implementation - replace with Supabase insert
  const workouts = await getWorkouts()
  workouts.unshift(workout)
  localStorage.setItem("workouts", JSON.stringify(workouts))
}

export async function deleteWorkout(workoutId: string): Promise<void> {
  // Mock implementation - replace with Supabase delete
  const workouts = await getWorkouts()
  const updatedWorkouts = workouts.filter((w) => w.id !== workoutId)
  localStorage.setItem("workouts", JSON.stringify(updatedWorkouts))
}

export async function updateUserProfile(user: UserProfile): Promise<void> {
  // Mock implementation - replace with Supabase update
  const users = JSON.parse(localStorage.getItem("donotdie_users") || "[]")
  const updatedUsers = users.map((u: UserProfile & { password: string }) =>
    u.email === user.email ? { ...u, ...user } : u,
  )
  localStorage.setItem("donotdie_users", JSON.stringify(updatedUsers))
}

