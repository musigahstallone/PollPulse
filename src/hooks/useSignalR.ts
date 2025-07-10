// src/hooks/useSignalR.ts
import { useState, useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import type { VoteResult } from '@/types';
import { getElectionResults } from '@/lib/api';

type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

export function useSignalR(electionId: number, token: string | null, isElectionActive?: boolean) {
  const [results, setResults] = useState<VoteResult[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [isPulsing, setIsPulsing] = useState(false);
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  useEffect(() => {
    // Only proceed if we have the necessary data
    if (!token || !electionId || typeof isElectionActive === 'undefined') {
        setConnectionStatus('disconnected');
        return;
    }
    
    // Fetch initial results once, especially for inactive elections
    const fetchInitialResults = async () => {
        try {
            const initialResults = await getElectionResults(electionId, token);
            setResults(initialResults);
        } catch (error) {
            console.error("Failed to fetch initial results:", error);
        }
    };
    fetchInitialResults();

    // If the election is not active, we don't need a real-time connection.
    if (!isElectionActive) {
        setConnectionStatus('disconnected');
        return;
    }

    // Initialize SignalR connection
    const hubUrl = `${process.env.NEXT_PUBLIC_API_URL}/votehub`;
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, { accessTokenFactory: () => token })
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
      if (newConnection) {
          setConnectionStatus(stateMap[newConnection.state]);
      }
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
      newConnection.invoke("GetLiveResults", electionId).catch(err => console.error("Error getting live results on reconnect:", err));
    });
    newConnection.onclose(() => updateStatus());

    newConnection.start()
      .then(() => {
        updateStatus();
        console.log("SignalR Connected.");
        newConnection.invoke("JoinElectionGroup", electionId).catch(err => console.error("Error joining group:", err));
        newConnection.invoke("GetLiveResults", electionId).catch(err => console.error("Error getting live results:", err));
      })
      .catch(err => {
        console.error("SignalR Connection Error: ", err);
        updateStatus();
      });

    // Cleanup function to stop the connection when the component unmounts
    return () => {
      if (connectionRef.current) {
        connectionRef.current.stop().then(() => console.log("SignalR connection stopped."));
        connectionRef.current = null;
      }
    };
  }, [electionId, token, isElectionActive]); // Dependency array is key to stability

  return { results, connectionStatus, isPulsing };
}
