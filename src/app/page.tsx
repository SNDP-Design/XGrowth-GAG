"use client";

import { useState, useEffect } from "react";
import { Sparkles, Send, Image as ImageIcon, Smile, FileText, Calendar, Clock, X } from "lucide-react";

import { cn } from "@/lib/utils";

const Twitter = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);


const TONE_OPTIONS = ["Viral Hook", "Educational", "Controversial", "Inspirational", "Storytelling"];

export default function AIWriterPage() {
  const [topic, setTopic] = useState("");
  const [selectedTone, setSelectedTone] = useState("Viral Hook");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string[]>([]);
  
  // Scheduling Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scheduleType, setScheduleType] = useState<"Draft" | "Scheduled">("Draft");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("12:00");
  const [isSaving, setIsSaving] = useState(false);

  // Set default date to today
  useEffect(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setScheduleDate(`${yyyy}-${mm}-${dd}`);
  }, []);

  const handleGenerate = async () => {
    if (!topic) return;
    setIsGenerating(true);
    setGeneratedContent([]); // Clear previous content
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic, tone: selectedTone }),
      });
      
      const data = await response.json();
      
      if (data.tweets) {
        setGeneratedContent(data.tweets);
      } else {
        console.error("Failed to generate content", data);
        setGeneratedContent(["Sorry, an error occurred while generating the content. Have you set up your API keys?"]);
      }
    } catch (error) {
      console.error('Error:', error);
      setGeneratedContent(["Sorry, a network error occurred."]);
    } finally {
      setIsGenerating(false);
    }
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
          content: generatedContent,
          status: scheduleType,
          scheduledFor
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        // Reset everything
        setGeneratedContent([]);
        setTopic("");
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-8rem)] relative">
      {/* Left Column - Input area */}
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">Create New Content</h1>
          <p className="text-muted-foreground text-sm">Use AI to generate high-converting tweets and threads.</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex-1 flex flex-col">
          <label className="text-sm font-medium mb-2 block">What do you want to talk about?</label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. How to get started with React in 2024..."
            className="w-full bg-background border border-border rounded-lg p-4 min-h-[120px] resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm mb-4"
          />

          <div className="mb-6">
            <label className="text-sm font-medium mb-3 block">Select Tone/Format</label>
            <div className="flex flex-wrap gap-2">
              {TONE_OPTIONS.map((tone) => (
                <button
                  key={tone}
                  onClick={() => setSelectedTone(tone)}
                  className={cn(
                    "px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 border",
                    selectedTone === tone
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-transparent border-border text-muted-foreground hover:border-primary/50"
                  )}
                >
                  {tone}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-auto">
            <button
              onClick={handleGenerate}
              disabled={!topic || isGenerating}
              className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(29,155,240,0.3)] hover:shadow-[0_0_25px_rgba(29,155,240,0.5)]"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="w-5 h-5 animate-spin" />
                  Generating Magic...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Thread
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Right Column - Preview area */}
      <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col h-full">
        <div className="bg-background/50 border-b border-border px-4 py-3 flex items-center gap-2">
          <Twitter className="w-5 h-5 text-primary" />
          <span className="font-semibold text-sm">Thread Preview</span>
        </div>

        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {generatedContent.length > 0 ? (
            <div className="space-y-0">
              {generatedContent.map((tweet, index) => (
                <div key={index} className="flex gap-3 relative pb-6 group">
                  {index !== generatedContent.length - 1 && (
                    <div className="absolute left-[19px] top-12 bottom-0 w-[2px] bg-border group-hover:bg-primary/30 transition-colors"></div>
                  )}
                  
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center text-primary font-bold z-10 border-2 border-card">
                    X
                  </div>
                  
                  <div className="flex-1 pt-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="font-bold text-sm">You</span>
                      <span className="text-muted-foreground text-sm">@username</span>
                    </div>
                    <p className="text-[15px] whitespace-pre-wrap mb-3 leading-snug">{tweet}</p>
                    
                    <div className="flex items-center gap-6 text-muted-foreground/60">
                      <ImageIcon className="w-4 h-4 cursor-pointer hover:text-primary transition-colors" />
                      <Smile className="w-4 h-4 cursor-pointer hover:text-primary transition-colors" />
                      <FileText className="w-4 h-4 cursor-pointer hover:text-primary transition-colors" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
              <Twitter className="w-16 h-16 mb-4 opacity-20" />
              <p>Your generated thread will appear here</p>
            </div>
          )}
        </div>
        
        {generatedContent.length > 0 && (
          <div className="p-4 border-t border-border bg-background/50 flex gap-3">
            <button 
              onClick={() => {
                const newText = prompt("Copy-paste or edit the tweets (separated by line breaks):", generatedContent.join("\n\n"));
                if (newText) setGeneratedContent(newText.split("\n\n"));
              }}
              className="flex-1 bg-background border border-border text-foreground font-semibold py-2.5 rounded-lg hover:bg-muted transition-colors"
            >
              Edit Manually
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex-1 bg-primary text-primary-foreground font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
            >
              <Send className="w-4 h-4" />
              Send to Queue
            </button>
          </div>
        )}
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
              <p className="text-muted-foreground text-sm">Choose when this thread should go live.</p>
            </div>

            <div className="flex flex-col gap-3 mt-2">
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
              <div className="grid grid-cols-2 gap-4 mt-2">
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
              className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50 mt-4 shadow-sm"
            >
              {isSaving ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  Saving Content...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  {scheduleType === 'Scheduled' ? 'Schedule Thread' : 'Save as Draft'}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

