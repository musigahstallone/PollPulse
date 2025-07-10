

"use server";

import type {
  Election,
  VoteResult,
  UserProfile,
  CastVotePayload,
  VoteStatus,
  CreateElectionPayload,
  Candidate,
  AddCandidatePayload,
} from "@/types";

// The base URL for all API requests, loaded from environment variables.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

async function fetchWrapper(url: string, options: RequestInit = {}) {
  try {
    const fetchUrl = `${API_BASE_URL}${url}`;

    const response = await fetch(fetchUrl, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = {
          message: `An unknown error occurred. Status: ${response.status}`,
        };
      }
      console.error(
        `API Error: ${response.status} ${response.statusText}`,
        errorData
      );
      throw new Error(errorData.message || "An unexpected API error occurred.");
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  } catch (error: any) {
    if (error.cause?.code === "ECONNREFUSED" || error.cause?.code === 'ECONNRESET' || error instanceof TypeError) {
      console.error("Network Error:", error);
      throw new Error(
        "Could not connect to the server. Please check your network connection or contact an administrator."
      );
    }
    // Re-throw other errors (like the ones we threw manually above)
    throw error;
  }
}

// Auth Endpoints
export async function login(credentials: any) {
  return fetchWrapper("/api/Auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export async function register(userData: any) {
  return fetchWrapper("/api/Auth/register", {
    method: "POST",
    body: JSON.stringify(userData),
  });
}

export async function getProfile(token: string): Promise<UserProfile> {
  return fetchWrapper("/api/Auth/profile", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// Election Management Endpoints (Admin)
export async function createElection(
  payload: CreateElectionPayload,
  token: string
): Promise<Election> {
  return fetchWrapper("/api/Election", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export async function startElection(
  electionId: number,
  token: string
): Promise<{ message: string; election: Election }> {
  return fetchWrapper(`/api/Election/${electionId}/start`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function stopElection(
  electionId: number,
  token: string
): Promise<{ message: string; election: Election }> {
  return fetchWrapper(`/api/Election/${electionId}/stop`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function addCandidate(
  payload: AddCandidatePayload,
  token: string
): Promise<Candidate> {
  return fetchWrapper("/api/Election/candidates", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export async function getActiveElections(): Promise<Election[]> {
  return fetchWrapper("/api/Election/active");
}

export async function getCandidatesForElection(
  electionId: number
): Promise<Candidate[]> {
  return fetchWrapper(`/api/Election/${electionId}/candidates`);
}

// Voting Endpoints
export async function castVote(payload: CastVotePayload, token: string) {
  return fetchWrapper("/api/Voting/cast", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export async function getElectionResults(
  electionId: number,
  token: string
): Promise<VoteResult[]> {
  return fetchWrapper(`/api/Voting/results/${electionId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function checkVoteStatus(
  electionId: number,
  token: string
): Promise<VoteStatus> {
  return fetchWrapper(`/api/Voting/check-vote-status/${electionId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// Updated functions to match the new ElectionService methods

export async function getAllElections(
  token?: string | null
): Promise<Election[]> {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  // Updated to use the correct endpoint that matches GetAllElectionsAsync for admins
  return fetchWrapper("/api/Election/all", {
    method: "GET",
    headers,
  });
}

export async function getElectionById(
  id: number,
  token?: string | null
): Promise<Election> {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  // This endpoint matches GetElectionByIdAsync
  return fetchWrapper(`/api/Election/${id}`, {
    method: "GET",
    headers,
  });
}

export async function announceResults(
  electionId: number,
  token: string
): Promise<{ message: string }> {
  // Updated to match the AnnounceResultsAsync method
  return fetchWrapper(`/api/Election/${electionId}/announce`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}
