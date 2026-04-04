"use client";

import { signOut } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Topbar({ displayName, email }: { displayName: string | null; email: string }) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background px-4 md:px-6">
      <div className="md:hidden text-lg font-bold">Tailwinds</div>
      <div className="hidden md:block" />
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" className="gap-2 text-sm" />}
        >
          <span className="hidden sm:inline">{displayName || email}</span>
          <span className="inline sm:hidden">{(displayName || email).charAt(0).toUpperCase()}</span>
          <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem className="text-xs text-muted-foreground" disabled>
            {email}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => signOut()}
            variant="destructive"
          >
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
