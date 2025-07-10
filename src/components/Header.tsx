import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export default function Header() {
  return (
    <header className="bg-card shadow-md">
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 text-primary">
          <ShieldCheck className="h-8 w-8" />
          <span className="text-2xl font-bold font-headline tracking-tighter">
            PollPulse
          </span>
        </Link>
        <p className="hidden md:block text-sm text-muted-foreground">Your Vote, Your Voice.</p>
      </nav>
    </header>
  );
}
