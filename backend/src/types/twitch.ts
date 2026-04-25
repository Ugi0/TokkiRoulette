export interface TwitchUser {
  id: string;
  login: string;
  display_name: string;
}

export interface TwitchTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: "bearer";
}