"use client";

import { useState, useEffect } from "react";
import { TrendingUp, Users, Calendar, FileText, CheckCircle, Clock, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const Twitter = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

interface StatCard {
  label: string;
  value: string | number;
  change: string;
  positive: boolean;
  icon: any;
  colorClass: string;
}

export default function AnalyticsPage() {
  const [twitterStats, setTwitterStats] = useState<{ followers: number; following: number; tweets: number } | null>(null);
  const [dbStats, setDbStats] = useState<{ scheduled: number; drafts: number; posted: number }>({ scheduled: 0, drafts: 0, posted: 0 });
  const [recentTweets, setRecentTweets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAllMetrics = async () => {
      setIsLoading(true);
      try {
        // 1. Fetch live Twitter stats
        const twitterRes = await fetch('/api/twitter/user');
        if (twitterRes.ok) {
          const tData = await twitterRes.json();
          setTwitterStats({
            followers: tData.followersCount || 0,
            following: tData.followingCount || 0,
            tweets: tData.tweetCount || 0
          });
        }

        // 2. Fetch Supabase queue stats
        const { data: dbData, error } = await supabase
          .from('tweets')
          .select('status, content, created_at, scheduled_for');
        
        if (!error && dbData) {
          const stats = dbData.reduce((acc, curr) => {
            if (curr.status === 'Scheduled') acc.scheduled++;
            else if (curr.status === 'Draft') acc.drafts++;
            else if (curr.status === 'Posted') acc.posted++;
            return acc;
          }, { scheduled: 0, drafts: 0, posted: 0 });
          setDbStats(stats);

          // Get latest 3 items to show as recent activities
          const sorted = [...dbData].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          setRecentTweets(sorted.slice(0, 3));
        }
      } catch (err) {
        console.error("Failed to load analytics metrics:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllMetrics();
  }, []);

  const statsList: StatCard[] = [
    { 
      label: "X Followers", 
      value: twitterStats ? twitterStats.followers.toLocaleString() : "...", 
      change: "+Live", 
      positive: true, 
      icon: Users,
      colorClass: "bg-blue-500/10 text-blue-400 border-blue-500/20"
    },
    { 
      label: "Scheduled Posts", 
      value: dbStats.scheduled, 
      change: "Active Queue", 
      positive: true, 
      icon: Clock,
      colorClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
    },
    { 
      label: "Saved Drafts", 
      value: dbStats.drafts, 
      change: "Ready to edit", 
      positive: true, 
      icon: FileText,
      colorClass: "bg-amber-500/10 text-amber-400 border-amber-500/20"
    },
    { 
      label: "Posted via App", 
      value: dbStats.posted, 
      change: "Sent to X", 
      positive: true, 
      icon: CheckCircle,
      colorClass: "bg-purple-500/10 text-purple-400 border-purple-500/20"
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">Analytics Overview</h1>
        <p className="text-muted-foreground text-sm">Track your dynamic growth, pipeline statistics, and live X public metrics.</p>
      </div>

      {isLoading ? (
        <div className="min-h-[400px] flex flex-col items-center justify-center text-center">
          <Sparkles className="w-8 h-8 animate-spin mb-4 text-primary" />
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">Compiling Pipeline Stats</p>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {statsList.map((stat, index) => (
              <div 
                key={index} 
                className="bg-card border border-border/80 rounded-xl p-5 shadow-sm hover:border-primary/30 transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={cn("p-2 rounded-lg border", stat.colorClass)}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                    stat.positive ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" : "text-red-500 bg-red-500/10 border-red-500/20"
                  )}>
                    {stat.change}
                  </span>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1 font-semibold uppercase tracking-wider">{stat.label}</p>
                  <h3 className="text-2xl font-bold text-foreground">{stat.value}</h3>
                </div>
              </div>
            ))}
          </div>

          {/* Posting Pipeline Activity Visualizer */}
          <div className="bg-card border border-border/80 rounded-xl p-6 shadow-sm flex flex-col gap-4">
            <div>
              <h3 className="font-semibold text-base mb-1">Queue Pipeline Distribution</h3>
              <p className="text-muted-foreground text-xs">Visual breakdown of your content catalog: Drafts vs. Scheduled vs. Published.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6 items-center p-6 border border-border/50 rounded-xl bg-background/30">
              {/* Custom SVG Gauge Chart */}
              <div className="w-36 h-36 shrink-0 relative flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background Circle */}
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                  
                  {/* Drafts arc */}
                  <circle 
                    cx="50" cy="50" r="40" 
                    fill="transparent" 
                    stroke="rgba(245,158,11,0.5)" 
                    strokeWidth="8" 
                    strokeDasharray="251.2" 
                    strokeDashoffset={251.2 - (251.2 * (dbStats.drafts / Math.max(dbStats.drafts + dbStats.scheduled + dbStats.posted, 1)))} 
                  />
                  {/* Scheduled arc */}
                  <circle 
                    cx="50" cy="50" r="40" 
                    fill="transparent" 
                    stroke="rgba(16,185,129,0.5)" 
                    strokeWidth="8" 
                    strokeDasharray="251.2" 
                    strokeDashoffset={251.2 - (251.2 * (dbStats.scheduled / Math.max(dbStats.drafts + dbStats.scheduled + dbStats.posted, 1)))} 
                    className="transform rotate-90 origin-center"
                  />
                </svg>
                <div className="absolute text-center flex flex-col items-center">
                  <span className="text-xl font-bold text-foreground">{dbStats.scheduled + dbStats.drafts + dbStats.posted}</span>
                  <span className="text-[8px] uppercase tracking-wider text-muted-foreground">Total Posts</span>
                </div>
              </div>

              {/* Progress bars & Legend */}
              <div className="flex-1 w-full space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1 font-semibold">
                    <span className="text-amber-400 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> Drafts ({dbStats.drafts})</span>
                    <span className="text-muted-foreground">{Math.round((dbStats.drafts / Math.max(dbStats.drafts + dbStats.scheduled + dbStats.posted, 1)) * 100)}%</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(dbStats.drafts / Math.max(dbStats.drafts + dbStats.scheduled + dbStats.posted, 1)) * 100}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1 font-semibold">
                    <span className="text-emerald-400 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Scheduled Queue ({dbStats.scheduled})</span>
                    <span className="text-muted-foreground">{Math.round((dbStats.scheduled / Math.max(dbStats.drafts + dbStats.scheduled + dbStats.posted, 1)) * 100)}%</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(dbStats.scheduled / Math.max(dbStats.drafts + dbStats.scheduled + dbStats.posted, 1)) * 100}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1 font-semibold">
                    <span className="text-purple-400 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-500" /> Published ({dbStats.posted})</span>
                    <span className="text-muted-foreground">{Math.round((dbStats.posted / Math.max(dbStats.drafts + dbStats.scheduled + dbStats.posted, 1)) * 100)}%</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: `${(dbStats.posted / Math.max(dbStats.drafts + dbStats.scheduled + dbStats.posted, 1)) * 100}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Queue Additions */}
          <div className="bg-card border border-border/80 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border bg-background/30 flex justify-between items-center">
              <span className="font-semibold text-sm">Recent Additions to Queue & Drafts</span>
            </div>
            {recentTweets.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground opacity-50">
                <Twitter className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="text-sm">No items in your database pipeline yet. Generate and save a post first!</p>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {recentTweets.map((post, idx) => {
                  let tweetsList = [post.content];
                  try {
                    if (post.content.startsWith('[')) {
                      tweetsList = JSON.parse(post.content);
                    }
                  } catch (e) {}

                  return (
                    <div key={idx} className="p-5 hover:bg-background/20 transition-colors flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground/90 whitespace-pre-wrap line-clamp-2 leading-relaxed">{tweetsList[0]}</p>
                        <span className="text-[10px] text-muted-foreground mt-2 block font-medium">
                          Created at: {new Date(post.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={cn(
                          "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border",
                          post.status === "Scheduled" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                          post.status === "Posted" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" : "bg-muted text-muted-foreground border-border"
                        )}>
                          {post.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
