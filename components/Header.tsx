"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Code2, Settings, Camera, X, Loader2 } from "lucide-react";
import { removeToken, getToken } from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showOcrModal, setShowOcrModal] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<string | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);

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

  const handleCaptureClick = async () => {
    setShowOcrModal(true);
    setOcrLoading(true);
    setOcrResult(null);
    setOcrError(null);

    try {
      // AI 서버의 /capture 엔드포인트 호출 (타임아웃: 5분)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000); // 5분
      
      const aiServerUrl = process.env.NEXT_PUBLIC_AI_SERVER_URL || "http://localhost:8000";
      const response = await fetch(`${aiServerUrl}/capture`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      const data = await response.json();

      if (data.success) {
        setOcrResult(data.text);
        setOcrError(null);
        
        // 클립보드에 저장
        try {
          await navigator.clipboard.writeText(data.text);
          // 성공 메시지는 모달에서 표시
        } catch (clipboardError) {
          console.error("클립보드 저장 실패:", clipboardError);
          // 클립보드 저장 실패해도 OCR 결과는 표시
        }
      } else {
        setOcrError(data.error || "OCR 처리 중 오류가 발생했습니다.");
        setOcrResult(null);
      }
    } catch (error: any) {
      setOcrError(error.message || "서버 연결 실패");
      setOcrResult(null);
    } finally {
      setOcrLoading(false);
    }
  };

  const handleCloseOcrModal = () => {
    setShowOcrModal(false);
    setOcrResult(null);
    setOcrError(null);
  };

  const handleCopyToClipboard = async () => {
    if (ocrResult) {
      try {
        await navigator.clipboard.writeText(ocrResult);
        alert("클립보드에 복사되었습니다!");
      } catch (error) {
        console.error("클립보드 복사 실패:", error);
        alert("클립보드 복사에 실패했습니다.");
      }
    }
  };

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-[#2B2C28] bg-[#131515]/80 backdrop-blur-xl">
      <div className="max-w-full mx-auto px-4 md:px-6 py-4 flex items-center justify-center sm:justify-between relative">
        <Link href="/" className="flex items-center gap-3 hidden sm:flex">
          <div className="w-8 h-8 bg-[#339989] rounded-lg flex items-center justify-center">
            <Code2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white hidden sm:inline">
            유지프로젝트
          </span>
        </Link>

        {/* 카메라 아이콘 - 가운데 (작은 화면에서는 중앙, 큰 화면에서는 기존 위치) */}
        <button
          onClick={handleCaptureClick}
          className="w-full h-14 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg bg-[#339989]/20 hover:bg-[#339989]/40 transition-colors text-[#7DE2D1] hover:text-white sm:absolute sm:left-1/2 sm:transform sm:-translate-x-1/2"
          title="화면 캡처 및 OCR"
        >
          <Camera className="w-6 h-6 sm:w-5 sm:h-5" />
        </button>

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
              className="hidden sm:block md:hidden text-slate-400 hover:text-white"
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
              className="hidden sm:block md:hidden text-slate-400 hover:text-white"
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

      {/* OCR 모달 */}
      {showOcrModal && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 pb-8 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl mx-4 bg-[#1a1a18] border border-[#2B2C28] rounded-lg shadow-2xl max-h-[80vh] overflow-hidden flex flex-col">
            {/* 헤더 */}
            <div className="flex items-center justify-between p-6 border-b border-[#2B2C28]">
              <h2 className="text-xl font-bold text-white">OCR 결과</h2>
              <button
                onClick={handleCloseOcrModal}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* 내용 */}
            <div className="flex-1 overflow-y-auto p-6">
              {ocrLoading && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-12 h-12 text-[#7DE2D1] animate-spin mb-4" />
                  <p className="text-slate-400 text-center">
                    화면을 캡처하고 OCR을 처리하는 중입니다...
                    <br />
                    <span className="text-sm mt-2 block">
                      서버에서 "원하는 부분을 드래그로 박스치세요" 창이 열립니다.
                    </span>
                  </p>
                </div>
              )}

              {ocrError && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
                  <p className="text-red-400">{ocrError}</p>
                </div>
              )}

              {ocrResult && (
                <div className="space-y-4">
                  <div className="bg-[#131515] border border-[#2B2C28] rounded-lg p-4">
                    <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono overflow-x-auto">
                      {ocrResult}
                    </pre>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-400">
                      결과가 클립보드에 저장되었습니다. (Ctrl+V로 붙여넣기 가능)
                    </p>
                    <Button
                      onClick={handleCopyToClipboard}
                      className="text-white font-semibold"
                      style={{ backgroundColor: "#339989" }}
                    >
                      다시 복사
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* 푸터 */}
            <div className="border-t border-[#2B2C28] p-4 flex justify-end">
              <Button
                onClick={handleCloseOcrModal}
                className="text-white font-semibold"
                style={{ backgroundColor: "#339989" }}
              >
                닫기
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}


