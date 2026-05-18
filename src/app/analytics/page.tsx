import { TrendingUp, Users, Eye, Heart, MessageCircle, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

const STATS = [
  { label: "Total Followers", value: "12,480", change: "+4.2%", positive: true, icon: Users },
  { label: "Impressions (30d)", value: "1.2M", change: "+12.5%", positive: true, icon: Eye },
  { label: "Engagement Rate", value: "4.8%", change: "-0.5%", positive: false, icon: Heart },
  { label: "Profile Visits", value: "8,940", change: "+2.1%", positive: true, icon: ArrowUpRight },
];

const TOP_POSTS = [
  {
    id: 1,
    content: "The biggest lie in software engineering: 'We will fix the tech debt later.' 🤡",
    likes: "4.2k",
    retweets: "856",
    replies: "124",
    impressions: "450k",
  },
  {
    id: 2,
    content: "10 React anti-patterns you need to stop using in 2024. A thread 🧵👇",
    likes: "2.8k",
    retweets: "412",
    replies: "89",
    impressions: "280k",
  },
  {
    id: 3,
    content: "Just hit $10k MRR on my side project! Here's exactly how I did it with zero marketing budget:",
    likes: "1.5k",
    retweets: "150",
    replies: "45",
    impressions: "120k",
  }
];

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">Analytics Overview</h1>
        <p className="text-muted-foreground text-sm">Track your growth and identify top-performing content.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat, index) => (
          <div key={index} className="bg-card border border-border rounded-xl p-5 shadow-sm hover:border-primary/50 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-background border border-border p-2 rounded-lg">
                <stat.icon className="w-5 h-5 text-primary" />
              </div>
              <span className={cn(
                "flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full",
                stat.positive ? "text-emerald-500 bg-emerald-500/10" : "text-red-500 bg-red-500/10"
              )}>
                {stat.positive ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
                {stat.change}
              </span>
            </div>
            <div>
              <p className="text-muted-foreground text-sm mb-1">{stat.label}</p>
              <h3 className="text-2xl font-bold">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Chart Mockup Area */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm min-h-[300px] flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-semibold">Audience Growth</h3>
          <select className="bg-background border border-border rounded-md px-3 py-1.5 text-sm outline-none">
            <option>Last 30 Days</option>
            <option>Last 7 Days</option>
            <option>This Year</option>
          </select>
        </div>
        <div className="flex-1 flex items-center justify-center border border-dashed border-border rounded-lg bg-background/50 text-muted-foreground">
          <p className="flex items-center gap-2"><TrendingUp className="w-5 h-5" /> Chart Visualization (Recharts/Chart.js)</p>
        </div>
      </div>

      {/* Top Posts */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border bg-background/30 flex justify-between items-center">
          <span className="font-semibold">Top Performing Content</span>
          <button className="text-primary text-sm font-medium hover:underline">View All</button>
        </div>
        <div className="divide-y divide-border">
          {TOP_POSTS.map((post) => (
            <div key={post.id} className="p-5 hover:bg-background/20 transition-colors">
              <p className="text-sm font-medium mb-4">{post.content}</p>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><Eye className="w-4 h-4 text-primary" /> <span className="font-semibold text-foreground">{post.impressions}</span> <span className="hidden sm:inline">Impressions</span></div>
                <div className="flex items-center gap-2"><Heart className="w-4 h-4 text-pink-500" /> <span>{post.likes}</span></div>
                <div className="flex items-center gap-2"><ArrowUpRight className="w-4 h-4 text-emerald-500" /> <span>{post.retweets}</span></div>
                <div className="flex items-center gap-2"><MessageCircle className="w-4 h-4 text-blue-500" /> <span>{post.replies}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
