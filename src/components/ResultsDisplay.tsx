'use client';

import type { VoteResult } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy } from "lucide-react";

interface ResultsDisplayProps {
  results: VoteResult[];
}

export default function ResultsDisplay({ results }: ResultsDisplayProps) {

  const chartData = results.map(r => ({
    name: r.candidateName,
    votes: r.voteCount
  }));

  const winner = results[0];

  return (
    <div className="space-y-8">
       {winner && (
         <Card className="bg-gradient-to-r from-yellow-100 to-amber-200 dark:from-yellow-900 dark:to-amber-800 border-accent">
           <CardHeader className="flex flex-row items-center gap-4">
            <Trophy className="h-10 w-10 text-amber-500" />
            <div>
              <CardTitle className="text-2xl text-amber-800 dark:text-amber-200">Election Winner</CardTitle>
              <p className="text-xl font-bold text-foreground">{winner.candidateName}</p>
              <p className="text-sm text-muted-foreground">with {winner.voteCount.toLocaleString()} votes ({winner.percentage.toFixed(2)}%)</p>
            </div>
          </CardHeader>
         </Card>
       )}

      <Card>
        <CardHeader>
          <CardTitle>Vote Distribution</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
              <YAxis dataKey="name" type="category" width={120} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted))' }}
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: 'var(--radius)',
                }}
              />
              <Legend />
              <Bar dataKey="votes" name="Total Votes" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Results</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Candidate</TableHead>
                <TableHead className="text-right">Votes</TableHead>
                <TableHead className="text-right">Percentage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result, index) => (
                <TableRow key={result.candidateId} className={index === 0 ? "bg-accent/10" : ""}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>{result.candidateName}</TableCell>
                  <TableCell className="text-right">{result.voteCount.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{result.percentage.toFixed(2)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
