'use client';
import Link from 'next/link';
import { LogIn, LogOut, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="bg-card shadow-md">
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 text-primary">
          <ShieldCheck className="h-8 w-8" />
          <span className="text-2xl font-bold font-headline tracking-tighter">
            PollPulse
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <p className="hidden md:block text-sm text-muted-foreground">Your Vote, Your Voice.</p>
          {isAuthenticated ? (
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                     <AvatarFallback>{user?.firstName?.[0]}{user?.lastName?.[0]}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm">
                  <Link href="/login">
                      <LogIn className="mr-2 h-4 w-4" />
                      Login
                  </Link>
              </Button>
              <Button asChild size="sm">
                  <Link href="/register">
                      <User className="mr-2 h-4 w-4" />
                      Register
                  </Link>
              </Button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
