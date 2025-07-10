'use server';

import type { Election, VoteResult, UserProfile, CastVotePayload, VoteStatus, CreateElectionPayload, Candidate, AddCandidatePayload } from '@/types';

// The base URL is now an empty string because we are using Next.js rewrites
// to proxy requests from /api to the backend.
const API_BASE_URL = '';

async function fetchWrapper(url: string, options: RequestInit = {}) {
  // All requests now go to the proxied path
  const response = await fetch(`${API_BASE_URL}/api${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorData;
    try {
        errorData = await response.json();
    } catch (e) {
        errorData = { message: 'An unknown error occurred and the response was not valid JSON.' };
    }
    console.error(`API Error: ${response.status} ${response.statusText}`, errorData);
    throw new Error(errorData.message || 'API request failed');
  }
  if (response.status === 204) {
      return null;
  }
  return response.json();
}

// Auth Endpoints
export async function login(credentials: any) {
    return fetchWrapper('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
    });
}

export async function register(userData: any) {
    return fetchWrapper('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
    });
}

export async function getProfile(token: string): Promise<UserProfile> {
    return fetchWrapper('/auth/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
}

// Election Management Endpoints (Admin)
export async function createElection(payload: CreateElectionPayload, token: string): Promise<Election> {
    return fetchWrapper('/election', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
    });
}

export async function startElection(electionId: number, token: string): Promise<{ message: string, election: Election }> {
    return fetchWrapper(`/election/${electionId}/start`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
    });
}

export async function stopElection(electionId: number, token: string): Promise<{ message: string, election: Election }> {
    return fetchWrapper(`/election/${electionId}/stop`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
    });
}

export async function addCandidate(payload: AddCandidatePayload, token: string): Promise<Candidate> {
    return fetchWrapper('/election/candidates', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
    });
}

export async function announceResults(electionId: number, token: string): Promise<{ message: string }> {
    // This endpoint is not in the spec, but we add it for the frontend functionality.
    // The backend would need to implement POST /api/election/{electionId}/announce
    return fetchWrapper(`/election/${electionId}/announce`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
    });
}

// Public Election Endpoints
export async function getAllElections(token?: string | null): Promise<Election[]> {
  const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
  // The backend spec doesn't have a /api/election/all endpoint.
  // We assume one exists for admins. If not, this needs to be created on the backend.
  return fetchWrapper('/election/all', { headers });
}

export async function getActiveElections(): Promise<Election[]> {
  return fetchWrapper('/election/active');
}

export async function getElectionById(id: number, token?: string | null): Promise<Election> {
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    // A dedicated /api/election/{id} endpoint is better.
    return fetchWrapper(`/election/${id}`, { headers });
}

export async function getCandidatesForElection(electionId: number): Promise<Candidate[]> {
    return fetchWrapper(`/election/${electionId}/candidates`);
}


// Voting Endpoints
export async function castVote(payload: CastVotePayload, token: string) {
    return fetchWrapper('/voting/cast', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
    });
}

export async function getElectionResults(electionId: number, token: string): Promise<VoteResult[]> {
    return fetchWrapper(`/voting/results/${electionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
}

export async function checkVoteStatus(electionId: number, token:string): Promise<VoteStatus> {
    return fetchWrapper(`/voting/check-vote-status/${electionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
}
