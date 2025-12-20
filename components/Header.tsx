"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Code2, Settings } from "lucide-react";
import { removeToken, getToken } from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 로그인 상태 확인
  useEffect(() => {
    const checkLoginStatus = () => {
      const token = getToken();
      setIsLoggedIn(!!token);
    };

    // 초기 로드 시 확인
    checkLoginStatus();

    // 페이지 포커스 시 다시 확인
    const handleFocus = () => {
      checkLoginStatus();
    };

    window.addEventListener("focus", handleFocus);
    // storage 이벤트 리스너 (다른 탭에서 로그인/로그아웃 시)
    window.addEventListener("storage", checkLoginStatus);
    
    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("storage", checkLoginStatus);
    };
  }, []);

  const handleLogout = () => {
    removeToken();
    setIsLoggedIn(false);
    router.push("/");
    router.refresh();
  };

  const handleSmoothScroll = (
    e: React.MouseEvent<HTMLAnchorElement>,
    targetId: string
  ) => {
    e.preventDefault();
    if (pathname === "/") {
      const element = document.querySelector(targetId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } else {
      router.push(`/${targetId}`);
    }
    setIsMobileMenuOpen(false);
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
        
        {isLoggedIn ? (
          // 로그인된 상태의 메뉴
          <>
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
          </>
        ) : (
          // 로그인되지 않은 상태의 메뉴
          <>
            <div className="hidden md:flex items-center gap-10">
              <a
                href="#features"
                onClick={(e) => handleSmoothScroll(e, "#features")}
                className="text-slate-400 hover:text-[#7DE2D1] transition text-sm font-medium"
              >
                기능
              </a>
              <a
                href="#benefits"
                onClick={(e) => handleSmoothScroll(e, "#benefits")}
                className="text-slate-400 hover:text-[#7DE2D1] transition text-sm font-medium"
              >
                솔루션
              </a>
              <a
                href="#community"
                onClick={(e) => handleSmoothScroll(e, "#community")}
                className="text-slate-400 hover:text-[#7DE2D1] transition text-sm font-medium"
              >
                커뮤니티
              </a>
              <Button
                onClick={() => router.push("/login")}
                className="text-white font-semibold h-10"
                style={{ backgroundColor: "#339989" }}
              >
                시작하기
              </Button>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-slate-400 hover:text-white"
            >
              <Settings className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-[#2B2C28] bg-[#1a1a18] p-4 space-y-2">
          {isLoggedIn ? (
            // 로그인된 상태의 모바일 메뉴
            <>
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
            </>
          ) : (
            // 로그인되지 않은 상태의 모바일 메뉴
            <>
              <a
                href="#features"
                onClick={(e) => handleSmoothScroll(e, "#features")}
                className="block text-slate-400 hover:text-[#7DE2D1] transition text-sm font-medium py-2"
              >
                기능
              </a>
              <a
                href="#benefits"
                onClick={(e) => handleSmoothScroll(e, "#benefits")}
                className="block text-slate-400 hover:text-[#7DE2D1] transition text-sm font-medium py-2"
              >
                솔루션
              </a>
              <a
                href="#community"
                onClick={(e) => handleSmoothScroll(e, "#community")}
                className="block text-slate-400 hover:text-[#7DE2D1] transition text-sm font-medium py-2"
              >
                커뮤니티
              </a>
              <Button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  router.push("/login");
                }}
                className="w-full text-white font-semibold mt-2"
                style={{ backgroundColor: "#339989" }}
              >
                시작하기
              </Button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}






