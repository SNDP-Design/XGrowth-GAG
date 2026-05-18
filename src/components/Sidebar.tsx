"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PenSquare, Calendar, BarChart3, Settings, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "AI Writer", href: "/", icon: PenSquare },
  { name: "Queue", href: "/queue", icon: Calendar },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col w-64 border-r border-border bg-background min-h-screen p-4">
      <div className="flex items-center gap-2 px-2 mb-8 mt-2">
        <div className="bg-primary/20 p-2 rounded-lg text-primary">
          <Zap className="w-6 h-6" />
        </div>
        <span className="text-xl font-bold tracking-tight">XGrowth</span>
      </div>

      <nav className="flex-1 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground")} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-border">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
        >
          <Settings className="w-5 h-5" />
          Settings
        </Link>
      </div>
    </div>
  );
}
