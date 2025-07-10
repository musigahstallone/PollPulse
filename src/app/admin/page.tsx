// src/app/admin/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/context/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import CreateElectionForm from '@/components/admin/CreateElectionForm';
import ManageElections from '@/components/admin/ManageElections';
import VoteRecords from '@/components/admin/VoteRecords';

export default function AdminDashboard() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && !isLoading) {
      if (!isAuthenticated || user?.role !== 'Admin') {
        router.push('/');
      }
    }
  }, [isLoading, isAuthenticated, user, router, isClient]);

  if (isLoading || !isClient) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'Admin') {
    return null; // or a dedicated "Access Denied" component
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-primary">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage elections, candidates, and view voting data.</p>
        </div>
        
        <Tabs defaultValue="manage-elections">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="manage-elections">Manage Elections</TabsTrigger>
            <TabsTrigger value="create-election">Create Election</TabsTrigger>
            <TabsTrigger value="vote-records">Vote Records</TabsTrigger>
          </TabsList>

          <TabsContent value="manage-elections">
            <Card>
              <CardHeader>
                <CardTitle>Manage Existing Elections</CardTitle>
                <CardDescription>
                  Start, stop, and add candidates to elections.
                </CardDescription>
              </CardHeader>
              <ManageElections />
            </Card>
          </TabsContent>

          <TabsContent value="create-election">
            <Card>
              <CardHeader>
                <CardTitle>Create a New Election</CardTitle>
                <CardDescription>
                  Set up a new election for the student body. Fill in the details below.
                </CardDescription>
              </CardHeader>
              <CreateElectionForm />
            </Card>
          </TabsContent>

          <TabsContent value="vote-records">
            <Card>
               <CardHeader>
                <CardTitle>Voter Records</CardTitle>
                <CardDescription>
                  View detailed voting records for each election. This feature requires a specific backend endpoint.
                </CardDescription>
              </CardHeader>
              <VoteRecords />
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
