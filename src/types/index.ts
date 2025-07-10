export interface Candidate {
  id: number;
  firstName: string;
  lastName: string;
  studentId: string;
  position: string;
  platform: string;
  electionId: number;
  votes?: number; // This might come from results endpoint
  isActive?: boolean;
}

export interface Election {
  id: number;
  title: string;
  description: string;
  startDate: string; // ISO 8601 string
  endDate: string; // ISO 8601 string
  isActive: boolean;
  resultsAnnounced: boolean; // To control result visibility
  resultsAnnouncedAt: string | null;
  candidates: Candidate[];
}

export interface VoteResult {
  id: number;
  candidateId: number;
  candidateName: string;
  position: string;
  voteCount: number;
  percentage: number;
}

export interface UserProfile {
  id: number;
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "Student" | "Admin";
}

export interface CastVotePayload {
  electionId: number;
  candidateId: number;
}

export interface VoteStatus {
  hasVoted: boolean;
}

export interface CreateElectionPayload {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
}

export interface AddCandidatePayload {
  firstName: string;
  lastName: string;
  studentId: string;
  position: string;
  platform?: string;
  electionId: number;
}

export interface LoginRequest {
  studentId: string;
  password: string;
}

export interface RegisterRequest {
  studentId: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface FetchWrapperOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

export interface FetchWrapperResponse<T> {
  data: T;
  status: number;
}

export interface SignalRConnectionStatus {
  connectionStatus: "connected" | "reconnecting" | "disconnected";
  isPulsing: boolean;
}

export interface SignalRConnection {
  start: () => Promise<void>;
  stop: () => Promise<void>;
  on: (eventName: string, callback: (...args: any[]) => void) => void;
  off: (eventName: string, callback?: (...args: any[]) => void) => void;
}

export interface SignalRHub {
  connection: SignalRConnection;
  connectionStatus: SignalRConnectionStatus;
  isPulsing: boolean;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  onElectionStarted: (callback: (electionId: number) => void) => void;
  onElectionStopped: (callback: (electionId: number) => void) => void;
  onVoteCast: (callback: (voteResult: VoteResult) => void) => void;
}

export interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

export interface AuthProviderProps {
  children: React.ReactNode;
}

export interface CreateElectionFormValues {
  title: string;
  description?: string;
  startDate: string; // ISO 8601 string
  endDate: string; // ISO 8601 string
}

export interface CreateCandidateFormValues {
  firstName: string;
  lastName: string;
  studentId: string;
  position: string;
  platform?: string;
  electionId: number;
}
export interface LoginFormValues {
  studentId: string;
  password: string;
}
export interface RegisterFormValues {
  studentId: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface ElectionResults {
  election: Election;
  results: VoteResult[];
}

export interface SignalRHubMethods {
  startElection: (electionId: number) => void;
  stopElection: (electionId: number) => void;
  castVote: (payload: CastVotePayload) => void;
  getResults: (electionId: number) => VoteResult[];
}

