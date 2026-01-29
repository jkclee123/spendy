"use client";

import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur-sm md:pl-20">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-center px-4">
        {/* Logo and Title */}
        <Link href="/records" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <h1 className="text-xl font-bold text-gray-900">Spendy</h1>
        </Link>
      </div>
    </header>
  );
}
