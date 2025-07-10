'use client';

import { useState } from 'react';
import { CardContent } from '../ui/card';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Info } from 'lucide-react';

export default function VoteRecords() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // This component is a placeholder as the backend API spec
    // doesn't include an endpoint to fetch individual vote records.

    return (
        <CardContent>
            <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Feature Not Implemented</AlertTitle>
                <AlertDescription>
                    The backend API documentation provided does not specify an endpoint for administrators to view individual voter records.
                    This functionality can be fully implemented once the backend supports it.
                </AlertDescription>
            </Alert>
            <div className="mt-6 p-8 border-dashed border-2 rounded-lg text-center text-muted-foreground">
                <p>Vote record display area.</p>
                <p className="text-sm">When connected to a backend endpoint, this section will allow admins to select an election and view a list of all votes cast, including voter and candidate information.</p>
            </div>
        </CardContent>
    )
}
