"use client";

import { useState, useEffect } from "react";
import { Sparkles, Send, Copy, Check, RefreshCw, Calendar, Clock, X, Sparkle } from "lucide-react";
import { cn } from "@/lib/utils";

const Twitter = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

interface TweetIdea {
  type: 'Hook' | 'Story' | 'Lesson' | 'Thread-start';
  content: string;
}

interface GenerationResult {
  header: string;
  ideas: TweetIdea[];
}

function TweetCard({ idea, index, onSchedule }: { idea: TweetIdea; index: number; onSchedule: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(idea.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-card border border-border/80 rounded-xl p-5 flex flex-col justify-between group h-full relative hover:border-primary/30 transition-all duration-300 shadow-sm hover:shadow-md">
      <div>
        <div className="flex items-start justify-between mb-4">
          <span className={cn(
            "text-[10px] uppercase tracking-widest font-mono px-2 py-0.5 rounded-md font-semibold",
            idea.type === 'Hook' && "bg-blue-500/10 text-blue-400 border border-blue-500/20",
            idea.type === 'Story' && "bg-purple-500/10 text-purple-400 border border-purple-500/20",
            idea.type === 'Lesson' && "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
            idea.type === 'Thread-start' && "bg-amber-500/10 text-amber-500 border border-amber-500/20"
          )}>
            {idea.type}
          </span>
          <button
            onClick={handleCopy}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        
        <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
          {idea.content}
        </p>
      </div>

      <div className="mt-5 pt-4 border-t border-border/50 flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground font-mono">
          {index + 1 < 10 ? `0${index + 1}` : index + 1}
        </span>
        <button
          onClick={onSchedule}
          className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-all cursor-pointer"
        >
          <Send className="w-2.5 h-2.5" />
          Queue
        </button>
      </div>
    </div>
  );
}

export default function AIWriterPage() {
  // Ghostwriter State
  const [role, setRole] = useState("");
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState<'friendly' | 'like a story' | 'emotional'>('friendly');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  // Scheduling Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [schedulingContent, setSchedulingContent] = useState<string[]>([]);
  const [scheduleType, setScheduleType] = useState<"Draft" | "Scheduled">("Draft");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("12:00");
  const [isSaving, setIsSaving] = useState(false);

  const [twitterUser, setTwitterUser] = useState<{ name: string; username: string; profileImageUrl: string | null } | null>(null);

  // Set default date to today and fetch Twitter user info
  useEffect(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setScheduleDate(`${yyyy}-${mm}-${dd}`);

    const fetchUser = async () => {
      try {
        const res = await fetch('/api/twitter/user');
        if (res.ok) {
          const data = await res.json();
          setTwitterUser(data);
        }
      } catch (err) {
        console.error("Failed to fetch twitter user info:", err);
      }
    };
    fetchUser();
  }, []);

  const handleGenerate = async () => {
    if (!topic || !role) return;
    setIsGenerating(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role, topic, tone }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
      } else {
        console.error("Failed to generate content", data);
        alert(`Failed to generate: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert("A network error occurred. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenSchedule = (content: string) => {
    setSchedulingContent([content]);
    setScheduleType("Draft");
    setIsModalOpen(true);
  };

  const handleSchedule = async () => {
    setIsSaving(true);
    try {
      const scheduledFor = scheduleType === "Scheduled" 
        ? new Date(`${scheduleDate}T${scheduleTime}`).toISOString() 
        : null;

      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: schedulingContent,
          status: scheduleType,
          scheduledFor
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setIsModalOpen(false);
        alert(`Successfully saved as ${scheduleType}!`);
      } else {
        alert(`Error: ${data.error || 'Failed to save post'}`);
      }
    } catch (error) {
      console.error("Failed to save post:", error);
      alert("Failed to save post due to a network error.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyAll = () => {
    if (result) {
      const allText = result.ideas.map(i => `[${i.type}] ${i.content}`).join('\n\n');
      navigator.clipboard.writeText(allText);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[calc(100vh-8rem)] relative">
      {/* Left Column - Ghostwriter Inputs Sidebar */}
      <div className="lg:col-span-4 flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">Ghostwriter Core</h1>
          <p className="text-muted-foreground text-sm">Craft authority-building founder narratives for your X profile.</p>
        </div>

        <div className="bg-card border border-border/80 rounded-xl p-6 shadow-sm flex flex-col gap-5">
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 mb-2 block">Founder Role</label>
            <input
              type="text"
              placeholder="e.g. B2B SaaS Startup Founder..."
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-foreground placeholder:text-muted-foreground/60"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 mb-2 block">Initial Topic / Idea</label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Just raised our Seed round, here is how we got our first 10 enterprise clients..."
              className="w-full bg-background border border-border rounded-lg p-4 min-h-[140px] resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/60"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 mb-3 block">Selected Tone</label>
            <div className="flex flex-wrap gap-2">
              {(['friendly', 'like a story', 'emotional'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTone(t)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border capitalize",
                    tone === t
                      ? "bg-primary/10 border-primary text-primary font-semibold"
                      : "bg-transparent border-border text-muted-foreground hover:border-primary/50"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!topic || !role || isGenerating}
            className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(29,155,240,0.2)] hover:shadow-[0_0_25px_rgba(29,155,240,0.4)] mt-2"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Engines Active...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Ideas
              </>
            )}
          </button>
        </div>
      </div>

      {/* Right Column - Premium Structured Cards Grid */}
      <div className="lg:col-span-8 bg-card border border-border/80 rounded-xl overflow-hidden flex flex-col h-full shadow-sm min-h-[500px]">
        <div className="bg-background/50 border-b border-border/80 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Twitter className="w-5 h-5 text-primary" />
            <span className="font-semibold text-sm">Ghostwritten Output Architecture</span>
          </div>
          {result && (
            <button 
              onClick={handleCopyAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-xs font-semibold text-foreground transition-all shrink-0"
            >
              {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              Export Full Narrative
            </button>
          )}
        </div>

        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {isGenerating ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-20">
              <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
              <p className="text-xs font-mono uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Engines Active</p>
            </div>
          ) : result ? (
            <div className="space-y-6">
              <div className="bg-background/40 border border-border/60 rounded-xl p-4 flex gap-3 items-center">
                <Sparkle className="w-5 h-5 text-primary shrink-0 animate-pulse" />
                <p className="text-xs font-medium text-foreground leading-relaxed italic">{result.header}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.ideas.map((idea, index) => (
                  <TweetCard 
                    key={index} 
                    idea={idea} 
                    index={index} 
                    onSchedule={() => handleOpenSchedule(idea.content)} 
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 py-20">
              <Twitter className="w-16 h-16 mb-4 opacity-20" />
              <h3 className="text-base font-semibold text-foreground mb-1">Ready to ghostwrite.</h3>
              <p className="text-sm max-w-md text-center">Enter your stats on the left. We'll architect a narrative that positions you as a leading voice on X.</p>
            </div>
          )}
        </div>
      </div>

      {/* Glassmorphic Scheduling Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border w-full max-w-md p-6 rounded-2xl shadow-2xl relative flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div>
              <h2 className="text-xl font-bold tracking-tight">Queue Post</h2>
              <p className="text-muted-foreground text-sm">Choose when this tweet should go live.</p>
            </div>

            {/* Content Preview */}
            <div className="bg-background/80 border border-border rounded-xl p-4 relative flex gap-3 items-start my-1">
              {twitterUser && twitterUser.profileImageUrl ? (
                <img 
                  src={twitterUser.profileImageUrl} 
                  alt="avatar" 
                  className="w-9 h-9 rounded-full object-cover z-10 border border-border"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center text-primary font-bold border border-border">
                  X
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="font-bold text-xs truncate">{twitterUser ? twitterUser.name : 'You'}</span>
                  <span className="text-muted-foreground text-xs truncate">@{twitterUser ? twitterUser.username : 'username'}</span>
                </div>
                <p className="text-xs text-foreground/90 leading-normal whitespace-pre-wrap">{schedulingContent[0]}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-1">
              <label className="flex items-center gap-3 p-3 border border-border rounded-xl cursor-pointer hover:bg-muted/30 transition-colors">
                <input 
                  type="radio" 
                  name="scheduleType" 
                  checked={scheduleType === 'Draft'}
                  onChange={() => setScheduleType('Draft')}
                  className="w-4 h-4 text-primary focus:ring-primary"
                />
                <div>
                  <span className="font-semibold block text-sm">Save as Draft</span>
                  <span className="text-xs text-muted-foreground">Save to drafts to edit or schedule later.</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-border rounded-xl cursor-pointer hover:bg-muted/30 transition-colors">
                <input 
                  type="radio" 
                  name="scheduleType" 
                  checked={scheduleType === 'Scheduled'}
                  onChange={() => setScheduleType('Scheduled')}
                  className="w-4 h-4 text-primary focus:ring-primary"
                />
                <div>
                  <span className="font-semibold block text-sm">Schedule Post</span>
                  <span className="text-xs text-muted-foreground">Automatically publish to X at a specific date & time.</span>
                </div>
              </label>
            </div>

            {scheduleType === 'Scheduled' && (
              <div className="grid grid-cols-2 gap-4 mt-1">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Date</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                    <input 
                      type="date" 
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Time</label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                    <input 
                      type="time" 
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleSchedule}
              disabled={isSaving}
              className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50 mt-3 shadow-sm"
            >
              {isSaving ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  Saving Content...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  {scheduleType === 'Scheduled' ? 'Schedule Post' : 'Save as Draft'}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
