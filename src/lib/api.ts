'use server';

import type { Election, VoteResult, UserProfile, CastVotePayload, VoteStatus } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

async function fetchWrapper(url: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
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
    return fetchWrapper('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
    });
}

export async function register(userData: any) {
    return fetchWrapper('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
    });
}

export async function getProfile(token: string): Promise<UserProfile> {
    return fetchWrapper('/api/auth/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
}

// Election Endpoints
export async function getActiveElections(): Promise<Election[]> {
  return fetchWrapper('/api/election/active');
}

export async function getElectionById(id: number): Promise<Election> {
    const elections = await getActiveElections();
    const election = elections.find(e => e.id === id);
    if (!election) {
        throw new Error('Election not found');
    }
    return election;
}

export async function getCandidatesForElection(electionId: number) {
    return fetchWrapper(`/api/election/${electionId}/candidates`);
}


// Voting Endpoints
export async function castVote(payload: CastVotePayload, token: string) {
    return fetchWrapper('/api/voting/cast', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
    });
}

export async function getElectionResults(electionId: number, token: string): Promise<VoteResult[]> {
    return fetchWrapper(`/api/voting/results/${electionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
}

export async function checkVoteStatus(electionId: number, token: string): Promise<VoteStatus> {
    return fetchWrapper(`/api/voting/check-vote-status/${electionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
}
