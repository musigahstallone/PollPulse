'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { addCandidate, getAllElections, startElection, stopElection, announceResults } from '@/lib/api';
import type { Election, Candidate } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { PlayCircle, StopCircle, PlusCircle, Users, Calendar, Megaphone } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { format } from 'date-fns';
import { Badge } from '../ui/badge';
import LoadingSpinner from '../LoadingSpinner';
import ErrorDisplay from '../ErrorDisplay';
import { Loader2 } from 'lucide-react';


const addCandidateSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  studentId: z.string().min(1, 'Student ID is required'),
  position: z.string().min(1, 'Position is required'),
  platform: z.string().optional(),
});

function AddCandidateForm({ electionId, onCandidateAdded }: { electionId: number, onCandidateAdded: () => void }) {
  const { token } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof addCandidateSchema>>({
    resolver: zodResolver(addCandidateSchema),
    defaultValues: { firstName: '', lastName: '', studentId: '', position: '', platform: '' }
  });

  async function onSubmit(values: z.infer<typeof addCandidateSchema>) {
    if (!token) return;
    setIsLoading(true);
    try {
      await addCandidate({ ...values, electionId }, token);
      toast({ title: 'Success', description: 'Candidate added successfully' });
      onCandidateAdded();
      form.reset();
      setOpen(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><PlusCircle className="mr-2 h-4 w-4" /> Add Candidate</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Candidate</DialogTitle>
          <DialogDescription>Fill in the details for the new candidate.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="firstName" render={({ field }) => (<FormItem><FormLabel>First Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="lastName" render={({ field }) => (<FormItem><FormLabel>Last Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="studentId" render={({ field }) => (<FormItem><FormLabel>Student ID</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="position" render={({ field }) => (<FormItem><FormLabel>Position</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="platform" render={({ field }) => (<FormItem><FormLabel>Platform</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
            <Button type="submit" disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Add Candidate</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default function ManageElections() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  const fetchElections = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setError("You must be logged in to manage elections.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getAllElections(token);
      setElections(data);
    } catch (error: any) {
      setError(error.message || 'Could not fetch elections.');
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Could not fetch elections.' });
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    fetchElections();
  }, [fetchElections]);

  const handleAction = async (electionId: number, action: 'start' | 'stop' | 'announce', successMessage: string) => {
    if (!token) return;
    setActionLoading(prev => ({ ...prev, [`${action}-${electionId}`]: true }));
    try {
      let apiCall;
      switch (action) {
        case 'start': apiCall = startElection; break;
        case 'stop': apiCall = stopElection; break;
        case 'announce': apiCall = announceResults; break;
      }
      await apiCall(electionId, token);
      toast({ title: 'Success', description: successMessage });
      fetchElections(); // Refresh list
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setActionLoading(prev => ({ ...prev, [`${action}-${electionId}`]: false }));
    }
  }

  if (loading) {
    return (
      <CardContent>
        <LoadingSpinner text="Loading election data..." />
      </CardContent>
    );
  }

  if (error) {
    return (
      <CardContent>
        <ErrorDisplay message={error} onRetry={fetchElections} />
      </CardContent>
    )
  }

  return (
    <CardContent>
      <div className="space-y-4">
        {elections.length === 0 && <p className="text-muted-foreground text-center py-8">No elections found. Create one to get started!</p>}
        {elections.map((election) => (
          <Accordion type="single" collapsible key={election.id}>
            <AccordionItem value={`election-${election.id}`}>
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{election.title}</CardTitle>
                      <CardDescription>
                        <div className="flex items-center gap-4 mt-2">
                          <Badge variant={election.isActive ? 'default' : 'secondary'} className={election.isActive ? "bg-green-500" : ""}>{election.isActive ? 'Active' : 'Inactive'}</Badge>
                          <Badge variant={election.resultsAnnounced ? 'default' : 'secondary'} className={election.resultsAnnounced ? "bg-blue-500" : ""}>{election.resultsAnnounced ? 'Results Public' : 'Results Hidden'}</Badge>
                        </div>
                      </CardDescription>
                    </div>
                    <AccordionTrigger className="p-2 hover:no-underline" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="mr-2 h-4 w-4" />
                    <span>{format(new Date(election.startDate), 'PPP p')} - {format(new Date(election.endDate), 'PPP p')}</span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="mr-2 h-4 w-4" />
                    <span>{election.candidates.length} candidates</span>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-wrap gap-2 justify-between">
                  <div className="flex gap-2">
                    <Button
                      variant={election.isActive ? 'destructive' : 'default'}
                      size="sm"
                      onClick={() => handleAction(election.id, election.isActive ? 'stop' : 'start', `Election ${election.isActive ? 'stopped' : 'started'}.`)}
                      disabled={actionLoading[`start-${election.id}`] || actionLoading[`stop-${election.id}`]}
                    >
                      {actionLoading[`start-${election.id}`] || actionLoading[`stop-${election.id}`] ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> :
                        election.isActive ? <StopCircle className="mr-2 h-4 w-4" /> : <PlayCircle className="mr-2 h-4 w-4" />
                      }
                      {election.isActive ? 'Stop' : 'Start'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAction(election.id, 'announce', 'Results have been announced.')}
                      disabled={actionLoading[`announce-${election.id}`] || election.isActive || election.resultsAnnounced}
                    >
                      {actionLoading[`announce-${election.id}`] ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Megaphone className="mr-2 h-4 w-4" />}
                      Announce
                    </Button>
                  </div>
                  <AddCandidateForm electionId={election.id} onCandidateAdded={fetchElections} />
                </CardFooter>
              </Card>
              <AccordionContent className="p-4">
                <h4 className="font-semibold mb-2">Candidates</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Student ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {election.candidates.map((candidate: Candidate) => (
                      <TableRow key={candidate.id}>
                        <TableCell>{candidate.firstName} {candidate.lastName}</TableCell>
                        <TableCell>{candidate.position}</TableCell>
                        <TableCell>{candidate.studentId}</TableCell>
                      </TableRow>
                    ))}
                    {election.candidates.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center">No candidates added yet.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ))}
      </div>
    </CardContent>
  );
}
