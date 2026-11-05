"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Eye, Home, UserRoundPlus, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Footer, Navbar } from "@/components/site/navbar";
import { HomePanel } from "@/components/site/home-panel";
import { MembersPanel } from "@/components/site/members-panel";
import { WatchPanel } from "@/components/site/watch-panel";
import { JoinPanel } from "@/components/site/join-panel";
import type { ClubData, MembersData, SessionInfo } from "@/lib/types";

type TabKey = "home" | "members" | "watch" | "join";

export default function Page() {
  const [tab, setTab] = useState<TabKey>("home");
  const [clubData, setClubData] = useState<ClubData | null>(null);
  const [membersData, setMembersData] = useState<MembersData | null>(null);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [watchPlayer, setWatchPlayer] = useState<string | null>(null);
  const watchPlayerRef = useRef<string | null>(null);

  const loadClubAndMembers = useCallback(async () => {
    try {
      const [clubRes, membersRes] = await Promise.all([
        fetch("/api/club"),
        fetch("/api/members"),
      ]);
      if (clubRes.ok) setClubData((await clubRes.json()) as ClubData);
      if (membersRes.ok)
        setMembersData((await membersRes.json()) as MembersData);
    } catch {
      // Silent — the UI shows offline fallbacks via initial API errors too.
    }
  }, []);

  useEffect(() => {
    // Mount-time data loading (async fetch → setState after await is intentional).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadClubAndMembers();
    void (async () => {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();
        setSession(data.session ?? null);
      } catch {
        /* not signed in */
      }
    })();
    const interval = setInterval(() => void loadClubAndMembers(), 60_000);
    return () => clearInterval(interval);
  }, [loadClubAndMembers]);

  const openWatchFor = useCallback((username: string) => {
    watchPlayerRef.current = username;
    setWatchPlayer(username);
    setTab("watch");
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-emerald-50/70 via-white to-white">
      <Navbar
        hasLive={(clubData?.matches.filter((m) => m.status === "in_progress").length ?? 0) > 0}
        onJoin={() => setTab("join")}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-5 sm:px-6 sm:py-7">
        <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
          {/* Left panel — all players in the club */}
          <aside className="hidden lg:block">
            <div className="sticky top-[84px] max-h-[calc(100vh-108px)]">
              <MembersPanel
                clubData={clubData}
                membersData={membersData}
                session={session}
                onViewGames={openWatchFor}
                onRefresh={() => void loadClubAndMembers()}
              />
            </div>
          </aside>

          {/* Main content */}
          <div className="min-w-0">
            <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
              <TabsList className="mb-4 grid min-h-11 w-full grid-cols-2 gap-1 rounded-xl border border-emerald-100 bg-white p-1 sm:w-fit sm:grid-cols-4 lg:grid-cols-3">
                <TabsTrigger
                  value="home"
                  className="gap-1.5 rounded-lg text-xs font-semibold data-[state=active]:bg-emerald-600 data-[state=active]:text-white sm:text-sm"
                >
                  <Home className="h-3.5 w-3.5" /> Club
                </TabsTrigger>
                <TabsTrigger
                  value="watch"
                  className="gap-1.5 rounded-lg text-xs font-semibold data-[state=active]:bg-emerald-600 data-[state=active]:text-white sm:text-sm"
                >
                  <Eye className="h-3.5 w-3.5" /> Watch
                </TabsTrigger>
                <TabsTrigger
                  value="join"
                  className="gap-1.5 rounded-lg text-xs font-semibold data-[state=active]:bg-emerald-600 data-[state=active]:text-white sm:text-sm"
                >
                  <UserRoundPlus className="h-3.5 w-3.5" /> Join
                </TabsTrigger>
                <TabsTrigger
                  value="members"
                  className="gap-1.5 rounded-lg text-xs font-semibold data-[state=active]:bg-emerald-600 data-[state=active]:text-white sm:text-sm lg:hidden"
                >
                  <Users className="h-3.5 w-3.5" /> Players
                </TabsTrigger>
              </TabsList>

              <TabsContent value="home" className="mt-0 focus-visible:outline-none">
                <HomePanel
                  clubData={clubData}
                  membersData={membersData}
                  session={session}
                  onWatch={() => setTab("watch")}
                  onJoin={() => setTab("join")}
                />
              </TabsContent>

              <TabsContent value="members" className="mt-0 focus-visible:outline-none lg:hidden">
                <div className="h-[calc(100vh-220px)] min-h-[480px]">
                  <MembersPanel
                    clubData={clubData}
                    membersData={membersData}
                    session={session}
                    onViewGames={openWatchFor}
                    onRefresh={() => void loadClubAndMembers()}
                  />
                </div>
              </TabsContent>

              <TabsContent value="watch" className="mt-0 focus-visible:outline-none">
                <WatchPanel
                  clubData={clubData}
                  membersData={membersData}
                  session={session}
                  initialPlayer={watchPlayer}
                  onConsumeRequest={() => setWatchPlayer(null)}
                />
              </TabsContent>

              <TabsContent value="join" className="mt-0 focus-visible:outline-none">
                <JoinPanel
                  session={session}
                  membersData={membersData}
                  onSessionChange={setSession}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
