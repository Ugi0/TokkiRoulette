import { fetchHelixUsers } from "./helix.js";
import { getParticipantsByIds, saveUserProfile } from "./statistics_queries.js";

export type Profile = {
  user_id: string;
  user_name: string;
  profile_image_url: string | null;
};

/**
 * Returns name + profile image for each user. Uses the participants table, and asks Twitch (in one
 * batched request) only for users without a stored image. Twitch failures are logged, not thrown,
 * so the stats pages still load with default avatars.
 */
export async function fetchUserProfiles(entries: { user_id: string; user_name?: string | null }[]): Promise<Profile[]> {
  const validEntries = entries.filter(e => !!e.user_id);
  if (validEntries.length === 0) return [];

  const ids = [...new Set(validEntries.map(e => e.user_id))];
  const saved = await getParticipantsByIds(ids);

  const missing = ids.filter(id => !saved.get(id)?.profile_image_url);

  if (missing.length > 0) {
    try {
      const users = await fetchHelixUsers(missing);
      for (const user of users) {
        const userName = user.display_name || user.login || user.id;
        const imageUrl = user.profile_image_url || null;
        await saveUserProfile(user.id, userName, imageUrl);
        saved.set(user.id, { user_name: userName, profile_image_url: imageUrl });
      }
    } catch (err) {
      console.error("Failed to fetch profiles from Twitch:", err);
    }
  }

  return validEntries.map(entry => {
    const profile = saved.get(entry.user_id);
    return {
      user_id: entry.user_id,
      user_name: profile?.user_name ?? entry.user_name ?? entry.user_id,
      profile_image_url: profile?.profile_image_url ?? null,
    };
  });
}
