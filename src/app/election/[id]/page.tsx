'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Candidate, Election } from '@/types';
import Header from '@/components/Header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BarChartHorizontalBig, CheckCircle2, Lightbulb, User, Vote, XCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getElectionById, castVote, checkVoteStatus } from '@/lib/api';

export default function ElectionPage() {
  const params = useParams();
  const router = useRouter();
  const { token, user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [election, setElection] = useState<Election | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVoting, setIsVoting] = useState(false);

  useEffect(() => {
    const electionId = Number(params.id);
    if (isNaN(electionId)) {
        setError("Invalid election ID.");
        setLoading(false);
        return;
    }

    if (!authLoading) {
        const fetchElectionData = async () => {
            try {
                const electionData = await getElectionById(electionId, token);
                setElection(electionData);

                if (isAuthenticated) {
                    const voteStatus = await checkVoteStatus(electionId, token!);
                    setHasVoted(voteStatus.hasVoted);
                }
            } catch (err) {
                setError("Failed to load election details.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchElectionData();
    }
  }, [params.id, authLoading, isAuthenticated, token]);
  
  const handleVote = async () => {
    if (!selectedCandidateId || !election || !token) return;
    
    setIsVoting(true);
    try {
        await castVote({ electionId: election.id, candidateId: selectedCandidateId }, token);
        setHasVoted(true);
        router.push(`/election/${election.id}/results`);
    } catch (err) {
        console.error(err);
        alert("Failed to cast vote. You might have already voted or the election is not active.");
    } finally {
        setIsVoting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !election) {
    return (
      <>
        <Header />
        <main className="container mx-auto p-8 text-center">
          <XCircle className="mx-auto h-12 w-12 text-destructive" />
          <h1 className="mt-4 text-2xl font-bold">{error || "Election Not Found"}</h1>
          <p className="mt-2 text-muted-foreground">The election you are looking for does not exist or could not be loaded.</p>
          <Button asChild className="mt-6">
            <Link href="/">Back to Elections</Link>
          </Button>
        </main>
      </>
    );
  }

  const now = new Date();
  const isElectionActive = new Date(election.startDate) <= now && new Date(election.endDate) >= now && election.isActive;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <Card className="mb-8 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-3xl font-headline">{election.title}</CardTitle>
            <CardDescription>{election.description}</CardDescription>
          </CardHeader>
          <CardFooter>
             <Button asChild variant="secondary">
                <Link href={`/election/${election.id}/results`}>
                    <BarChartHorizontalBig className="mr-2 h-4 w-4" /> View Results
                </Link>
             </Button>
          </CardFooter>
        </Card>

        {!isAuthenticated && isElectionActive && (
            <Alert variant="default" className="mb-8 border-accent">
                <Lightbulb className="h-4 w-4 !text-accent-foreground" />
                <AlertTitle>You need to be logged in to vote.</AlertTitle>
                <AlertDescription>
                   <Button asChild variant="link" className="p-0 h-auto">
                     <Link href="/login">Please log in or register to participate.</Link>
                   </Button>
                </AlertDescription>
            </Alert>
        )}

        {hasVoted && (
          <Alert variant="default" className="mb-8 border-primary bg-primary/10">
            <CheckCircle2 className="h-4 w-4 !text-primary" />
            <AlertTitle>You have already voted!</AlertTitle>
            <AlertDescription>
              Thank you for participating in this election. Your voice has been heard.
            </AlertDescription>
          </Alert>
        )}

        <RadioGroup
          value={selectedCandidateId?.toString()}
          onValueChange={(value) => setSelectedCandidateId(Number(value))}
          disabled={hasVoted || !isElectionActive || !isAuthenticated || isVoting}
        >
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {election.candidates.map((candidate: Candidate) => (
              <Label key={candidate.id} htmlFor={`candidate-${candidate.id}`} className="block">
                <Card className={`transition-all duration-200 ${selectedCandidateId === candidate.id ? 'border-primary ring-2 ring-primary shadow-lg' : 'hover:shadow-md'}`}>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-xl flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        {candidate.firstName} {candidate.lastName}
                      </CardTitle>
                      <CardDescription>{candidate.position}</CardDescription>
                    </div>
                    <RadioGroupItem value={candidate.id.toString()} id={`candidate-${candidate.id}`} />
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{candidate.platform}</p>
                  </CardContent>
                </Card>
              </Label>
            ))}
          </div>
        </RadioGroup>

        {isElectionActive && !hasVoted && isAuthenticated && (
          <div className="mt-8 flex justify-center">
            <Button size="lg" onClick={handleVote} disabled={!selectedCandidateId || isVoting}>
              {isVoting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Vote className="mr-2 h-5 w-5" />}
              {isVoting ? 'Casting Vote...' : 'Cast Your Vote'}
            </Button>
          </div>
        )}
        
        {!isElectionActive && (
            <Alert variant="destructive" className="mt-8">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Election has ended</AlertTitle>
                <AlertDescription>
                    This election is no longer active. Voting is closed.
                </AlertDescription>
            </Alert>
        )}
      </main>
    </div>
  );
}
