'use client';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Calendar, Users, Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { getActiveElections } from '@/lib/api';
import type { Election } from '@/types';

export default function Home() {
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchElections = async () => {
      try {
        const data = await getActiveElections();
        setElections(data);
      } catch (err) {
        setError('Failed to load elections. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchElections();
  }, []);

  const now = new Date();
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-primary">Active Elections</h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Browse through the list of ongoing elections. Cast your vote in active elections or view the results of past ones.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
           <div className="text-center text-destructive bg-destructive/10 p-4 rounded-md">{error}</div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {elections.map((election) => {
              const isActive = new Date(election.startDate) <= now && new Date(election.endDate) >= now;
              return (
                <Card key={election.id} className="flex flex-col hover:shadow-xl transition-shadow duration-300">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-2xl font-headline">{election.title}</CardTitle>
                      <Badge variant={isActive ? 'default' : 'secondary'} className={isActive ? 'bg-green-500 text-white' : ''}>
                        {isActive ? 'Active' : 'Finished'}
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
                  </CardContent>
                  <CardFooter>
                    {isActive ? (
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
        )}
      </main>
    </div>
  );
}
