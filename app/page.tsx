"use client";

import type React from "react";

import { Button } from "@/components/ui/button";
import { ArrowRight, Code2, Zap, Eye, MessageSquare, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/api";
import Header from "@/components/Header";

export default function Home() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  // 로그인 상태 확인
  useEffect(() => {
    const checkLoginStatus = () => {
      const token = getToken();
      setIsLoggedIn(!!token);
    };

    // 초기 로드 시 확인
    checkLoginStatus();

    // 페이지 포커스 시 다시 확인 (다른 탭에서 로그인 후 돌아올 때)
    const handleFocus = () => {
      checkLoginStatus();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const handleSmoothScroll = (
    e: React.MouseEvent<HTMLAnchorElement>,
    targetId: string
  ) => {
    e.preventDefault();
    const element = document.querySelector(targetId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <main className="min-h-screen" style={{ backgroundColor: "#131515" }}>
      <Header />

      {/* Hero Section */}
      <section className="pt-40 pb-32 px-6 text-center relative overflow-hidden">
        <div
          className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-20"
          style={{ backgroundColor: "#339989", filter: "blur(100px)" }}
        ></div>
        <div
          className="absolute bottom-0 left-1/4 w-64 h-64 rounded-full opacity-15"
          style={{ backgroundColor: "#7DE2D1", filter: "blur(80px)" }}
        ></div>

        <div className="max-w-5xl mx-auto relative z-10">
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-8 leading-tight tracking-tight">
            코드 수업,
            <br />
            <span style={{ color: "#7DE2D1" }}>유지프로젝트와 함께</span>
          </h1>

          <p className="text-lg text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed font-light">
            수업 중 타이핑을 못해 놓치던 코드부터 복습 시간까지. 유지프로젝트가
            당신의 학습 경험을 완전히 바꿔줄 것입니다.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button
              onClick={() => {
                if (isLoggedIn) {
                  router.push("/code");
                } else {
                  setShowAuthModal(true);
                }
              }}
              className="text-white px-8 py-6 text-base h-auto font-semibold hover:opacity-90 transition"
              style={{ backgroundColor: "#339989" }}
            >
              {isLoggedIn ? "코드 분석 시작하기" : "무료로 시작하기"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              onClick={() => router.push("/visualize-sample")}
              className="border border-[#2B2C28] text-white hover:bg-[#2B2C28]/50 px-8 py-6 text-base h-auto bg-transparent font-semibold transition"
            >
              데모 보기
            </Button>
          </div>
        </div>
      </section>

      <section className="py-28 px-6 border-t border-[#2B2C28] bg-[#1a1a18]/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-white mb-6">
              왜 유지프로젝트인가?
            </h2>
            <p className="text-lg text-slate-400 font-light max-w-3xl mx-auto">
              국비수업은 빠른 속도와 많은 양의 정보로 인해 학생들이 따라가기
              힘든 경우가 많습니다. 유지프로젝트는 이러한 문제를 해결하기 위해
              탄생했습니다.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-xl border border-[#2B2C28] bg-[#1a1a18]/80">
              <div className="w-12 h-12 rounded-lg bg-[#339989]/20 flex items-center justify-center mb-6">
                <Code2 className="w-6 h-6 text-[#7DE2D1]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">
                실시간 코드 캡처
              </h3>
              <p className="text-slate-400 leading-relaxed">
                강사가 작성하는 코드를 실시간으로 캡처하고 OCR로 텍스트화하여
                저장합니다. 더 이상 타이핑 속도에 좌절하지 마세요.
              </p>
            </div>

            <div className="p-8 rounded-xl border border-[#2B2C28] bg-[#1a1a18]/80">
              <div className="w-12 h-12 rounded-lg bg-[#339989]/20 flex items-center justify-center mb-6">
                <Eye className="w-6 h-6 text-[#7DE2D1]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">시각적 이해</h3>
              <p className="text-slate-400 leading-relaxed">
                복잡한 코드 구조를 다이어그램으로 시각화하여 한눈에 파악할 수
                있습니다. 함수 간의 관계와 데이터 흐름을 명확하게 이해하세요.
              </p>
            </div>

            <div className="p-8 rounded-xl border border-[#2B2C28] bg-[#1a1a18]/80">
              <div className="w-12 h-12 rounded-lg bg-[#339989]/20 flex items-center justify-center mb-6">
                <MessageSquare className="w-6 h-6 text-[#7DE2D1]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">함께 성장</h3>
              <p className="text-slate-400 leading-relaxed">
                같은 목표를 가진 원생들과 함께 질문하고 답변하며 성장합니다.
                혼자가 아닌 함께 배우는 즐거움을 느껴보세요.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 1: Code Flow Visualization */}
      <section id="features" className="py-28 px-6 border-t border-[#2B2C28]">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="rounded-xl overflow-hidden border border-[#2B2C28] bg-[#1a1a18]">
                <div className="w-full h-64 bg-gradient-to-br from-[#339989]/20 to-[#7DE2D1]/20 flex items-center justify-center">
                  <Code2 className="w-24 h-24 text-[#339989]/50" />
                </div>
              </div>
            </div>
            {/* 텍스트 */}
            <div>
              <div className="inline-block mb-6 px-3 py-1 bg-[#339989]/10 border border-[#339989]/30 rounded-lg">
                <span className="text-[#7DE2D1] text-xs font-bold uppercase tracking-widest">
                  기능 1
                </span>
              </div>
              <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
                코드 흐름 시각화
              </h2>
              <p className="text-slate-400 mb-10 leading-relaxed text-base font-light">
                코드 폴더를 업로드하면 함수 호출 흐름, 의존성 관계, 데이터
                흐름을 인터랙티브한 다이어그램으로 변환합니다. 복잡한 로직도
                한눈에 이해할 수 있습니다.
              </p>
              <ul className="space-y-4 mb-12">
                {[
                  "함수 호출 관계도 자동 생성",
                  "데이터 흐름 추적 가능",
                  "JavaScript, Python, Java 등 다양한 언어 지원",
                  "복습 시간 50% 단축",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 text-slate-300"
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: "#7DE2D1" }}
                    ></div>
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="text-white font-semibold px-6 py-3 h-auto rounded-lg hover:opacity-90 transition"
                style={{ backgroundColor: "#339989" }}
              >
                지금 시도해보기
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 2: Screen Capture & OCR */}
      <section className="py-28 px-6 border-t border-[#2B2C28] bg-[#1a1a18]/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* 텍스트 */}
            <div>
              <div className="inline-block mb-6 px-3 py-1 bg-[#339989]/10 border border-[#339989]/30 rounded-lg">
                <span className="text-[#7DE2D1] text-xs font-bold uppercase tracking-widest">
                  기능 2
                </span>
              </div>
              <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
                화면 캡처 및 OCR 기능
              </h2>
              <p className="text-slate-400 mb-10 leading-relaxed text-base font-light">
                수업 중 버튼 한 번으로 화면을 자유롭게 크롭한 후, AI가 이미지
                속의 코드를 인식해 텍스트로 변환합니다. 이제 필기 대신 코드를
                직접 얻을 수 있습니다.
              </p>
              <ul className="space-y-4 mb-12">
                {[
                  "원하는 영역만 선택하여 캡처",
                  "고정밀 OCR로 99% 정확도의 코드 인식",
                  "바로 복사해서 에디터에 붙여넣기",
                  "타이핑 시간 절약",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 text-slate-300"
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: "#7DE2D1" }}
                    ></div>
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="text-white font-semibold px-6 py-3 h-auto rounded-lg hover:opacity-90 transition"
                style={{ backgroundColor: "#339989" }}
              >
                지금 시도해보기
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
            <div>
              <div className="rounded-xl overflow-hidden border border-[#2B2C28] bg-[#131515]">
                <div className="w-full h-64 bg-gradient-to-br from-[#339989]/20 to-[#7DE2D1]/20 flex items-center justify-center">
                  <Eye className="w-24 h-24 text-[#7DE2D1]/50" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 3: Community Q&A Board */}
      <section id="community" className="py-28 px-6 border-t border-[#2B2C28]">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* 이미지 */}
            <div>
              <div className="rounded-xl overflow-hidden border border-[#2B2C28] bg-[#1a1a18]">
                <div className="w-full h-64 bg-gradient-to-br from-[#339989]/20 to-[#7DE2D1]/20 flex items-center justify-center">
                  <MessageSquare className="w-24 h-24 text-[#FFB563]/50" />
                </div>
              </div>
            </div>
            {/* 텍스트 */}
            <div>
              <div className="inline-block mb-6 px-3 py-1 bg-[#339989]/10 border border-[#339989]/30 rounded-lg">
                <span className="text-[#7DE2D1] text-xs font-bold uppercase tracking-widest">
                  커뮤니티
                </span>
              </div>
              <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
                원생 전용
                <br />
                Q&A 게시판
              </h2>
              <p className="text-slate-400 mb-10 leading-relaxed text-base font-light">
                수업 중에 이해 안 되는 부분, 막힌 버그, 추가 학습 자료가
                필요한가요? 원생들과의 Q&A 게시판에서 질문하고, 다른 원생들의
                답변을 보며 함께 성장합니다.
              </p>
              <ul className="space-y-4 mb-12">
                {[
                  "질문, 수정, 삭제가 자유로운 CRUD 게시판",
                  "다른 원생들이 서로 도와주는 문화",
                  "강사도 활발하게 참여하는 활동적인 공간",
                  "정보 공유로 스트레스 함께 해결",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 text-slate-300"
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: "#7DE2D1" }}
                    ></div>
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="text-white font-semibold px-6 py-3 h-auto rounded-lg hover:opacity-90 transition"
                style={{ backgroundColor: "#339989" }}
              >
                커뮤니티 둘러보기
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section
        id="benefits"
        className="py-28 px-6 border-t border-[#2B2C28] bg-[#1a1a18]/50"
      >
        <div className="max-w-6xl mx-auto">
          <div className="mb-16">
            <h2 className="text-5xl font-bold text-white mb-4">
              당신의 수업을 변화시키다
            </h2>
            <p className="text-slate-400 text-lg font-light">
              유지프로젝트가 해결하는 실제 문제들
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                problem: "수업 중 코드를 따라치지 못함",
                solution: "화면 캡처 & OCR로 즉시 코드 확보",
                icon: Zap,
              },
              {
                problem: "코드 구조가 복잡해 이해 안 됨",
                solution: "시각화된 다이어그램으로 흐름 파악",
                icon: Eye,
              },
              {
                problem: "복습할 때 시간이 오래 걸림",
                solution: "코드 흐름도로 빠른 복습 가능",
                icon: ArrowRight,
              },
              {
                problem: "질문할 곳이 없어 스트레스",
                solution: "원생 커뮤니티에서 즉시 해결",
                icon: MessageSquare,
              },
              {
                problem: "일부 수업을 놓쳤을 때",
                solution: "저장된 코드로 따라잡기 가능",
                icon: Code2,
              },
              {
                problem: "수업 내용이 헷갈릴 때",
                solution: "정리된 자료와 다른 원생 기록",
                icon: ArrowRight,
              },
            ].map((item, i) => {
              const IconComponent = item.icon;
              return (
                <div
                  key={i}
                  className="p-6 rounded-xl border border-[#2B2C28] bg-[#1a1a18]/80 hover:border-[#339989]/50 transition duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: "#339989/20" }}
                    >
                      <IconComponent
                        className="w-5 h-5"
                        style={{ color: "#7DE2D1" }}
                      />
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-2 text-sm">
                        문제: {item.problem}
                      </h4>
                      <p className="text-slate-400 text-sm leading-relaxed">
                        <span
                          style={{ color: "#7DE2D1" }}
                          className="font-medium"
                        >
                          ✓
                        </span>{" "}
                        {item.solution}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 px-6 border-t border-[#2B2C28]">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { number: "98%", label: "사용자 만족도" },
              { number: "2.3시간", label: "평균 복습 시간 단축" },
              { number: "1,500+", label: "활동 중인 원생" },
              { number: "4.9/5", label: "평점" },
            ].map((stat, i) => (
              <div
                key={i}
                className="p-6 rounded-xl border border-[#2B2C28] bg-[#1a1a18]/50"
              >
                <div
                  className="text-4xl font-bold mb-2"
                  style={{ color: "#7DE2D1" }}
                >
                  {stat.number}
                </div>
                <div className="text-slate-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-28 px-6 border-t border-[#2B2C28] relative overflow-hidden">
        <div
          className="absolute top-0 left-1/2 w-96 h-96 rounded-full opacity-15"
          style={{
            backgroundColor: "#339989",
            filter: "blur(100px)",
            transform: "translateX(-50%)",
          }}
        ></div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-5xl font-bold text-white mb-6">
            이제 시작하세요
          </h2>
          <p className="text-lg text-slate-400 mb-12 font-light">
            국비수업을 더 똑똑하게, 더 효율적으로. 유지프로젝트와 함께
            성장하세요.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => {
                if (isLoggedIn) {
                  router.push("/code");
                } else {
                  setShowAuthModal(true);
                }
              }}
              className="text-white px-8 py-6 text-base h-auto font-semibold hover:opacity-90 transition"
              style={{ backgroundColor: "#339989" }}
            >
              {isLoggedIn ? "코드 분석 시작하기" : "무료로 시작하기"}
            </Button>
            <Button className="border border-[#2B2C28] text-white hover:bg-[#2B2C28]/50 px-8 py-6 text-base h-auto bg-transparent font-semibold transition">
              문의하기
            </Button>
          </div>
        </div>
      </section>

      {showAuthModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        >
          <div className="w-full max-w-md rounded-xl border border-[#2B2C28] bg-[#1a1a18] p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-white">시작하기</h2>
              <button
                onClick={() => setShowAuthModal(false)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-slate-400 mb-8 font-light">
              유지프로젝트에 참여하여 더 효율적인 학습을 시작하세요.
            </p>

            <div className="space-y-3">
              <Button
                onClick={() => {
                  setShowAuthModal(false);
                  router.push("/login");
                }}
                className="w-full text-white font-semibold py-3 h-auto rounded-lg hover:opacity-90 transition"
                style={{ backgroundColor: "#339989" }}
              >
                로그인
              </Button>
              <Button
                onClick={() => {
                  setShowAuthModal(false);
                  router.push("/signup");
                }}
                className="w-full border border-[#2B2C28] text-white hover:bg-[#2B2C28]/50 py-3 h-auto bg-transparent font-semibold transition rounded-lg"
              >
                회원가입
              </Button>
            </div>

            <div className="mt-8 text-center">
              <p className="text-slate-500 text-sm font-light">
                문제가 있으신가요?{" "}
                <a
                  href="#"
                  className="text-[#7DE2D1] hover:underline font-semibold"
                >
                  문의하기
                </a>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-[#2B2C28] bg-[#131515] py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: "#339989" }}
                >
                  <Code2 className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-white">유지프로젝트</span>
              </div>
              <p className="text-slate-500 text-sm">
                국비수업 전용 학습 플랫폼
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4 text-sm">제품</h4>
              <ul className="space-y-2 text-slate-500 text-sm">
                <li>
                  <a href="#" className="hover:text-[#7DE2D1] transition">
                    기능
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#7DE2D1] transition">
                    요금
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#7DE2D1] transition">
                    보안
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4 text-sm">회사</h4>
              <ul className="space-y-2 text-slate-500 text-sm">
                <li>
                  <a href="#" className="hover:text-[#7DE2D1] transition">
                    블로그
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#7DE2D1] transition">
                    채용
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#7DE2D1] transition">
                    문의
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4 text-sm">법률</h4>
              <ul className="space-y-2 text-slate-500 text-sm">
                <li>
                  <a href="#" className="hover:text-[#7DE2D1] transition">
                    개인정보
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#7DE2D1] transition">
                    이용약관
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-[#2B2C28] pt-8 flex flex-col sm:flex-row justify-between items-center text-slate-500 text-sm">
            <p>&copy; 2025 유지프로젝트. 국비수업생을 위한 학습 플랫폼</p>
            <div className="flex gap-6 mt-4 sm:mt-0">
              <a href="#" className="hover:text-[#7DE2D1] transition">
                Twitter
              </a>
              <a href="#" className="hover:text-[#7DE2D1] transition">
                GitHub
              </a>
              <a href="#" className="hover:text-[#7DE2D1] transition">
                Discord
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
