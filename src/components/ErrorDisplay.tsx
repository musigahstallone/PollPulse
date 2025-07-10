import { AlertCircle, WifiOff } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface ErrorDisplayProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export default function ErrorDisplay({ 
  title = "Something Went Wrong", 
  message,
  onRetry
}: ErrorDisplayProps) {
  const isConnectionError = message.toLowerCase().includes('connect');

  return (
    <div className="flex items-center justify-center p-4">
        <Card className="w-full max-w-lg bg-destructive/5 border-destructive/20">
            <CardHeader className="text-center">
                <div className="mx-auto bg-destructive/10 rounded-full p-3 w-fit">
                    {isConnectionError ? (
                        <WifiOff className="h-10 w-10 text-destructive" />
                    ) : (
                        <AlertCircle className="h-10 w-10 text-destructive" />
                    )}
                </div>
                <CardTitle className="text-destructive mt-4">{isConnectionError ? 'Connection Error' : title}</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
                <p className="text-muted-foreground">{message}</p>
                {onRetry && (
                    <Button onClick={onRetry} variant="destructive" className="bg-destructive/80 hover:bg-destructive">
                        Try Again
                    </Button>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
