
'use client';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Calendar, Users, CheckCircle, Clock } from 'lucide-react';
import Header from '@/components/Header';
import { format } from 'date-fns';
import { useEffect, useState, useCallback } from 'react';
import { getAllElections } from '@/lib/api';
import type { Election } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorDisplay from '@/components/ErrorDisplay';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const fetchElections = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all elections instead of just active ones
      const data = await getAllElections(token);
      // Sort elections: active first, then by end date descending
      const sortedData = data.sort((a, b) => {
        if (a.isActive && !b.isActive) return -1;
        if (!a.isActive && b.isActive) return 1;
        return new Date(b.endDate).getTime() - new Date(a.endDate).getTime();
      });
      setElections(sortedData);
    } catch (err: any) {
      setError(err.message || 'Failed to load elections. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchElections();
  }, [fetchElections]);

  const now = new Date();
  
  const renderContent = () => {
    if (loading) {
      return <LoadingSpinner text="Fetching elections..." />;
    }
    if (error) {
      return <ErrorDisplay 
                message={error} 
                onRetry={fetchElections} 
              />;
    }
    if (elections.length === 0) {
        return (
            <div className="text-center text-muted-foreground bg-card p-8 rounded-lg">
                <p className="text-lg">No elections have been scheduled yet.</p>
                <p>Please check back later!</p>
            </div>
        )
    }
    return (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {elections.map((election) => {
          const isFinished = new Date(election.endDate) < now || !election.isActive;
          return (
            <Card key={election.id} className="flex flex-col hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-2xl font-headline">{election.title}</CardTitle>
                  <Badge variant={election.isActive ? 'default' : 'secondary'} className={election.isActive ? 'bg-green-500 text-white' : ''}>
                    {election.isActive ? 'Active' : (election.resultsAnnounced ? 'Concluded' : 'Finished')}
                  </Badge>
                </div>
                <CardDescription className="pt-2">{election.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-4">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="mr-2 h-4 w-4" />
                  <span>{format(new Date(election.startDate), 'PPP')} - {format(new Date(election.endDate), 'PPP')}</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Users className="mr-2 h-4 w-4" />
                  <span>{election.candidates.length} candidates</span>
                </div>
                 {isFinished && (
                    <div className="flex items-center text-sm text-muted-foreground">
                        {election.resultsAnnounced ? <CheckCircle className="mr-2 h-4 w-4 text-primary" /> : <Clock className="mr-2 h-4 w-4"/> }
                        <span>
                            {election.resultsAnnounced 
                                ? `Results announced ${format(new Date(election.resultsAnnouncedAt!), 'PPP p')}`
                                : "Results pending"
                            }
                        </span>
                    </div>
                 )}
              </CardContent>
              <CardFooter>
                {election.isActive ? (
                  <Button asChild className="w-full">
                    <Link href={`/election/${election.id}`}>
                      Go to Election <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/election/${election.id}/results`}>
                      View Results
                    </Link>
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-primary">All Elections</h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Browse through the list of ongoing and past elections. Cast your vote or view results.
          </p>
        </div>
        {renderContent()}
      </main>
    </div>
  );
}
