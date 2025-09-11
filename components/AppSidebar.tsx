"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const menuItems = [
  { name: "Dashboard", href: "/" },
  { name: "Profile", href: "/profile" },
  { name: "Forms", href: "/forms" },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <div className="h-screen w-[200px] border-r bg-background px-3 py-4">
      <nav className="space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex h-10 w-full items-center rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
              pathname === item.href
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground"
            )}
          >
            {item.name}
          </Link>
        ))}
      </nav>
    </div>
  );
}
