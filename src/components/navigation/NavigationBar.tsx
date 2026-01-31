"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { List, BarChart3, Settings } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: typeof List;
}

const navItems: NavItem[] = [
  { href: "/transactions", label: "Transactions", icon: List },
  { href: "/stats", label: "Stats", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

// Icons that should only change color when active (no fill/stroke changes)
const colorOnlyIcons = ["/stats", "/settings"];

export function NavigationBar() {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur-sm md:hidden">
        <div className="flex h-20 items-start justify-around pt-3">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            const isColorOnly = colorOnlyIcons.includes(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex min-h-[44px] min-w-[44px] flex-col items-center justify-start gap-1 px-4 pt-1
                  transition-colors
                  ${
                    isActive
                      ? "text-blue-500"
                      : "text-gray-500 hover:text-gray-900"
                  }
                `}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon
                  className="h-6 w-6"
                  strokeWidth={isColorOnly ? 2 : (isActive ? 2.5 : 2)}
                  fill={isColorOnly ? "none" : (isActive ? "currentColor" : "none")}
                />
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop Side Navigation */}
      <nav className="fixed left-0 top-0 z-50 hidden h-full w-20 flex-col border-r border-gray-200 bg-white md:flex">
        {/* Nav Items */}
        <div className="flex flex-1 flex-col items-center gap-2 py-4">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1 rounded-xl px-3 py-2
                  transition-colors
                  ${
                    isActive
                      ? "bg-blue-50 text-blue-500"
                      : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                  }
                `}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon
                  className="h-6 w-6"
                  strokeWidth={isActive ? 2.5 : 2}
                  fill={isActive ? "currentColor" : "none"}
                />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
