import { elections } from "@/lib/data";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { notFound } from "next/navigation";
import type { VoteResult, Candidate } from "@/types";
import ResultsDisplay from "@/components/ResultsDisplay";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";


export default function ResultsPage({ params }: { params: { id: string } }) {
  const election = elections.find((e) => e.id === Number(params.id));

  if (!election) {
    notFound();
  }

  const totalVotes = election.candidates.reduce((sum, candidate) => sum + candidate.votes, 0);

  const results: VoteResult[] = election.candidates
    .map((candidate: Candidate) => ({
      candidateId: candidate.id,
      candidateName: `${candidate.firstName} ${candidate.lastName}`,
      position: candidate.position,
      voteCount: candidate.votes,
      percentage: totalVotes > 0 ? (candidate.votes / totalVotes) * 100 : 0,
    }))
    .sort((a, b) => b.voteCount - a.voteCount);

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
            <CardTitle className="text-3xl font-headline">Results: {election.title}</CardTitle>
            <CardDescription>
              Official vote tally for the {election.title}. A total of {totalVotes.toLocaleString()} votes were cast.
            </CardDescription>
          </CardHeader>
        </Card>
        
        <ResultsDisplay results={results} />
      </main>
    </div>
  );
}
