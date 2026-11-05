"use client";

import { useState } from "react";
import { ChevronDown, LogOut, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { KnightLogo } from "@/components/knight-logo";
import { initialsAvatarColor } from "@/lib/format";
import type { AuthUser } from "@/lib/types";

interface NavbarProps {
  user: AuthUser | null;
  onOpenAuth: (tab: "signin" | "signup") => void;
  onSignOut: () => void;
  onNav: (section: "watch" | "players" | "about") => void;
}

export function Navbar({ user, onOpenAuth, onSignOut, onNav }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: Array<{ key: "watch" | "players" | "about"; label: string }> = [
    { key: "watch", label: "Watch Games" },
    { key: "players", label: "Players" },
    { key: "about", label: "About & Join" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-emerald-100 bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="flex items-center gap-2.5 rounded-md outline-none ring-emerald-500 focus-visible:ring-2"
          aria-label="Kinghts Rolden — back to top"
        >
          <KnightLogo size={38} />
          <span className="flex flex-col items-start leading-tight">
            <span className="text-base font-bold tracking-tight text-emerald-950">
              Kinghts Rolden
            </span>
            <span className="text-[10px] font-medium uppercase tracking-widest text-emerald-600">
              Chess Club
            </span>
          </span>
        </button>

        <div className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Button
              key={item.key}
              variant="ghost"
              size="sm"
              onClick={() => onNav(item.key)}
              className="text-sm font-medium text-emerald-900 hover:bg-emerald-50 hover:text-emerald-700"
            >
              {item.label}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 py-1 pl-1 pr-2.5 outline-none ring-emerald-500 transition hover:bg-emerald-100 focus-visible:ring-2"
                  aria-label="Account menu"
                >
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white ${initialsAvatarColor(user.username)}`}
                  >
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                  <span className="hidden max-w-[120px] truncate text-sm font-medium text-emerald-950 sm:block">
                    {user.username}
                  </span>
                  <ChevronDown className="h-4 w-4 text-emerald-700" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex flex-col">
                  <span>{user.username}</span>
                  {user.chessUsername ? (
                    <span className="text-xs font-normal text-muted-foreground">
                      Chess.com: {user.chessUsername}
                    </span>
                  ) : (
                    <span className="text-xs font-normal text-muted-foreground">
                      No Chess.com account linked
                    </span>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {user.chessUsername && (
                  <DropdownMenuItem asChild>
                    <a
                      href={`https://www.chess.com/member/${user.chessUsername}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cursor-pointer"
                    >
                      <UserRound className="mr-2 h-4 w-4" />
                      View Chess.com profile
                    </a>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={onSignOut}
                  className="cursor-pointer text-red-600 focus:text-red-700"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenAuth("signin")}
                className="text-sm font-medium text-emerald-900 hover:bg-emerald-50"
              >
                Sign in
              </Button>
              <Button
                size="sm"
                onClick={() => onOpenAuth("signup")}
                className="bg-emerald-600 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Join us
              </Button>
            </div>
          )}

          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle navigation"
            aria-expanded={mobileOpen}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {mobileOpen ? (
                <>
                  <line x1="6" y1="6" x2="18" y2="18" />
                  <line x1="18" y1="6" x2="6" y2="18" />
                </>
              ) : (
                <>
                  <line x1="4" y1="7" x2="20" y2="7" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="17" x2="20" y2="17" />
                </>
              )}
            </svg>
          </Button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="border-t border-emerald-100 bg-white px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {navItems.map((item) => (
              <Button
                key={item.key}
                variant="ghost"
                size="sm"
                className="justify-start text-sm font-medium text-emerald-900"
                onClick={() => {
                  setMobileOpen(false);
                  onNav(item.key);
                }}
              >
                {item.label}
              </Button>
            ))}
            {!user && (
              <div className="mt-2 flex gap-2 border-t border-emerald-100 pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setMobileOpen(false);
                    onOpenAuth("signin");
                  }}
                >
                  Sign in
                </Button>
                <Button
                  size="sm"
                  className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
                  onClick={() => {
                    setMobileOpen(false);
                    onOpenAuth("signup");
                  }}
                >
                  Join us
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
