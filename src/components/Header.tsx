"use client";

import { useState, useEffect } from "react";
import { Bell, UserCircle } from "lucide-react";

export function Header() {
  const [twitterUser, setTwitterUser] = useState<{ name: string; username: string; profileImageUrl: string | null } | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/twitter/user');
        if (res.ok) {
          const data = await res.json();
          setTwitterUser(data);
        }
      } catch (err) {
        console.error("Failed to fetch twitter user in header:", err);
      }
    };
    fetchUser();
  }, []);

  return (
    <header className="h-16 border-b border-border bg-background/50 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Dashboard</h2>
      </div>
      
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full"></span>
        </button>
        
        <button className="flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full hover:bg-muted transition-colors border border-border">
          {twitterUser && twitterUser.profileImageUrl ? (
            <img 
              src={twitterUser.profileImageUrl} 
              alt="avatar" 
              className="w-7 h-7 rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <UserCircle className="w-7 h-7 text-muted-foreground" />
          )}
          <span className="text-sm font-semibold text-foreground">
            {twitterUser ? `@${twitterUser.username}` : '@username'}
          </span>
        </button>
      </div>
    </header>
  );
}
