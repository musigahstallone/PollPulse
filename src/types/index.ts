export interface Candidate {
  id: number;
  firstName: string;
  lastName: string;
  studentId: string;
  position: string;
  platform: string;
  electionId: number;
  votes: number;
}

export interface Election {
  id: number;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  candidates: Candidate[];
}

export interface VoteResult {
  candidateId: number;
  candidateName: string;
  position: string;
  voteCount: number;
  percentage: number;
}
