import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchIsAuthenticated, refreshProfile, type RefreshedProfile } from "../../utils/profileApi";
import { useOverlay } from "../Overlay/OverlayContext";
import { ProfileContext } from "./ProfileContext";

export function ProfileProvider({ children }: { children: React.ReactNode }) {
    const { showOverlay } = useOverlay();
    const [canRefresh, setCanRefresh] = useState(false);
    const [overrides, setOverrides] = useState<Record<string, RefreshedProfile>>({});
    const [pending, setPending] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchIsAuthenticated().then(setCanRefresh);
    }, []);

    const refresh = useCallback(async (userId: string) => {
        setPending((prev) => new Set(prev).add(userId));
        try {
            const profile = await refreshProfile(userId);
            setOverrides((prev) => ({ ...prev, [userId]: profile }));
            showOverlay(`Updated ${profile.user_name} from Twitch`);
        } catch (err) {
            showOverlay(err instanceof Error ? err.message : "Couldn't refresh this profile");
        } finally {
            setPending((prev) => {
                const next = new Set(prev);
                next.delete(userId);
                return next;
            });
        }
    }, [showOverlay]);

    const value = useMemo(
        () => ({ canRefresh, overrides, pending, refresh }),
        [canRefresh, overrides, pending, refresh]
    );

    return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}
