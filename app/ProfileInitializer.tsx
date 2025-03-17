"use client";

import { useEffect } from "react";
import { useUserProfile } from "@/contexts/profile-context";

export function ProfileInitializer({ children }: { children: React.ReactNode }) {
    const { fetchProfile, state: { profile } } = useUserProfile();

    useEffect(() => {
        if (!profile) {
            fetchProfile(); // Fetch profile once on app load if not already set
        }
    }, [fetchProfile, profile]);

    return <>{children}</>;
}