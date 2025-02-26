"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect } from "react"
import { useRouter } from "next/navigation"
import { loginUser, signupUser, updateUserProfile } from "@/lib/api"

export interface UserProfile {
  email: string
  name: string
  gender: "male" | "female" | "other"
  dateOfBirth: string
  weight: number
  height: number
  bodyFat?: number
  unitPreference: "metric" | "imperial"
}

interface AuthState {
  isAuthenticated: boolean
  user: UserProfile | null
  isLoading: boolean
}

type AuthAction =
  | { type: "LOGIN"; user: UserProfile }
  | { type: "SIGNUP"; user: UserProfile }
  | { type: "LOGOUT" }
  | { type: "UPDATE_PROFILE"; user: UserProfile }
  | { type: "SET_LOADING"; isLoading: boolean }

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  isLoading: true,
}

const AuthContext = createContext<{
  state: AuthState
  login: (email: string, password: string) => Promise<void>
  signup: (user: UserProfile, password: string) => Promise<void>
  logout: () => void
  updateProfile: (user: UserProfile) => Promise<void>
} | null>(null)

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "LOGIN":
    case "SIGNUP":
      return {
        ...state,
        isAuthenticated: true,
        user: action.user,
        isLoading: false,
      }
    case "LOGOUT":
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        isLoading: false,
      }
    case "UPDATE_PROFILE":
      return {
        ...state,
        user: action.user,
      }
    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.isLoading,
      }
    default:
      return state
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState)
  const router = useRouter()

  useEffect(() => {
    const currentUser = localStorage.getItem("donotdie_current_user")
    if (currentUser) {
      dispatch({ type: "LOGIN", user: JSON.parse(currentUser) })
    } else {
      dispatch({ type: "SET_LOADING", isLoading: false })
    }
  }, [])

  const login = async (email: string, password: string) => {
    dispatch({ type: "SET_LOADING", isLoading: true })
    try {
      const user = await loginUser(email, password)
      localStorage.setItem("donotdie_current_user", JSON.stringify(user))
      dispatch({ type: "LOGIN", user })
      router.push("/")
    } catch (error) {
      throw error
    }
  }

  const signup = async (user: UserProfile, password: string) => {
    dispatch({ type: "SET_LOADING", isLoading: true })
    try {
      const newUser = await signupUser(user, password)
      localStorage.setItem("donotdie_current_user", JSON.stringify(newUser))
      dispatch({ type: "SIGNUP", user: newUser })
      router.push("/")
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem("donotdie_current_user")
    dispatch({ type: "LOGOUT" })
    router.push("/auth")
  }

  const updateProfile = async (user: UserProfile) => {
    try {
      await updateUserProfile(user)
      localStorage.setItem("donotdie_current_user", JSON.stringify(user))
      dispatch({ type: "UPDATE_PROFILE", user })
    } catch (error) {
      throw error
    }
  }

  return <AuthContext.Provider value={{ state, login, signup, logout, updateProfile }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

