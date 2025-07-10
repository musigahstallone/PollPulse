// src/app/admin/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/context/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, BarChart, HardDrive, Loader2, Users } from 'lucide-react';
import CreateElectionForm from '@/components/admin/CreateElectionForm';
import ManageElections from '@/components/admin/ManageElections';
import VoteRecords from '@/components/admin/VoteRecords';

function DashboardStats() {
    // This component is a placeholder for now.
    // It will be connected to a real API endpoint later.
    const stats = [
        { title: 'Active Elections', value: '0', icon: BarChart, color: 'text-primary' },
        { title: 'Online Users', value: '0', icon: Users, color: 'text-green-500' },
        { title: 'Total Votes Today', value: '0', icon: HardDrive, color: 'text-yellow-500' },
    ];

    return (
        <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {stats.map((stat, index) => (
                    <Card key={index}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                            <stat.icon className={`h-4 w-4 text-muted-foreground ${stat.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>
            <div className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>A log of recent system events. (Placeholder)</CardDescription>
                    </CardHeader>
                    <CardContent className="h-64 overflow-y-auto">
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            <Activity className="h-8 w-8 mr-4" />
                            <p>Recent activity will be shown here when the API is connected.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </CardContent>
    );
}


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
        
        <Tabs defaultValue="dashboard">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="manage-elections">Manage Elections</TabsTrigger>
            <TabsTrigger value="create-election">Create Election</TabsTrigger>
            <TabsTrigger value="vote-records">Vote Records</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <Card>
                <CardHeader>
                    <CardTitle>System Overview</CardTitle>
                    <CardDescription>
                        A quick look at the current status of the voting system.
                    </CardDescription>
                </CardHeader>
                <DashboardStats />
            </Card>
          </TabsContent>
          
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
