import { Loader2, ShieldCheck } from 'lucide-react';

export default function LoadingSpinner({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex flex-col justify-center items-center min-h-[50vh] gap-4">
      <div className="relative flex justify-center items-center">
        <Loader2 className="h-24 w-24 animate-spin text-primary opacity-20" />
        <ShieldCheck className="h-12 w-12 absolute text-primary" />
      </div>
      <p className="text-lg text-muted-foreground animate-pulse">{text}</p>
    </div>
  );
}
