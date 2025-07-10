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
