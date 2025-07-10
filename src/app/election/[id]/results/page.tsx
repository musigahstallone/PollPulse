'use client';

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { notFound, useParams } from "next/navigation";
import type { VoteResult, Election } from "@/types";
import ResultsDisplay from "@/components/ResultsDisplay";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Hourglass, Lock } from "lucide-react";
import { getElectionById, getElectionResults } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import * as signalR from "@microsoft/signalr";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export default function ResultsPage() {
  const params = useParams();
  const { token, isLoading: authLoading } = useAuth();
  const electionId = Number(params.id);

  const [election, setElection] = useState<Election | null>(null);
  const [results, setResults] = useState<VoteResult[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (isNaN(electionId)) {
        notFound();
        return;
    }
    
    if(!authLoading) {
      const fetchInitialData = async () => {
        try {
          // Admin might need to see results of inactive elections, so token is passed
          const electionData = await getElectionById(electionId, token);
          setElection(electionData);

          if (token) {
              const resultsData = await getElectionResults(electionId, token);
              setResults(resultsData);
          }
        } catch (error) {
          console.error("Failed to fetch initial data:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchInitialData();
    }
  }, [electionId, token, authLoading]);

  useEffect(() => {
    if (!token || !electionId) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${process.env.NEXT_PUBLIC_API_BASE_URL}/votehub`, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build();

    connection.on("ReceiveResults", (newResults: VoteResult[]) => {
      setResults(newResults);
    });

    connection.start()
      .then(() => {
        console.log("SignalR Connected.");
        connection.invoke("JoinElectionGroup", electionId);
        connection.invoke("GetLiveResults", electionId);
      })
      .catch(err => console.error("SignalR Connection Error: ", err));

    return () => {
        if (connection.state === signalR.HubConnectionState.Connected) {
            connection.invoke("LeaveElectionGroup", electionId).catch(err => console.log(err));
            connection.stop();
        }
    };
  }, [token, electionId]);


  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!election) {
    notFound();
  }

  const now = new Date();
  const isElectionFinished = new Date(election.endDate) < now || !election.isActive;
  const showFullResults = isElectionFinished && election.resultsAnnounced;
  const totalVotes = results.reduce((sum, result) => sum + result.voteCount, 0);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <div className="mb-6">
            <Button asChild variant="outline" size="sm">
                <Link href={`/election/${election.id}`}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Election
                </Link>
            </Button>
        </div>
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-3xl font-headline">Results: {election.title}</CardTitle>
            <CardDescription>
              {isElectionFinished 
                ? `This election has concluded. A total of ${totalVotes.toLocaleString()} votes were cast.`
                : `This election is currently active. Live results are being updated.`
              }
            </CardDescription>
          </CardHeader>
        </Card>
        
        {showFullResults ? (
           <ResultsDisplay results={results} election={election} />
        ) : isElectionFinished ? (
            <Alert>
                <Hourglass className="h-4 w-4" />
                <AlertTitle>Results Pending</AlertTitle>
                <AlertDescription>
                    The votes have been collected, but the final results have not been announced by the administration yet. Please check back later.
                </AlertDescription>
            </Alert>
        ) : (
            <Alert variant="default" className="border-accent">
                <Lock className="h-4 w-4 text-accent-foreground" />
                <AlertTitle>Live Tally in Progress</AlertTitle>
                <AlertDescription>
                    The election is still ongoing. Full detailed results and percentages will be available once voting has officially closed and results are announced by an administrator.
                    For now, you can see a live leaderboard of the candidates.
                </AlertDescription>
            </Alert>
        )}

        {!showFullResults && <ResultsDisplay results={results} election={election} showLeaderOnly={true} />}
      </main>
    </div>
  );
}
