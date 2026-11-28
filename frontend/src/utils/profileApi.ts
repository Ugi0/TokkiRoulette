export type RefreshedProfile = {
    user_id: string;
    user_name: string;
    profile_image_url: string | null;
};

export async function fetchIsAuthenticated(): Promise<boolean> {
    try {
        const response = await fetch("/api/auth/session", { credentials: "include" });
        if (!response.ok) return false;
        const data = await response.json();
        return data.authenticated === true;
    } catch {
        return false;
    }
}

/** Asks the backend to re-fetch a user's name and picture from Twitch. Throws with a user-facing message on failure. */
export async function refreshProfile(userId: string): Promise<RefreshedProfile> {
    const response = await fetch(`/api/analytics/profile/${encodeURIComponent(userId)}/refresh`, {
        method: "POST",
        credentials: "include",
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.error ?? `Refresh failed (HTTP ${response.status})`);
    }

    return data as RefreshedProfile;
}
