import { createContext, useContext } from "react";
import type { RefreshedProfile } from "../../utils/profileApi";

export type ProfileContextValue = {
    /** True when the visitor has a valid session and may refresh profiles. */
    canRefresh: boolean;
    /** Profiles refreshed during this visit, by user id. */
    overrides: Record<string, RefreshedProfile>;
    pending: Set<string>;
    refresh: (userId: string) => Promise<void>;
};

export const ProfileContext = createContext<ProfileContextValue>({
    canRefresh: false,
    overrides: {},
    pending: new Set(),
    refresh: async () => {},
});

/** Name and picture for a user, preferring anything refreshed during this visit. */
export function useProfile(userId: string | number, userName: string, imageUrl: string | null | undefined) {
    const { overrides } = useContext(ProfileContext);
    const override = overrides[String(userId)];
    return {
        userName: override?.user_name ?? userName,
        imageUrl: override ? override.profile_image_url : imageUrl ?? null,
    };
}
