"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { BookOpen, LogOut, User } from "lucide-react";

export function Header() {
  const { data: session, status } = useSession();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="container mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-gray-900">
          <BookOpen className="h-5 w-5 text-blue-600" />
          <span>台本練習ツール</span>
        </Link>

        <nav className="flex items-center gap-4">
          {status === "loading" ? null : session ? (
            <>
              <Link
                href="/scripts"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                台本一覧
              </Link>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  {session.user.name ?? session.user.email}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => signOut()}
                  title="ログアウト"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <Button onClick={() => signIn()} size="sm">
              <User className="mr-2 h-4 w-4" />
              ログイン
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
