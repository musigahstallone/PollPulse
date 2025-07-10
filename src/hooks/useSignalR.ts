import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import * as signalR from "@microsoft/signalr";
import type { VoteResult, CastVotePayload } from "@/types";
import { getElectionResults } from "@/lib/api";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Represents the current state of the SignalR connection
 */
export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected";

/**
 * Enhanced connection status with visual feedback capability for UI components
 */
export interface SignalRConnectionStatus {
  /** Current connection state (excludes 'connecting' for UI purposes) */
  connectionStatus: "connected" | "reconnecting" | "disconnected";
  /** Flag for UI animations (e.g., when new data arrives) */
  isPulsing: boolean;
}

/**
 * Abstraction layer over the raw SignalR connection for safer usage
 */
export interface SignalRConnection {
  /** Initiates the SignalR connection */
  start: () => Promise<void>;
  /** Terminates the SignalR connection */
  stop: () => Promise<void>;
  /** Registers event listeners for SignalR events */
  on: (eventName: string, callback: (...args: any[]) => void) => void;
  /** Removes event listeners for SignalR events */
  off: (eventName: string, callback?: (...args: any[]) => void) => void;
}

/**
 * High-level voting operations interface
 */
export interface SignalRHubMethods {
  /** Initiates an election on the server */
  startElection: (electionId: number) => Promise<void>;
  /** Terminates an election on the server */
  stopElection: (electionId: number) => Promise<void>;
  /** Submits a vote with the provided payload */
  castVote: (payload: CastVotePayload) => Promise<void>;
  /** Retrieves current voting results */
  getResults: (electionId: number) => Promise<VoteResult[]>;
}

/**
 * Complete hook return interface combining all functionality
 */
export interface SignalRHub {
  /** Low-level connection control */
  connection: SignalRConnection;
  /** Current connection status with UI feedback */
  status: SignalRConnectionStatus;
  /** High-level voting operations */
  methods: SignalRHubMethods;
  /** Current voting results */
  results: VoteResult[];
  /** Any connection errors */
  error: string | null;
  /** Whether the hook is currently loading initial data */
  isLoading: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Duration for pulsing animation in milliseconds */
const PULSE_DURATION = 1000;

/** Retry configuration for connection attempts */
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
};

// ============================================================================
// CUSTOM HOOK IMPLEMENTATION
// ============================================================================

/**
 * Custom hook to manage SignalR hub interactions for voting systems.
 * Provides real-time voting capabilities with automatic connection management,
 * authentication, and error handling.
 *
 * @param electionId - Unique identifier for the election
 * @param token - Authentication token (null if not authenticated)
 * @param isElectionActive - Boolean flag indicating if the election is currently running
 * @returns SignalRHub interface with connection, status, methods, and data
 */
export function useSignalR(
  electionId: number,
  token: string | null,
  isElectionActive: boolean
): SignalRHub {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  /** Current voting results from the server */
  const [results, setResults] = useState<VoteResult[]>([]);

  /** Connection status with UI feedback capabilities */
  const [status, setStatus] = useState<SignalRConnectionStatus>({
    connectionStatus: "disconnected",
    isPulsing: false,
  });

  /** Current error state, if any */
  const [error, setError] = useState<string | null>(null);

  /** Loading state for initial data fetch */
  const [isLoading, setIsLoading] = useState(false);

  /** Reference to the SignalR connection instance */
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  /** Reference to track if component is mounted (prevents memory leaks) */
  const isMountedRef = useRef(true);

  /** Reference to store cleanup functions */
  const cleanupRef = useRef<(() => void)[]>([]);

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Maps SignalR's internal connection states to our custom ConnectionStatus type
   * @param state - SignalR HubConnectionState
   * @returns Mapped ConnectionStatus
   */
  const mapHubState = useCallback(
    (state: signalR.HubConnectionState): ConnectionStatus => {
      switch (state) {
        case signalR.HubConnectionState.Connecting:
          return "connecting";
        case signalR.HubConnectionState.Connected:
          return "connected";
        case signalR.HubConnectionState.Reconnecting:
          return "reconnecting";
        default:
          return "disconnected";
      }
    },
    []
  );

  /**
   * Updates the connection status state with optional pulsing animation
   * @param state - SignalR HubConnectionState
   * @param pulsing - Whether to enable pulsing animation
   */
  const updateStatus = useCallback(
    (state: signalR.HubConnectionState, pulsing: boolean = false) => {
      if (!isMountedRef.current) return;

      const mappedStatus = mapHubState(state);
      // Filter out 'connecting' for UI status (not needed in the interface)
      const uiStatus =
        mappedStatus === "connecting" ? "disconnected" : mappedStatus;

      setStatus({
        connectionStatus:
          uiStatus as SignalRConnectionStatus["connectionStatus"],
        isPulsing: pulsing,
      });
    },
    [mapHubState]
  );

  /**
   * Handles errors with proper logging and state updates
   * @param error - Error object or message
   * @param context - Context where the error occurred
   */
  const handleError = useCallback((error: any, context: string) => {
    console.error(`SignalR Error [${context}]:`, error);

    if (!isMountedRef.current) return;

    const errorMessage =
      error?.message || error?.toString() || "Unknown error occurred";
    setError(`${context}: ${errorMessage}`);
    setIsLoading(false);
  }, []);

  /**
   * Clears the current error state
   */
  const clearError = useCallback(() => {
    if (!isMountedRef.current) return;
    setError(null);
  }, []);

  // ============================================================================
  // SIGNALR CONNECTION MANAGEMENT
  // ============================================================================

  /**
   * Main effect hook for managing SignalR connection lifecycle
   */
  useEffect(() => {
    // Reset mounted flag
    isMountedRef.current = true;

    // Early validation - ensure required parameters are present
    if (!electionId || typeof electionId !== "number") {
      handleError(new Error("Invalid election ID"), "Validation");
      updateStatus(signalR.HubConnectionState.Disconnected);
      return;
    }

    if (!token) {
      // Not an error - just not authenticated yet
      updateStatus(signalR.HubConnectionState.Disconnected);
      return;
    }

    // Clear any previous errors
    clearError();
    setIsLoading(true);

    /**
     * Fetches initial election results via HTTP API
     * This provides data even if SignalR connection fails
     */
    const fetchInitialResults = async () => {
      try {
        const initialResults = await getElectionResults(electionId, token);
        if (isMountedRef.current) {
          setResults(initialResults);
          setIsLoading(false);
        }
      } catch (error) {
        handleError(error, "Initial Data Fetch");
      }
    };

    // Always fetch initial results
    fetchInitialResults();

    // Skip SignalR connection for inactive elections
    if (!isElectionActive) {
      updateStatus(signalR.HubConnectionState.Disconnected);
      return;
    }

    /**
     * Creates and configures the SignalR connection
     */
    const createConnection = () => {
      const hubUrl = `${process.env.NEXT_PUBLIC_API_URL}/votehub`;

      if (!hubUrl.includes("http")) {
        handleError(
          new Error("Invalid API URL configuration"),
          "Configuration"
        );
        return null;
      }

      return new signalR.HubConnectionBuilder()
        .withUrl(hubUrl, {
          accessTokenFactory: () => token,
          // Add additional configuration for better reliability
          skipNegotiation: true,
          transport: signalR.HttpTransportType.WebSockets,
        })
        .withAutomaticReconnect([0, 2000, 10000, 30000]) // Custom retry delays
        .configureLogging(signalR.LogLevel.Information)
        .build();
    };

    const hub = createConnection();
    if (!hub) return;

    connectionRef.current = hub;

    // ============================================================================
    // SIGNALR EVENT HANDLERS
    // ============================================================================

    /**
     * Handles connection state changes during reconnection attempts
     */
    const handleReconnecting = (error?: Error) => {
      console.log("SignalR reconnecting...", error);
      updateStatus(signalR.HubConnectionState.Reconnecting);
      if (error) {
        handleError(error, "Reconnecting");
      }
    };

    /**
     * Handles successful reconnection with state restoration
     */
    const handleReconnected = async (connectionId?: string) => {
      console.log("SignalR reconnected", connectionId);

      if (!isMountedRef.current) return;

      updateStatus(signalR.HubConnectionState.Connected);
      clearError();

      try {
        // Rejoin the election group (important for receiving targeted messages)
        await hub.invoke("JoinElectionGroup", electionId);
        // Refresh results to sync with current state
        await hub.invoke("GetLiveResults", electionId);
      } catch (error) {
        handleError(error, "Reconnection Setup");
      }
    };

    /**
     * Handles connection termination
     */
    const handleConnectionClosed = (error?: Error) => {
      console.log("SignalR connection closed", error);
      updateStatus(signalR.HubConnectionState.Disconnected);

      if (error) {
        handleError(error, "Connection Closed");
      }
    };

    /**
     * Handles live voting results updates
     */
    const handleReceiveResults = (data: VoteResult[]) => {
      console.log("Received live results:", data);

      if (!isMountedRef.current) return;

      // Validate incoming data
      if (!Array.isArray(data)) {
        handleError(new Error("Invalid results format"), "Results Update");
        return;
      }

      setResults(data);
      clearError();

      // Trigger pulsing animation for visual feedback
      updateStatus(hub.state, true);

      // Automatically disable pulsing after specified duration
      const pulseTimeout = setTimeout(() => {
        if (isMountedRef.current) {
          updateStatus(hub.state, false);
        }
      }, PULSE_DURATION);

      // Store cleanup function
      cleanupRef.current.push(() => clearTimeout(pulseTimeout));
    };

    // Register event handlers
    hub.onreconnecting(handleReconnecting);
    hub.onreconnected(handleReconnected);
    hub.onclose(handleConnectionClosed);
    hub.on("ReceiveResults", handleReceiveResults);

    // ============================================================================
    // CONNECTION INITIALIZATION
    // ============================================================================

    /**
     * Starts the SignalR connection with proper error handling
     */
    const startConnection = async () => {
      try {
        updateStatus(signalR.HubConnectionState.Connecting);

        await hub.start();

        if (!isMountedRef.current) return;

        updateStatus(hub.state);
        clearError();

        // Post-connection setup
        await hub.invoke("JoinElectionGroup", electionId);
        await hub.invoke("GetLiveResults", electionId);

        console.log("SignalR connected successfully");
      } catch (error) {
        handleError(error, "Connection Start");
        updateStatus(signalR.HubConnectionState.Disconnected);
      }
    };

    // Initialize connection
    startConnection();

    // ============================================================================
    // CLEANUP FUNCTION
    // ============================================================================

    /**
     * Cleanup function to prevent memory leaks and ensure proper disconnection
     */
    return () => {
      isMountedRef.current = false;

      // Execute all cleanup functions
      cleanupRef.current.forEach((cleanup) => cleanup());
      cleanupRef.current = [];

      // Stop SignalR connection
      if (connectionRef.current) {
        connectionRef.current
          .stop()
          .catch((error) =>
            console.error("Error stopping SignalR connection:", error)
          );
        connectionRef.current = null;
      }

      console.log("SignalR hook cleanup completed");
    };
  }, [
    token,
    electionId,
    isElectionActive,
    updateStatus,
    handleError,
    clearError,
  ]);

  // ============================================================================
  // COMPONENT UNMOUNT CLEANUP
  // ============================================================================

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ============================================================================
  // EXPOSED INTERFACE
  // ============================================================================

  /**
   * Memoized connection wrapper for consistent reference
   * Provides safe access to connection methods with null checking
   */
  const connection: SignalRConnection = useMemo(
    () => ({
      start: async () => {
        if (!connectionRef.current) {
          throw new Error("Connection not initialized");
        }
        return connectionRef.current.start();
      },

      stop: async () => {
        if (!connectionRef.current) {
          throw new Error("Connection not initialized");
        }
        return connectionRef.current.stop();
      },

      on: (event: string, callback: (...args: any[]) => void) => {
        if (!connectionRef.current) {
          console.warn(
            "Cannot register event handler: connection not initialized"
          );
          return;
        }
        connectionRef.current.on(event, callback);
      },

      off: (event: string, callback?: (...args: any[]) => void) => {
        if (!connectionRef.current) {
          console.warn(
            "Cannot remove event handler: connection not initialized"
          );
          return;
        }
        connectionRef.current.off(event, callback);
      },
    }),
    []
  );

  /**
   * Memoized methods interface for consistent reference
   * Provides high-level voting operations with error handling
   */
  const methods: SignalRHubMethods = useMemo(
    () => ({
      startElection: async (eid: number) => {
        if (!connectionRef.current) {
          throw new Error("Connection not available");
        }

        clearError();

        try {
          await connectionRef.current.invoke("StartElection", eid);
          console.log(`Election ${eid} started successfully`);
        } catch (error) {
          handleError(error, "Start Election");
          throw error;
        }
      },

      stopElection: async (eid: number) => {
        if (!connectionRef.current) {
          throw new Error("Connection not available");
        }

        clearError();

        try {
          await connectionRef.current.invoke("StopElection", eid);
          console.log(`Election ${eid} stopped successfully`);
        } catch (error) {
          handleError(error, "Stop Election");
          throw error;
        }
      },

      castVote: async (payload: CastVotePayload) => {
        if (!connectionRef.current) {
          throw new Error("Connection not available");
        }

        // Validate payload
        if (!payload || typeof payload !== "object") {
          throw new Error("Invalid vote payload");
        }

        clearError();

        try {
          await connectionRef.current.invoke("SubmitVote", payload);
          console.log("Vote submitted successfully:", payload);
        } catch (error) {
          handleError(error, "Cast Vote");
          throw error;
        }
      },

      getResults: async (eid: number) => {
        if (!connectionRef.current) {
          // Fallback to HTTP API if SignalR not available
          try {
            if (token) {
              return await getElectionResults(eid, token);
            }
            return [];
          } catch (error) {
            handleError(error, "Get Results Fallback");
            return [];
          }
        }

        clearError();

        try {
          const fresh = await connectionRef.current.invoke<VoteResult[]>(
            "GetLiveResults",
            eid
          );
          return fresh || [];
        } catch (error) {
          handleError(error, "Get Results");
          // Fallback to HTTP API
          try {
            if (token) {
              return await getElectionResults(eid, token);
            }
            return [];
          } catch (fallbackError) {
            handleError(fallbackError, "Get Results Fallback");
            return [];
          }
        }
      },
    }),
    [clearError, handleError, token]
  );

  // ============================================================================
  // RETURN INTERFACE
  // ============================================================================

  return {
    connection,
    status,
    methods,
    results,
    error,
    isLoading,
  };
}
