
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
import { getElectionById } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorDisplay from "@/components/ErrorDisplay";
import { cn } from "@/lib/utils";
import { useSignalR } from "@/hooks/useSignalR";

export default function ResultsPage() {
  const params = useParams();
  const { token, isLoading: authLoading } = useAuth();
  const electionId = Number(params.id);

  const [election, setElection] = useState<Election | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialFetchError, setInitialFetchError] = useState<string | null>(null);

  const { results, connectionStatus, isPulsing } = useSignalR(electionId, token, election?.isActive);

<<<<<<< HEAD

=======
>>>>>>> 5eac6b4 (do this show vote counts)
  const fetchInitialData = useCallback(async () => {
    if (isNaN(electionId)) {
      notFound();
      return;
    }

    if (token === null || token === undefined) {
      notFound();
    }

    setLoading(true);
    setInitialFetchError(null);
    try {
      const electionData = await getElectionById(electionId, token);
      setElection(electionData);
    } catch (err: any) {
      console.error("Failed to fetch initial data:", err);
      setInitialFetchError(err.message || "Could not load election results.");
    } finally {
      setLoading(false);
    }
  }, [electionId, token]);

  useEffect(() => {
    if (!authLoading) {
      fetchInitialData();
    }
  }, [electionId, authLoading, fetchInitialData]);

<<<<<<< HEAD
  useEffect(() => {
    if (!token || !electionId || !process.env.NEXT_PUBLIC_API_URL || !election) return;

    if (connectionRef.current) return;

    const hubUrl = `${process.env.NEXT_PUBLIC_API_URL}/votehub`;

    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build();

    connectionRef.current = newConnection;

    const updateStatus = () => {
      const stateMap: Record<signalR.HubConnectionState, ConnectionStatus> = {
        [signalR.HubConnectionState.Connecting]: 'connecting',
        [signalR.HubConnectionState.Connected]: 'connected',
        [signalR.HubConnectionState.Disconnected]: 'disconnected',
        [signalR.HubConnectionState.Reconnecting]: 'reconnecting',
        [signalR.HubConnectionState.Disconnecting]: 'disconnected',
      };
      setConnectionStatus(stateMap[newConnection.state]);
    };

    newConnection.on("ReceiveResults", (newResults: VoteResult[]) => {
      setResults(newResults);
      setIsPulsing(true);
      setTimeout(() => setIsPulsing(false), 1000);
    });

    newConnection.onreconnecting(() => updateStatus());
    newConnection.onreconnected(() => {
      updateStatus();
      newConnection.invoke("JoinElectionGroup", electionId).catch(err => console.error("Error re-joining group:", err));
      if (election.isActive) {
        newConnection.invoke("GetLiveResults", electionId).catch(err => console.error("Error getting live results on reconnect:", err));
      }
    });
    newConnection.onclose(() => updateStatus());

    newConnection.start()
      .then(() => {
        updateStatus();
        console.log("SignalR Connected.");
        newConnection.invoke("JoinElectionGroup", electionId).catch(err => console.error("Error joining group:", err));

        if (election.isActive) {
          newConnection.invoke("GetLiveResults", electionId).catch(err => console.error("Error getting live results:", err));
        }
      })
      .catch(err => {
        console.error("SignalR Connection Error: ", err);
        updateStatus();
      });

    return () => {
      if (connectionRef.current) {
        connectionRef.current.stop().then(() => console.log("SignalR connection stopped."));
        connectionRef.current = null;
      }
    };
  }, [token, electionId, election]);


=======
>>>>>>> 5eac6b4 (do this show vote counts)
  if (authLoading || loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 container mx-auto p-4 md:p-8">
          <LoadingSpinner text="Fetching results..." />
        </main>
      </div>
    );
  }

<<<<<<< HEAD
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
=======
  if (initialFetchError || !election) {
      return (
          <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-1 container mx-auto p-4 md:p-8">
                  <ErrorDisplay 
                    title="Could not load results"
                    message={initialFetchError || "An unknown error occurred while fetching election results."}
                    onRetry={fetchInitialData}
                  />
              </main>
          </div>
      )
>>>>>>> 5eac6b4 (do this show vote counts)
  }

  const now = new Date();
  const isElectionFinished = new Date(election.endDate) < now || !election.isActive;
  const showFullResults = isElectionFinished && election.resultsAnnounced;
  const totalVotes = results.reduce((sum, result) => sum + result.voteCount, 0);

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Badge className={cn("bg-green-500 text-white transition-all", isPulsing && "animate-pulse ring-4 ring-green-300")}><Wifi className="mr-2 h-3 w-3" /> Live</Badge>;
      case 'reconnecting':
        return <Badge variant="secondary"><Loader2 className="mr-2 h-3 w-3 animate-spin" /> Reconnecting...</Badge>;
      case 'disconnected':
        return <Badge variant="destructive"><WifiOff className="mr-2 h-3 w-3" /> Connection Delayed</Badge>;
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
<<<<<<< HEAD
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle>Results: {election.title}</CardTitle>
              </div>
              {getStatusBadge()}
            </div>
=======
             <div className="flex justify-between items-start">
                 <div className="flex-1">
                    <CardTitle>Results: {election.title}</CardTitle>
                 </div>
                 {election.isActive && getStatusBadge()}
             </div>
>>>>>>> 5eac6b4 (do this show vote counts)
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
