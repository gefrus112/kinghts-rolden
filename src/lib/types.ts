// Shared types used by both server (API routes) and client components.

export interface ClubProfile {
  name: string;
  clubId: number;
  slug: string;
  description: string;
  logo: string | null;
  membersCount: number;
  averageDailyRating: number;
  created: number; // unix seconds
  lastActivity: number; // unix seconds
  adminUsernames: string[];
  country: string | null;
  clubUrl: string;
  joinUrl: string;
  inviteUrl: string;
}

export type MatchStatus = "in_progress" | "registered" | "finished";

export interface ClubMatch {
  id: string;
  name: string;
  status: MatchStatus;
  startTime?: number;
  timeClass?: string;
  result?: string; // win | lose | draw | tie (for finished matches)
  team?: string;
  opponent?: string;
  url: string;
}

export interface MemberRating {
  rapid?: number;
  blitz?: number;
  bullet?: number;
}

export interface MemberProfile {
  username: string;
  name?: string;
  avatar?: string | null;
  country?: string | null;
  title?: string;
  status?: string;
  joinedChessCom?: number;
  lastOnline?: number;
  isOnline?: boolean;
  ratings?: MemberRating;
  clubJoined?: number;
  isAdmin?: boolean;
  isOwner?: boolean;
  isSiteMember?: boolean;
}

export interface GameRecord {
  id: string;
  url: string;
  endTime: number;
  timeClass: string;
  rated: boolean;
  white: { username: string; rating?: number; result: string };
  black: { username: string; rating?: number; result: string };
  moves: string[]; // SAN moves
  fromTo: string[][]; // [from, to] per ply
  fens: string[]; // fens[0] = start, fens[i] = position after ply i
  demo?: boolean;
  demoTitle?: string;
}

export interface SessionInfo {
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  country?: string | null;
  isClubMember: boolean;
  verified: boolean; // verified live against chess.com
  since: string; // ISO date
}

export interface ClubData {
  live: boolean;
  club: ClubProfile;
  matches: ClubMatch[];
}

export interface MembersData {
  live: boolean;
  members: MemberProfile[];
}

export interface GamesData {
  live: boolean;
  username: string;
  games: GameRecord[];
}
