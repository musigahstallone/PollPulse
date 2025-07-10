'use client';

import type { VoteResult, Election } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, TrendingUp } from "lucide-react";

interface ResultsDisplayProps {
    results: VoteResult[];
    election: Election;
    showLeaderOnly?: boolean;
    showFullResults?: boolean;
    isLive?: boolean;
    onVoteCast?: (voteResult: VoteResult) => void;
}

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export default function ResultsDisplay({ results, election, showLeaderOnly = false }: ResultsDisplayProps) {

    const chartData = results.map(r => ({
        name: r.candidateName,
        votes: r.voteCount,
        percentage: r.percentage,
    })).sort((a, b) => b.votes - a.votes);

    const winner = chartData[0];
    const totalVotes = results.reduce((sum, result) => sum + result.voteCount, 0);

    if (showLeaderOnly) {
        return (
            <Card className="mt-8">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><TrendingUp className="text-primary" /> Live Leaderboard</CardTitle>
                    <CardDescription>Current standings in the {election.title}.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Rank</TableHead>
                                <TableHead>Candidate</TableHead>
                                <TableHead className="text-right">Votes</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {chartData.map((result, index) => (
                                <TableRow key={result.name} className={index === 0 ? "bg-accent" : ""}>
                                    <TableCell className="font-medium">{index + 1}</TableCell>
                                    <TableCell>{result.name}</TableCell>
                                    <TableCell className="text-right font-semibold">{result.votes.toLocaleString()}</TableCell>
                                </TableRow>
                            ))}
                            {chartData.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center">No votes have been cast yet.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-8">
            {winner && totalVotes > 0 && (
                <Card className="bg-gradient-to-r from-yellow-100 to-amber-200 dark:from-yellow-900 dark:to-amber-800 border-accent">
                    <CardHeader className="flex flex-row items-center gap-4">
                        <Trophy className="h-10 w-10 text-amber-500" />
                        <div>
                            <CardTitle className="text-2xl text-amber-800 dark:text-amber-200">Election Winner</CardTitle>
                            <p className="text-xl font-bold text-foreground">{winner.name}</p>
                            <p className="text-sm text-muted-foreground">with {winner.votes.toLocaleString()} votes ({winner.percentage.toFixed(2)}%)</p>
                        </div>
                    </CardHeader>
                </Card>
            )}

            <div className="grid md:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Vote Distribution</CardTitle>
                        <CardDescription>Visual breakdown of the vote share.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Tooltip
                                    cursor={{ fill: 'hsl(var(--muted))' }}
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--background))',
                                        borderColor: 'hsl(var(--border))',
                                        borderRadius: 'var(--radius)',
                                    }}
                                />
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="votes"
                                    nameKey="name"
                                    label={(entry) => `${entry.name} (${entry.percentage.toFixed(1)}%)`}
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Detailed Results</CardTitle>
                        <CardDescription>The final vote count for each candidate.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Candidate</TableHead>
                                    <TableHead className="text-right">Votes</TableHead>
                                    <TableHead className="text-right">%</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {chartData.map((result, index) => (
                                    <TableRow key={result.name} className={index === 0 ? "bg-accent" : ""}>
                                        <TableCell className="font-medium">{index + 1}. {result.name}</TableCell>
                                        <TableCell className="text-right">{result.votes.toLocaleString()}</TableCell>
                                        <TableCell className="text-right">{result.percentage.toFixed(2)}%</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
