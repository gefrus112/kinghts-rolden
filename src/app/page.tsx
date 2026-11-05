"use client";

import { useCallback, useRef, useState } from "react";
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { MembersSidebar } from "@/components/members-sidebar";
import { LiveGames } from "@/components/live-games";
import { RecentGames } from "@/components/recent-games";
import { ClubInfo } from "@/components/club-info";
import { AuthModal } from "@/components/auth-modal";
import { Footer } from "@/components/footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  AuthUser,
  ClubInfoResponse,
  LiveGamesResponse,
  MembersResponse,
} from "@/lib/types";

type TabKey = "live" | "recent" | "about";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json() as Promise<T>;
}

export default function Home() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: true },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ClubPage />
    </QueryClientProvider>
  );
}

function ClubPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabKey>("live");
  const [pickedMember, setPickedMember] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"signin" | "signup">("signin");

  const watchSectionRef = useRef<HTMLDivElement>(null);

  const clubInfoQ = useQuery({
    queryKey: ["clubInfo"],
    queryFn: () => fetchJson<ClubInfoResponse>("/api/club/info"),
  });

  const membersQ = useQuery({
    queryKey: ["members"],
    queryFn: () => fetchJson<MembersResponse>("/api/club/members"),
  });

  const liveQ = useQuery({
    queryKey: ["live"],
    queryFn: () => fetchJson<LiveGamesResponse>("/api/club/live"),
    refetchInterval: 60_000,
  });

  const meQ = useQuery({
    queryKey: ["me"],
    queryFn: () => fetchJson<{ user: AuthUser | null }>("/api/auth/me"),
    staleTime: 5 * 60_000,
  });

  const members = membersQ.data?.members ?? [];
  const user = meQ.data?.user ?? null;

  // Derived selection: falls back to the first member so the Recent tab is ready
  const selectedMember = pickedMember ?? (members.length > 0 ? members[0].username : null);

  const handleSelectMember = useCallback((username: string) => {
    setPickedMember(username);
    setTab("recent");
    watchSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleNav = useCallback((section: "watch" | "players" | "about") => {
    if (section === "about") setTab("about");
    if (section === "watch") setTab("live");
    if (section === "players") {
      document.getElementById("players")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    watchSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const openAuth = useCallback((t: "signin" | "signup") => {
    setAuthTab(t);
    setAuthOpen(true);
  }, []);

  const handleAuthSuccess = useCallback(
    (u: AuthUser) => {
      queryClient.setQueryData(["me"], { user: u });
      setAuthOpen(false);
    },
    [queryClient],
  );

  const handleSignOut = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      queryClient.setQueryData(["me"], { user: null });
      toast("Signed out. See you on the board!");
    } catch {
      toast.error("Could not sign out — please try again");
    }
  }, [queryClient]);

  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAF7]">
      <Navbar user={user} onOpenAuth={openAuth} onSignOut={handleSignOut} onNav={handleNav} />

      <main className="flex-1">
        <Hero
          clubInfo={clubInfoQ.data ?? null}
          liveCount={liveQ.data?.games?.length ?? 0}
          membersLoading={membersQ.isPending}
          onWatch={() => handleNav("watch")}
        />

        <div ref={watchSectionRef} className="scroll-mt-20">
          <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
            <div className="grid gap-6 lg:grid-cols-[330px_minmax(0,1fr)]">
              <MembersSidebar
                members={members}
                loading={membersQ.isPending}
                error={membersQ.error instanceof Error ? membersQ.error.message : null}
                selected={selectedMember}
                onSelect={handleSelectMember}
                onRefresh={() => membersQ.refetch()}
              />

              <div className="min-w-0">
                <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
                  <TabsList className="mb-4 grid w-full max-w-md grid-cols-3 bg-emerald-50 p-1">
                    <TabsTrigger
                      value="live"
                      className="data-[state=active]:bg-white data-[state=active]:text-emerald-900"
                    >
                      Live Games
                      {liveQ.data?.games?.length ? (
                        <span className="ml-1.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                          {liveQ.data.games.length}
                        </span>
                      ) : null}
                    </TabsTrigger>
                    <TabsTrigger
                      value="recent"
                      className="data-[state=active]:bg-white data-[state=active]:text-emerald-900"
                    >
                      Recent Games
                    </TabsTrigger>
                    <TabsTrigger
                      value="about"
                      className="data-[state=active]:bg-white data-[state=active]:text-emerald-900"
                    >
                      About & Join
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="live" className="mt-0">
                    <LiveGames
                      data={liveQ.data ?? null}
                      loading={liveQ.isFetching}
                      onRefresh={() => liveQ.refetch()}
                    />
                  </TabsContent>
                  <TabsContent value="recent" className="mt-0">
                    <RecentGames
                      members={members}
                      selectedMember={selectedMember}
                      onSelectMember={handleSelectMember}
                    />
                  </TabsContent>
                  <TabsContent value="about" className="mt-0">
                    <ClubInfo clubInfo={clubInfoQ.data ?? null} user={user} onOpenAuth={openAuth} />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer
        clubUrl={clubInfoQ.data?.clubUrl || "https://www.chess.com/club/kinghts-rolden"}
        joinUrl={clubInfoQ.data?.joinUrl || "https://www.chess.com/club/join/1115308"}
        onOpenAuth={() => openAuth("signin")}
      />

      <AuthModal
        key={authTab}
        open={authOpen}
        onOpenChange={setAuthOpen}
        initialTab={authTab}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
