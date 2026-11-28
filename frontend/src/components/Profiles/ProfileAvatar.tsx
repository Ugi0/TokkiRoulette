import { useContext } from "react";
import { ProfileContext, useProfile } from "./ProfileContext";
import "./ProfileAvatar.css";

type ProfileAvatarProps = {
    userId: string | number;
    userName: string;
    imageUrl: string | null | undefined;
    className: string;
};

/**
 * A user's profile picture. For logged-in visitors it is a button that re-fetches the user's
 * current Twitch name and picture.
 */
export function ProfileAvatar({ userId, userName: fallbackName, imageUrl: fallbackImage, className }: ProfileAvatarProps) {
    const { canRefresh, pending, refresh } = useContext(ProfileContext);
    const { userName, imageUrl } = useProfile(userId, fallbackName, fallbackImage);
    const id = String(userId);
    const img = <img className={className} src={imageUrl ?? "/default-pfp.jpg"} alt="" />;

    if (!canRefresh) {
        return img;
    }

    const isPending = pending.has(id);

    return (
        <button
            type="button"
            className={`avatar-refresh${isPending ? " avatar-refresh--pending" : ""}`}
            title={`Update ${userName}'s name and picture from Twitch`}
            aria-label={`Update ${userName}'s name and picture from Twitch`}
            disabled={isPending}
            onClick={() => refresh(id)}
        >
            {img}
            <span className="avatar-refresh__icon" aria-hidden="true">↻</span>
        </button>
    );
}

/** A user's display name, updated live when their profile is refreshed. */
export function ProfileName({ userId, userName: fallbackName, className }: { userId: string | number; userName: string; className: string }) {
    const { userName } = useProfile(userId, fallbackName, null);
    return (
        <div className={className} title={userName}>
            {userName}
        </div>
    );
}
