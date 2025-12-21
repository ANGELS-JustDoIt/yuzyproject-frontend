"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Code2, Settings } from "lucide-react";
import { removeToken } from "@/lib/api";

export default function Header() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    removeToken();
    router.push("/");
    router.refresh();
  };

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-[#2B2C28] bg-[#131515]/80 backdrop-blur-xl">
      <div className="max-w-full mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#339989] rounded-lg flex items-center justify-center">
            <Code2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white hidden sm:inline">
            유지프로젝트
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className="text-slate-400 hover:text-[#7DE2D1] transition text-sm font-medium"
          >
            홈
          </Link>
          <Link
            href="/code"
            className="text-slate-400 hover:text-[#7DE2D1] transition text-sm font-medium"
          >
            코드분석
          </Link>
          <Link
            href="/posts"
            className="text-slate-400 hover:text-[#7DE2D1] transition text-sm font-medium"
          >
            게시판
          </Link>
          <Link
            href="/my"
            className="text-slate-400 hover:text-[#7DE2D1] transition text-sm font-medium"
          >
            마이페이지
          </Link>
          <button
            onClick={handleLogout}
            className="text-slate-400 hover:text-[#7DE2D1] transition text-sm font-medium"
          >
            로그아웃
          </button>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden text-slate-400 hover:text-white"
        >
          <Settings className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-[#2B2C28] bg-[#1a1a18] p-4 space-y-2">
          <Link
            href="/"
            className="block text-slate-400 hover:text-[#7DE2D1] transition text-sm font-medium py-2"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            홈
          </Link>
          <Link
            href="/code"
            className="block text-slate-400 hover:text-[#7DE2D1] transition text-sm font-medium py-2"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            코드분석
          </Link>
          <Link
            href="/posts"
            className="block text-slate-400 hover:text-[#7DE2D1] transition text-sm font-medium py-2"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            게시판
          </Link>
          <Link
            href="/my"
            className="block text-slate-400 hover:text-[#7DE2D1] transition text-sm font-medium py-2"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            마이페이지
          </Link>
          <button
            onClick={() => {
              handleLogout();
              setIsMobileMenuOpen(false);
            }}
            className="block w-full text-left text-slate-400 hover:text-[#7DE2D1] transition text-sm font-medium py-2"
          >
            로그아웃
          </button>
        </div>
      )}
    </nav>
  );
}









