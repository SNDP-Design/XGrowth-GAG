"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, Edit2, Trash2, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

const Twitter = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

import { supabase } from "@/lib/supabase";

interface Tweet {
  id: string;
  content: string; // Could be JSON array or string
  status: "Draft" | "Scheduled" | "Posted";
  scheduled_for: string | null;
}

export default function QueuePage() {
  const [queue, setQueue] = useState<Tweet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Editing state
  const [editingTweet, setEditingTweet] = useState<Tweet | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchQueue = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tweets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQueue(data || []);
    } catch (e) {
      console.error("Failed to fetch queue:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this scheduled post? This will also cancel it in the background.")) return;
    try {
      const response = await fetch('/api/schedule', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });
      if (response.ok) {
        setQueue(queue.filter(t => t.id !== id));
      } else {
        const data = await response.json();
        alert(`Error: ${data.error || 'Failed to delete'}`);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to delete post.");
    }
  };

  const handleEditClick = (tweet: Tweet) => {
    setEditingTweet(tweet);
    
    // Check if content is JSON or string
    let parsedContent = tweet.content;
    try {
      if (tweet.content.startsWith('[')) {
        const arr = JSON.parse(tweet.content);
        parsedContent = arr.join("\n\n");
      }
    } catch (e) {}
    
    setEditContent(parsedContent);

    if (tweet.scheduled_for) {
      const d = new Date(tweet.scheduled_for);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      setEditDate(`${yyyy}-${mm}-${dd}`);
      setEditTime(`${hh}:${min}`);
    } else {
      // Default to today
      const today = new Date();
      setEditDate(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
      setEditTime("12:00");
    }
  };

  const handleUpdate = async () => {
    if (!editingTweet) return;
    setIsUpdating(true);
    try {
      // If it's a thread, split by \n\n
      const contentArray = editContent.split("\n\n");
      const finalContent = contentArray.length > 1 ? contentArray : editContent;

      const scheduledFor = editingTweet.status === "Scheduled"
        ? new Date(`${editDate}T${editTime}`).toISOString()
        : null;

      const response = await fetch('/api/schedule', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingTweet.id,
          content: finalContent,
          status: editingTweet.status,
          scheduledFor
        }),
      });

      if (response.ok) {
        setEditingTweet(null);
        fetchQueue();
      } else {
        const data = await response.json();
        alert(`Error: ${data.error || 'Failed to update'}`);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to update post.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Helper to format date nicely
  const formatScheduledDate = (dateStr: string | null) => {
    if (!dateStr) return "Not scheduled";
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="flex flex-col gap-6 relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">Content Queue</h1>
          <p className="text-muted-foreground text-sm">Manage your scheduled posts and drafts.</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border bg-background/30 flex items-center gap-4">
          <Calendar className="w-5 h-5 text-muted-foreground" />
          <span className="font-semibold">Upcoming Schedule</span>
        </div>
        
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center text-muted-foreground">
            <Sparkles className="w-8 h-8 animate-spin mb-4 text-primary" />
            <p>Loading your queue...</p>
          </div>
        ) : queue.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-muted-foreground opacity-50">
            <Twitter className="w-12 h-12 mb-4 opacity-20" />
            <p>Your queue is empty. Generate some posts first!</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {queue.map((item) => {
              // Parse content if it's a thread
              let tweets = [item.content];
              try {
                if (item.content.startsWith('[')) {
                  tweets = JSON.parse(item.content);
                }
              } catch (e) {}

              return (
                <div key={item.id} className="p-5 flex flex-col sm:flex-row gap-4 hover:bg-background/20 transition-colors group">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={cn(
                        "text-xs font-semibold px-2 py-1 rounded-md flex items-center gap-1.5",
                        item.status === "Scheduled" ? "bg-emerald-500/10 text-emerald-500" : 
                        item.status === "Posted" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                      )}>
                        {item.status === "Scheduled" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                        {item.status}
                      </span>
                      <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {item.scheduled_for ? formatScheduledDate(item.scheduled_for) : 'Draft'}
                      </span>
                    </div>
                    
                    <div className="space-y-4">
                      {tweets.map((tweetText, idx) => (
                        <div key={idx} className="bg-background border border-border rounded-lg p-4 relative">
                          {idx === 0 && <Twitter className="w-4 h-4 text-primary absolute top-4 right-4 opacity-50" />}
                          <p className="text-sm whitespace-pre-wrap pr-8">{tweetText}</p>
                          {tweets.length > 1 && (
                            <span className="text-xs text-muted-foreground absolute bottom-2 right-2">
                              {idx + 1}/{tweets.length}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="sm:w-32 flex sm:flex-col justify-end sm:justify-start gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 sm:border-l border-border pl-0 sm:pl-4 mt-2 sm:mt-0">
                    {item.status !== "Posted" && (
                      <button 
                        onClick={() => handleEditClick(item)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </button>
                    )}
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingTweet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border w-full max-w-lg p-6 rounded-2xl shadow-2xl relative flex flex-col gap-4">
            <button 
              onClick={() => setEditingTweet(null)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-xl font-bold tracking-tight">Edit Post</h2>
              <p className="text-muted-foreground text-sm">Modify the content or scheduled time.</p>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Content</label>
              <textarea 
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full bg-background border border-border rounded-lg p-3 min-h-[150px] resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                placeholder="Write your tweet..."
              />
              <span className="text-xs text-muted-foreground">Tip: Separate tweets in a thread with a blank line.</span>
            </div>

            {editingTweet.status === "Scheduled" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Date</label>
                  <input 
                    type="date" 
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Time</label>
                  <input 
                    type="time" 
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleUpdate}
              disabled={isUpdating}
              className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50 mt-4 shadow-sm"
            >
              {isUpdating ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
