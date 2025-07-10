
'use client';

import { useEffect, useState, useCallback } from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { notFound, useParams } from "next/navigation";
import type { VoteResult, Election } from "@/types";
import ResultsDisplay from "@/components/ResultsDisplay";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Hourglass, Lock, Wifi, WifiOff } from "lucide-react";
import { getElectionById, getElectionResults } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import * as signalR from "@microsoft/signalr";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorDisplay from "@/components/ErrorDisplay";

type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

export default function ResultsPage() {
  const params = useParams();
  const { token, isLoading: authLoading } = useAuth();
  const electionId = Number(params.id);

  const [election, setElection] = useState<Election | null>(null);
  const [results, setResults] = useState<VoteResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  
  const fetchInitialData = useCallback(async () => {
    if (isNaN(electionId)) {
      notFound();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const electionData = await getElectionById(electionId, token);
      setElection(electionData);

      if (token && electionData.resultsAnnounced) {
        const resultsData = await getElectionResults(electionId, token);
        setResults(resultsData);
      }
    } catch (err: any) {
      console.error("Failed to fetch initial data:", err);
      setError(err.message || "Could not load election results.");
    } finally {
      setLoading(false);
    }
  }, [electionId, token]);

  useEffect(() => {
    if(!authLoading) {
      fetchInitialData();
    }
  }, [electionId, authLoading, fetchInitialData]);

  useEffect(() => {
    if (!token || !electionId || !process.env.NEXT_PUBLIC_API_URL) return;

    // Use environment variable for SignalR hub URL
    const hubUrl = `${process.env.NEXT_PUBLIC_API_URL}/votehub`;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build();

    const updateStatus = () => {
        const stateMap: Record<signalR.HubConnectionState, ConnectionStatus> = {
            [signalR.HubConnectionState.Connecting]: 'connecting',
            [signalR.HubConnectionState.Connected]: 'connected',
            [signalR.HubConnectionState.Disconnected]: 'disconnected',
            [signalR.HubConnectionState.Reconnecting]: 'reconnecting',
            [signalR.HubConnectionState.Disconnecting]: 'disconnected',
        };
        setConnectionStatus(stateMap[connection.state]);
    };

    connection.on("ReceiveResults", (newResults: VoteResult[]) => {
      setResults(newResults);
    });
    
    connection.onreconnecting(() => updateStatus());
    connection.onreconnected(() => updateStatus());
    connection.onclose(() => updateStatus());

    connection.start()
      .then(() => {
        updateStatus();
        console.log("SignalR Connected.");
        connection.invoke("JoinElectionGroup", electionId.toString());
        connection.invoke("GetLiveResults", electionId);
      })
      .catch(err => {
          console.error("SignalR Connection Error: ", err);
          updateStatus();
      });

    return () => {
        if (connection.state === signalR.HubConnectionState.Connected) {
            connection.invoke("LeaveElectionGroup", electionId.toString()).catch(err => console.log(err));
        }
        connection.stop();
    };
  }, [token, electionId]);


  if (authLoading || loading) {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 container mx-auto p-4 md:p-8">
                <LoadingSpinner text="Fetching results..."/>
            </main>
        </div>
    );
  }

  if (error || !election) {
      return (
          <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-1 container mx-auto p-4 md:p-8">
                  <ErrorDisplay 
                    title="Could not load results"
                    message={error || "An unknown error occurred while fetching election results."}
                    onRetry={fetchInitialData}
                  />
              </main>
          </div>
      )
  }

  const now = new Date();
  const isElectionFinished = new Date(election.endDate) < now || !election.isActive;
  const showFullResults = isElectionFinished && election.resultsAnnounced;
  const totalVotes = results.reduce((sum, result) => sum + result.voteCount, 0);

  const getStatusBadge = () => {
    switch(connectionStatus) {
        case 'connected':
            return <Badge variant="default" className="bg-green-500 text-white"><Wifi className="mr-2 h-3 w-3" /> Live</Badge>;
        case 'reconnecting':
            return <Badge variant="secondary"><Loader2 className="mr-2 h-3 w-3 animate-spin" /> Reconnecting...</Badge>;
        case 'disconnected':
            return <Badge variant="destructive"><WifiOff className="mr-2 h-3 w-3" /> Delayed</Badge>;
        default:
            return <Badge variant="outline"><Loader2 className="mr-2 h-3 w-3 animate-spin" /> Connecting...</Badge>;
    }
  }

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
             <div className="flex justify-between items-start">
                 <CardTitle className="text-3xl font-headline">Results: {election.title}</CardTitle>
                 {getStatusBadge()}
             </div>
            <CardDescription>
              {isElectionFinished 
                ? `This election has concluded. A total of ${totalVotes.toLocaleString()} votes were cast.`
                : `This election is currently active. Results are updating in real-time.`
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
            <>
            <Alert variant="default" className="border-accent mb-8">
                <Lock className="h-4 w-4 text-accent-foreground" />
                <AlertTitle>Live Tally in Progress</AlertTitle>
                <AlertDescription>
                    The election is still ongoing. Full detailed results and percentages will be available once voting has officially closed and results are announced by an administrator.
                    For now, you can see a live leaderboard of the candidates.
                </AlertDescription>
            </Alert>
            <ResultsDisplay results={results} election={election} showLeaderOnly={true} />
            </>
        )}
      </main>
    </div>
  );
}
