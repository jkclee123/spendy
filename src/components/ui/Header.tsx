"use client";

import { useSession } from "next-auth/react";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur-sm md:pl-20">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
        {/* Logo and Title */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500">
            <span className="text-sm font-bold text-white">$</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Spendy</h1>
        </div>
      </div>
    </header>
  );
}
