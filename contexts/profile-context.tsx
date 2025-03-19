"use client";

import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";
import { usePathname } from "next/navigation";
import useSWR, { mutate as globalMutate } from "swr"; // Import useSWR and mutate
import type { Profile } from "@/types/workouts";

interface UserProfile extends Profile {
  email: string;
}

interface ProfileState {
  profile: UserProfile | null;
}

interface ProfileContextType {
  state: ProfileState;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  fetchProfile: () => Promise<void>; // fetchProfile will now be the mutate function from SWR
  clearProfile: () => void;
}

const ProfileContext = createContext<ProfileContextType | null>(null);

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    // If the status code is 401, it means the user is unauthorized, we should return null instead of throwing error
    if (res.status === 401) {
      return { profile: null }; // Or just return null if your API route returns just profile data
    }
    throw new Error(`Failed to fetch profile: ${res.status} ${res.statusText}`);
  }
  return res.json();
};

export function ProfileProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Use useSWR to fetch profile data
  const {
    data: profileData,
    mutate: swrMutate,
    error,
  } = useSWR<{ profile: UserProfile | null }>("/api/profile", fetcher, {
    // Expecting { profile: ... } from API
    revalidateOnFocus: false, // Prevent re-fetching when window focus
    // dedupingInterval: 60000, // Optional: Dedupe requests for 1 minute
    onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
      // Retry a maximum of 3 times on error.
      if (retryCount >= 3) return;
      // Only retry on 404, 401, 500, 502, 503, 504. Or network error.
      if (
        [401, 404, 500, 502, 503, 504].includes(error.status) ||
        !error.status
      ) {
        setTimeout(() => revalidate({ retryCount }), 3000); // Retry after 3 seconds
      }
    },
  });

  const [state, setState] = useState<ProfileState>({
    profile: profileData?.profile || null,
  }); // Initialize state from SWR data

  useEffect(() => {
    setState({ profile: profileData?.profile || null }); // Update local state when SWR data changes
  }, [profileData]);

  const fetchProfile = async () => {
    await swrMutate(); // Trigger SWR's mutate to refetch and update cache
  };

  const clearProfile = () => {
    setState({ profile: null }); // Reset profile state
    globalMutate("/api/profile", null, false); // Optionally clear SWR cache for /api/profile immediately without revalidation
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!state.profile) return;
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update profile");
      }
      const updatedProfile = await res.json();

      // Optimistically update SWR cache and local state immediately
      swrMutate(updatedProfile, {
        optimisticData: updatedProfile,
        revalidate: false,
      }); // Optimistic update
      setState({ profile: updatedProfile.profile }); // Update local state as well for immediate UI update

      // Then, trigger a background revalidation to ensure data is consistent (optional, depending on your needs)
      // swrMutate(); // Revalidate in background to catch server-side changes, if any.  You might skip this if PATCH response is authoritative.
    } catch (error: any) {
      console.error("Error updating profile:", error);
      throw error; // Re-throw to allow components to handle errors
    }
  };

  useEffect(() => {
    if (
      pathname === "/home" &&
      state.profile === null &&
      !error &&
      !profileData
    ) {
      fetchProfile(); // Still trigger fetchProfile if on /home and no profile loaded yet and no SWR data initially
    }
    // We intentionally remove state.profile from dependency array, as SWR data changes drive the state update now.
  }, [pathname, error, profileData]);

  return (
    <ProfileContext.Provider
      value={{ state, updateProfile, fetchProfile, clearProfile }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export const useUserProfile = () => {
  const context = useContext(ProfileContext);
  if (!context)
    throw new Error("useUserProfile must be used within a ProfileProvider");
  return context;
};
