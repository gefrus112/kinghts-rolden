// ---------- Chess.com PubAPI shapes (subset we use) ----------

export interface ChessClubDetails {
  "@id": string;
  name: string;
  club_id: number;
  country?: string;
  location?: string;
  members_count: number;
  created: number;
  last_activity: number;
  admin: string[];
  visibility?: string;
  join_request?: string;
  icon?: string;
  description?: string;
  url: string;
}

export interface ChessClubMembers {
  all_time: ChessMemberEntry[];
  monthly: ChessMemberEntry[];
  weekly: ChessMemberEntry[];
}

export interface ChessMemberEntry {
  username: string;
  joined: number;
  last_online?: number;
}

export interface ChessPlayerProfile {
  username: string;
  player_id: number;
  name?: string;
  avatar?: string;
  url?: string;
  followers?: number;
  country?: string;
  last_online: number;
  joined: number;
  status?: string;
  league?: string;
  is_streamer?: boolean;
}

export interface ChessStats {
  chess_bullet?: ChessRatingStat;
  chess_blitz?: ChessRatingStat;
  chess_rapid?: ChessRatingStat;
  chess_daily?: ChessRatingStat;
  tactics?: { highest?: { rating: number }; lowest?: { rating: number } };
  puzzle_rush?: Record<string, unknown>;
}

export interface ChessRatingStat {
  last?: { rating: number; date: number; rd?: number };
  best?: { rating: number; date: number; game?: string };
  record?: { win: number; loss: number; draw: number };
}

export interface ChessGamePlayer {
  username: string;
  rating?: number;
  result?: string;
}

export interface ChessArchiveGame {
  url: string;
  pgn?: string;
  time_control?: string;
  end_time?: number;
  rated?: boolean;
  fen?: string;
  time_class?: string;
  rules?: string;
  white?: ChessGamePlayer;
  black?: ChessGamePlayer;
  eco?: string;
}

export interface ChessToMoveGame {
  url: string;
  fen?: string;
  turn?: "w" | "b";
  move_by?: number;
  white?: ChessGamePlayer;
  black?: ChessGamePlayer;
}

// ---------- Our API response shapes ----------

export type DataSource = "direct" | "proxy" | "reader" | "cache" | "snapshot";

export interface ClubInfoResponse {
  name: string;
  clubId: number;
  description: string;
  icon: string;
  membersCount: number;
  clubUrl: string;
  joinUrl: string;
  admin: string[];
  createdAt: number;
  source: DataSource;
}

export interface EnrichedMember {
  username: string;
  joined: number;
  lastOnline?: number;
  name?: string;
  avatar?: string;
  league?: string;
  ratings?: {
    rapid?: number;
    blitz?: number;
    bullet?: number;
    daily?: number;
  };
}

export interface MembersResponse {
  members: EnrichedMember[];
  membersCount: number;
  source: DataSource;
}

export interface LiveGame {
  url: string;
  fen: string;
  turn: "w" | "b";
  moveBy?: number;
  clubMember: string;
  white?: string;
  black?: string;
  whiteRating?: number;
  blackRating?: number;
}

export interface LiveGamesResponse {
  games: LiveGame[];
  scannedMembers: number;
  source: DataSource;
}

export interface RecentGame {
  url: string;
  pgn?: string;
  endTime?: number;
  fen: string;
  timeClass?: string;
  rated?: boolean;
  white?: ChessGamePlayer;
  black?: ChessGamePlayer;
  whiteResult?: string;
  blackResult?: string;
  movesCount?: number;
}

export interface PlayerDataResponse {
  profile: (ChessPlayerProfile & { countryFlag?: string }) | null;
  ratings: {
    rapid?: number;
    blitz?: number;
    bullet?: number;
    daily?: number;
  };
  games: RecentGame[];
  source: DataSource;
}

export interface AuthUser {
  id: string;
  username: string;
  chessUsername: string | null;
  createdAt: string;
}
