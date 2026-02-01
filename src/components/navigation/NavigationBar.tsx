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

interface NavLinkProps {
  item: NavItem;
  isActive: boolean;
}

function NavLink({ item, isActive }: NavLinkProps) {
  const Icon = item.icon;
  const isColorOnly = colorOnlyIcons.includes(item.href);

  return (
    <Link
      href={item.href}
      className={`
        flex min-h-[44px] min-w-[44px] flex-col items-center justify-start gap-1 px-4 pt-1
        transition-colors
        ${isActive
          ? "text-blue-500 dark:text-blue-400"
          : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
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
}

export function NavigationBar() {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm md:hidden">
        <div className="flex h-20 items-start justify-around pt-3">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return <NavLink key={item.href} item={item} isActive={isActive} />;
          })}
        </div>
      </nav>

      {/* Desktop Side Navigation */}
      <nav className="fixed left-0 top-14 z-50 hidden h-[calc(100vh-3.5rem)] w-20 flex-col border-r border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 md:flex">
        {/* Nav Items */}
        <div className="flex flex-1 flex-col items-center gap-2 py-4">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return <NavLink key={item.href} item={item} isActive={isActive} />;
          })}
        </div>
      </nav>
    </>
  );
}
