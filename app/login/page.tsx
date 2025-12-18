"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Code2, Mail, Lock, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { authApi } = await import("@/lib/api");
      await authApi.login(email, password);
      router.push("/code"); // 로그인 성공 후 코드 분석 페이지로 이동
      router.refresh(); // 페이지 새로고침하여 로그인 상태 반영
    } catch (error: any) {
      console.error("로그인 에러:", error);
      if (error.message?.includes("fetch")) {
        alert(
          "서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요."
        );
      } else {
        alert(error.message || "로그인에 실패했습니다.");
      }
      setIsLoading(false);
    }
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center px-6"
      style={{ backgroundColor: "#131515" }}
    >
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-12">
          <div
            className="inline-block mb-6 p-3 rounded-xl"
            style={{ backgroundColor: "#339989/10" }}
          >
            <div className="w-8 h-8 bg-[#339989] rounded-lg flex items-center justify-center">
              <Code2 className="w-5 h-5 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            유지프로젝트에 로그인
          </h1>
          <p className="text-slate-400 font-light">
            국비수업을 더 똑똑하게 학습하세요
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4 mb-6">
          {/* Email Input */}
          <div>
            <label className="block text-white text-sm font-semibold mb-2">
              이메일
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full pl-12 pr-4 py-3 rounded-lg border border-[#2B2C28] bg-[#1a1a18] text-white placeholder-slate-500 focus:outline-none focus:border-[#339989] transition"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-white text-sm font-semibold mb-2">
              비밀번호
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-12 pr-4 py-3 rounded-lg border border-[#2B2C28] bg-[#1a1a18] text-white placeholder-slate-500 focus:outline-none focus:border-[#339989] transition"
              />
            </div>
          </div>

          {/* Login Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full text-white font-semibold py-3 h-auto rounded-lg hover:opacity-90 transition disabled:opacity-50"
            style={{ backgroundColor: "#339989" }}
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: "white" }}
                ></div>
                로그인 중...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                로그인
                <ArrowRight className="w-4 h-4" />
              </div>
            )}
          </Button>
        </form>

        {/* Links */}
        <div className="space-y-3 text-center">
          <a
            href="#"
            className="text-slate-400 text-sm hover:text-[#7DE2D1] transition block"
          >
            비밀번호를 잊으셨나요?
          </a>
          <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
            <span>계정이 없으신가요?</span>
            <a
              href="/signup"
              className="text-[#7DE2D1] hover:underline font-semibold"
            >
              회원가입
            </a>
          </div>
        </div>

        {/* Demo Info */}
        <div
          className="mt-12 p-4 rounded-lg border border-[#2B2C28]"
          style={{ backgroundColor: "#1a1a18/50" }}
        >
          <p className="text-slate-400 text-xs text-center mb-3 font-light">
            테스트 계정으로 로그인하세요
          </p>
          <div className="space-y-1 text-center text-xs text-slate-400 font-mono">
            <p>이메일: test@example.com</p>
            <p>비밀번호: password123</p>
          </div>
        </div>
      </div>
    </main>
  );
}
