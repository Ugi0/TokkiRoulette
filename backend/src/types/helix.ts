import { TwitchUser } from "./twitch.js";

export type HelixUsersResponse = {
  data: TwitchUser[];
}

export type HelixUser = {
  id: string;
  login: string;
  display_name: string;
  type: string;
  broadcaster_type: string;
  description: string;
  profile_image_url: string;
  offline_image_url: string;
  view_count: number;
  created_at: string;
}

export type UserTokens = {
  access_token: string;
  refresh_token: string;
  expires_at: Date;
}