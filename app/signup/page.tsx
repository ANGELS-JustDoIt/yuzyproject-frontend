"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Code2, Mail, Lock, User, ArrowRight } from "lucide-react"

export default function SignupPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (formData.password !== formData.confirmPassword) {
      alert("비밀번호가 일치하지 않습니다.")
      setIsLoading(false)
      return
    }

    try {
      const { authApi } = await import("@/lib/api")
      await authApi.signup(formData.email, formData.password, formData.name)
      alert("회원가입이 완료되었습니다. 로그인해주세요.")
      router.push("/login")
    } catch (error: any) {
      alert(error.message || "회원가입에 실패했습니다.")
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: "#131515" }}>
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block mb-6 p-3 rounded-xl" style={{ backgroundColor: "#339989/10" }}>
            <div className="w-8 h-8 bg-[#339989] rounded-lg flex items-center justify-center">
              <Code2 className="w-5 h-5 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">CodeFlow 가입</h1>
          <p className="text-slate-400 font-light">국비수업을 더 효율적으로 시작하세요</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSignup} className="space-y-4 mb-6">
          {/* Name Input */}
          <div>
            <label className="block text-white text-sm font-semibold mb-2">이름</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="your name"
                required
                className="w-full pl-12 pr-4 py-3 rounded-lg border border-[#2B2C28] bg-[#1a1a18] text-white placeholder-slate-500 focus:outline-none focus:border-[#339989] transition"
              />
            </div>
          </div>

          {/* Email Input */}
          <div>
            <label className="block text-white text-sm font-semibold mb-2">이메일</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                required
                className="w-full pl-12 pr-4 py-3 rounded-lg border border-[#2B2C28] bg-[#1a1a18] text-white placeholder-slate-500 focus:outline-none focus:border-[#339989] transition"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-white text-sm font-semibold mb-2">비밀번호</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="w-full pl-12 pr-4 py-3 rounded-lg border border-[#2B2C28] bg-[#1a1a18] text-white placeholder-slate-500 focus:outline-none focus:border-[#339989] transition"
              />
            </div>
          </div>

          {/* Confirm Password Input */}
          <div>
            <label className="block text-white text-sm font-semibold mb-2">비밀번호 확인</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="w-full pl-12 pr-4 py-3 rounded-lg border border-[#2B2C28] bg-[#1a1a18] text-white placeholder-slate-500 focus:outline-none focus:border-[#339989] transition"
              />
            </div>
          </div>

          {/* Signup Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full text-white font-semibold py-3 h-auto rounded-lg hover:opacity-90 transition disabled:opacity-50"
            style={{ backgroundColor: "#339989" }}
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "white" }}></div>
                가입 중...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                가입하기
                <ArrowRight className="w-4 h-4" />
              </div>
            )}
          </Button>
        </form>

        {/* Links */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
            <span>이미 계정이 있으신가요?</span>
            <a href="/login" className="text-[#7DE2D1] hover:underline font-semibold">
              로그인
            </a>
          </div>
        </div>

        {/* Terms */}
        <div className="mt-8 p-4 rounded-lg border border-[#2B2C28]" style={{ backgroundColor: "#1a1a18/50" }}>
          <p className="text-slate-400 text-xs text-center font-light">
            가입하면 CodeFlow의{" "}
            <a href="#" className="text-[#7DE2D1] hover:underline">
              이용약관
            </a>
            과{" "}
            <a href="#" className="text-[#7DE2D1] hover:underline">
              개인정보정책
            </a>
            에 동의하는 것입니다.
          </p>
        </div>
      </div>
    </main>
  )
}
