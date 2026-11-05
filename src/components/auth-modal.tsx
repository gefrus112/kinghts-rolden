"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AuthUser } from "@/lib/types";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: "signin" | "signup";
  onSuccess: (user: AuthUser) => void;
}

export function AuthModal({ open, onOpenChange, initialTab = "signin", onSuccess }: AuthModalProps) {
  // The parent remounts this component (via `key`) with the right tab on open,
  // so a plain useState initialiser is all that is needed.
  const [tab, setTab] = useState<string>(initialTab);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-emerald-950">Welcome to Kinghts Rolden</DialogTitle>
          <DialogDescription>
            Sign in to your club account, or create one — you can link your Chess.com username,
            or join without one.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-2 bg-emerald-50">
            <TabsTrigger value="signin">Sign in</TabsTrigger>
            <TabsTrigger value="signup">Create account</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <SignInForm onSuccess={onSuccess} onDone={() => onOpenChange(false)} />
          </TabsContent>
          <TabsContent value="signup">
            <SignUpForm onSuccess={onSuccess} onDone={() => onOpenChange(false)} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function useSubmit() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return { busy, setBusy, error, setError };
}

function SignInForm({ onSuccess, onDone }: { onSuccess: (u: AuthUser) => void; onDone: () => void }) {
  const { busy, setBusy, error, setError } = useSubmit();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const body = (await res.json()) as { user?: AuthUser; error?: string };
      if (!res.ok || !body.user) {
        setError(body.error || "Sign in failed");
        return;
      }
      toast.success(`Welcome back, ${body.user.username}!`);
      onSuccess(body.user);
      onDone();
    } catch {
      setError("Network error — please try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signin-username">Username</Label>
        <Input
          id="signin-username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="your club username"
          autoComplete="username"
          required
          className="focus-visible:ring-emerald-500"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signin-password">Password</Label>
        <Input
          id="signin-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
          required
          className="focus-visible:ring-emerald-500"
        />
      </div>
      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
      <Button
        type="submit"
        disabled={busy}
        className="w-full bg-emerald-600 font-semibold text-white hover:bg-emerald-700"
      >
        {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Sign in
      </Button>
    </form>
  );
}

function SignUpForm({ onSuccess, onDone }: { onSuccess: (u: AuthUser) => void; onDone: () => void }) {
  const { busy, setBusy, error, setError } = useSubmit();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [chessUsername, setChessUsername] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          chessUsername: chessUsername || undefined,
        }),
      });
      const body = (await res.json()) as {
        user?: AuthUser;
        chessVerified?: boolean;
        error?: string;
      };
      if (!res.ok || !body.user) {
        setError(body.error || "Registration failed");
        return;
      }
      if (body.chessVerified) {
        toast.success(`Welcome to Kinghts Rolden, ${body.user.username}!`, {
          description: `Chess.com account “${body.user.chessUsername}” verified.`,
        });
      } else {
        toast.success(`Welcome to Kinghts Rolden, ${body.user.username}!`, {
          description: chessUsername
            ? "We couldn't reach Chess.com to verify your username just now — it has been linked anyway."
            : "You joined without linking a Chess.com account.",
        });
      }
      onSuccess(body.user);
      onDone();
    } catch {
      setError("Network error — please try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signup-username">Username</Label>
        <Input
          id="signup-username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="pick a club username"
          autoComplete="username"
          required
          className="focus-visible:ring-emerald-500"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-password">Password</Label>
        <Input
          id="signup-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="at least 6 characters"
          autoComplete="new-password"
          required
          minLength={6}
          className="focus-visible:ring-emerald-500"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-chess">
          Chess.com username{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="signup-chess"
          value={chessUsername}
          onChange={(e) => setChessUsername(e.target.value)}
          placeholder="your username on chess.com"
          className="focus-visible:ring-emerald-500"
        />
        <p className="text-xs text-muted-foreground">
          Link your Chess.com account so your club games show up on this site. We verify it
          against the Chess.com API.
        </p>
      </div>
      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
      <Button
        type="submit"
        disabled={busy}
        className="w-full bg-emerald-600 font-semibold text-white hover:bg-emerald-700"
      >
        {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Create account
      </Button>
    </form>
  );
}
