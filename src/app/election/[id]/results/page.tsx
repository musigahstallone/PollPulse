'use client';

import { useEffect, useState, useCallback, useMemo } from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { notFound, useParams } from "next/navigation";
import type { Election } from "@/types";
import ResultsDisplay from "@/components/ResultsDisplay";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Hourglass, Lock, Wifi, WifiOff, AlertCircle, RefreshCw } from "lucide-react";
import { getElectionById } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorDisplay from "@/components/ErrorDisplay";
import { cn } from "@/lib/utils";
import { useSignalR } from "@/hooks/useSignalR";

// ============================================================================
// CONSTANTS
// ============================================================================

/** Auto-refresh interval for non-live connections (in milliseconds) */
const AUTO_REFRESH_INTERVAL = 30000; // 30 seconds

/** Minimum votes threshold for showing detailed statistics */
const MIN_VOTES_FOR_STATS = 10;

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Props for status badge component
 */
interface StatusBadgeProps {
  connectionStatus: 'connected' | 'reconnecting' | 'disconnected';
  isPulsing: boolean;
  hasSignalRError: boolean;
}

/**
 * Election timing information
 */
interface ElectionTiming {
  isElectionFinished: boolean;
  showFullResults: boolean;
  timeRemaining: string | null;
  isElectionStarted: boolean;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Formats time remaining until election ends
 * @param endDate - Election end date
 * @returns Formatted time string or null if election has ended
 */
function formatTimeRemaining(endDate: string): string | null {
  const now = new Date();
  const end = new Date(endDate);
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) return null;

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days} day${days !== 1 ? 's' : ''} remaining`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  }

  return `${minutes} minute${minutes !== 1 ? 's' : ''} remaining`;
}

/**
 * Calculates election timing information
 * @param election - Election object
 * @returns ElectionTiming object with timing details
 */
function calculateElectionTiming(election: Election): ElectionTiming {
  const now = new Date();
  const startDate = new Date(election.startDate);
  const endDate = new Date(election.endDate);

  const isElectionStarted = startDate <= now;
  const isElectionFinished = endDate < now || !election.isActive;
  const showFullResults = isElectionFinished && election.resultsAnnounced;
  const timeRemaining = isElectionFinished ? null : formatTimeRemaining(election.endDate);

  return {
    isElectionStarted,
    isElectionFinished,
    showFullResults,
    timeRemaining
  };
}

// ============================================================================
// COMPONENT: STATUS BADGE
// ============================================================================

/**
 * Status badge component showing connection state with visual indicators
 * @param props - StatusBadgeProps
 * @returns JSX element for status badge
 */
function StatusBadge({ connectionStatus, isPulsing, hasSignalRError }: StatusBadgeProps) {
  // Handle error state with priority
  if (hasSignalRError) {
    return (
      <Badge variant="destructive" className="animate-pulse">
        <AlertCircle className="mr-2 h-3 w-3" />
        Connection Error
      </Badge>
    );
  }

  switch (connectionStatus) {
    case 'connected':
      return (
        <Badge
          className={cn(
            "bg-green-500 text-white transition-all duration-300",
            isPulsing && "animate-pulse ring-4 ring-green-300 shadow-lg"
          )}
        >
          <Wifi className="mr-2 h-3 w-3" />
          Live Updates
        </Badge>
      );

    case 'reconnecting':
      return (
        <Badge variant="secondary" className="animate-pulse">
          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
          Reconnecting...
        </Badge>
      );

    case 'disconnected':
      return (
        <Badge variant="destructive">
          <WifiOff className="mr-2 h-3 w-3" />
          Offline Mode
        </Badge>
      );

    default:
      return (
        <Badge variant="outline">
          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
          Connecting...
        </Badge>
      );
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Results page component for displaying election results with real-time updates
 * 
 * Features:
 * - Real-time results via SignalR
 * - Connection status indicators
 * - Automatic fallback to offline mode
 * - Different views for active vs finished elections
 * - Auto-refresh for disconnected state
 * - Comprehensive error handling
 * - Responsive design
 * 
 * @returns JSX element for the results page
 */
export default function ResultsPage() {
  // ============================================================================
  // HOOKS AND STATE
  // ============================================================================

  const params = useParams();
  const { token, isLoading: authLoading } = useAuth();

  // Parse and validate election ID from URL params
  const electionId = useMemo(() => {
    const id = Number(params.id);
    return isNaN(id) ? null : id;
  }, [params.id]);

  // Component state
  const [election, setElection] = useState<Election | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialFetchError, setInitialFetchError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // SignalR hook for real-time updates
  const {
    results,
    status: signalRStatus,
    error: signalRError,
    isLoading: signalRLoading,
    methods: signalRMethods
  } = useSignalR(electionId || 0, token, election?.isActive || false);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  /** Election timing information */
  const electionTiming = useMemo(() => {
    return election ? calculateElectionTiming(election) : null;
  }, [election]);

  /** Total votes cast */
  const totalVotes = useMemo(() => {
    return results.reduce((sum, result) => sum + result.voteCount, 0);
  }, [results]);

  /** Whether to show voting statistics */
  const shouldShowStats = useMemo(() => {
    return totalVotes >= MIN_VOTES_FOR_STATS;
  }, [totalVotes]);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  /**
   * Fetches initial election data and handles authentication
   */
  const fetchInitialData = useCallback(async () => {
    // Validate election ID
    if (!electionId) {
      notFound();
      return;
    }

    // Handle authentication states
    if (!authLoading && token === null) {
      setInitialFetchError("Authentication required to view election results.");
      setLoading(false);
      return;
    }

    // Wait for authentication to complete
    if (authLoading) return;

    setLoading(true);
    setInitialFetchError(null);

    try {
      console.log(`Fetching election data for ID: ${electionId}`);
      const electionData = await getElectionById(electionId, token);

      setElection(electionData);
      setLastRefresh(new Date());

      console.log(`Successfully loaded election: ${electionData.title}`);
    } catch (err: any) {
      console.error("Failed to fetch initial election data:", err);
      setInitialFetchError(
        err.message ||
        "Could not load election results. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }, [electionId, token, authLoading]);

  /**
   * Handles manual refresh of election data
   */
  const handleRefresh = useCallback(async () => {
    if (!election || !electionId) return;

    try {
      console.log("Manual refresh triggered");
      await fetchInitialData();

      // Also refresh SignalR results if available
      if (signalRMethods && signalRStatus.connectionStatus === 'connected') {
        await signalRMethods.getResults(electionId);
      }
    } catch (error) {
      console.error("Manual refresh failed:", error);
    }
  }, [election, electionId, fetchInitialData, signalRMethods, signalRStatus]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  /**
   * Initial data fetch effect
   */
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  /**
   * Auto-refresh effect for disconnected state
   * Periodically refreshes data when SignalR is not connected
   */
  useEffect(() => {
    // Only auto-refresh if election is active and SignalR is disconnected
    if (!election?.isActive || signalRStatus.connectionStatus === 'connected') {
      return;
    }

    console.log("Setting up auto-refresh for disconnected state");

    const interval = setInterval(() => {
      console.log("Auto-refreshing data due to disconnected state");
      fetchInitialData();
    }, AUTO_REFRESH_INTERVAL);

    return () => {
      clearInterval(interval);
      console.log("Cleared auto-refresh interval");
    };
  }, [election?.isActive, signalRStatus.connectionStatus, fetchInitialData]);

  // ============================================================================
  // LOADING STATES
  // ============================================================================

  /**
   * Show loading spinner while authenticating or fetching initial data
   */
  if (authLoading || loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 container mx-auto p-4 md:p-8">
          <LoadingSpinner text="Loading election results..." />
        </main>
      </div>
    );
  }

  // ============================================================================
  // ERROR STATES
  // ============================================================================

  /**
   * Show error display for initial fetch errors or missing election
   */
  if (initialFetchError || !election) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 container mx-auto p-4 md:p-8">
          <ErrorDisplay
            title="Unable to Load Results"
            message={
              initialFetchError ||
              "Election not found or an error occurred while loading results."
            }
            onRetry={fetchInitialData}
          />
        </main>
      </div>
    );
  }

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto p-4 md:p-8">
        {/* Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <Button asChild variant="outline" size="sm">
            <Link href={`/election/${election.id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Election
            </Link>
          </Button>

          {/* Refresh button for manual updates */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {/* Main Results Card */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-start flex-wrap gap-4">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-xl md:text-2xl break-words">
                  Results: {election.title}
                </CardTitle>
                <CardDescription className="mt-2">
                  {electionTiming?.isElectionFinished ? (
                    <>
                      This election concluded on {new Date(election.endDate).toLocaleDateString()}.
                      {totalVotes > 0 && (
                        <> A total of <strong>{totalVotes.toLocaleString()}</strong> votes were cast.</>
                      )}
                    </>
                  ) : electionTiming?.isElectionStarted ? (
                    <>
                      This election is currently active.
                      {electionTiming.timeRemaining && (
                        <> <strong>{electionTiming.timeRemaining}</strong> until voting closes.</>
                      )}
                      {totalVotes > 0 && (
                        <> Current total: <strong>{totalVotes.toLocaleString()}</strong> votes.</>
                      )}
                    </>
                  ) : (
                    <>
                      This election has not started yet.
                      Voting begins on {new Date(election.startDate).toLocaleDateString()}.
                    </>
                  )}
                </CardDescription>
              </div>

              {/* Connection Status Badge */}
              {election.isActive && (
                <div className="flex-shrink-0">
                  <StatusBadge
                    connectionStatus={signalRStatus.connectionStatus}
                    isPulsing={signalRStatus.isPulsing}
                    hasSignalRError={!!signalRError}
                  />
                </div>
              )}
            </div>

            {/* Additional Status Information */}
            {signalRError && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Connection Issue</AlertTitle>
                <AlertDescription>
                  {signalRError}. Results may not be updating in real-time.
                  The page will automatically refresh every 30 seconds.
                </AlertDescription>
              </Alert>
            )}
          </CardHeader>
        </Card>

        {/* Results Display Logic */}
        {electionTiming?.showFullResults ? (
          /* Full Results - Election finished and results announced */
          <div className="space-y-6">
            {shouldShowStats && (
              <Card>
                <CardHeader>
                  <CardTitle>Election Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-primary">{totalVotes.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Total Votes</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-primary">{results.length}</div>
                      <div className="text-sm text-muted-foreground">Candidates</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-primary">
                        {Math.round((totalVotes / (election.id || totalVotes)) * 100)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Turnout</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <ResultsDisplay
              results={results}
              election={election}
              showFullResults={true}
            />
          </div>
        ) : electionTiming?.isElectionFinished ? (
          /* Election finished but results not announced */
          <Alert>
            <Hourglass className="h-4 w-4" />
            <AlertTitle>Results Pending Announcement</AlertTitle>
            <AlertDescription>
              Voting has concluded, but the final results are pending official announcement
              by the election administrators. Please check back later for the complete results.
              {totalVotes > 0 && (
                <> {totalVotes.toLocaleString()} votes were recorded during this election.</>
              )}
            </AlertDescription>
          </Alert>
        ) : electionTiming?.isElectionStarted ? (
          /* Election is active - show live leaderboard */
          <div className="space-y-6">
            <Alert variant="default" className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
              <Lock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertTitle>Live Election in Progress</AlertTitle>
              <AlertDescription>
                Voting is currently underway. The live leaderboard below shows current standings,
                but detailed results and final percentages will be available once voting closes
                and results are officially announced.
                {electionTiming.timeRemaining && (
                  <> <strong>{electionTiming.timeRemaining}</strong> until voting ends.</>
                )}
              </AlertDescription>
            </Alert>

            <ResultsDisplay
              results={results}
              election={election}
              showLeaderOnly={true}
              isLive={true}
            />
          </div>
        ) : (
          /* Election hasn't started yet */
          <Alert>
            <Hourglass className="h-4 w-4" />
            <AlertTitle>Election Not Started</AlertTitle>
            <AlertDescription>
              This election is scheduled to begin on {new Date(election.startDate).toLocaleDateString()}
              at {new Date(election.startDate).toLocaleTimeString()}.
              Please return when voting has commenced to view live results.
            </AlertDescription>
          </Alert>
        )}

        {/* Debug Information (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="mt-8 opacity-60">
            <CardHeader>
              <CardTitle className="text-sm">Debug Information</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2">
              <div>Last Refresh: {lastRefresh.toLocaleTimeString()}</div>
              <div>SignalR Status: {signalRStatus.connectionStatus}</div>
              <div>SignalR Loading: {signalRLoading ? 'Yes' : 'No'}</div>
              <div>Results Count: {results.length}</div>
              <div>Total Votes: {totalVotes}</div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}