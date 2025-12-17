"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Upload, Code2, Network, FileJson } from "lucide-react";
import Link from "next/link";
import Header from "@/components/Header";

export default function CodePage() {
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      // FormData 생성
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append("files", file);
      });

      // AI 서버로 분석 요청 (실제 API 엔드포인트로 변경 필요)
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

      // TODO: 실제 AI 서버 엔드포인트로 변경
      // const response = await fetch(`${API_BASE_URL}/api/analyze`, {
      //   method: "POST",
      //   body: formData,
      //   headers: {
      //     Authorization: `Bearer ${getToken()}`,
      //   },
      // })
      //
      // if (!response.ok) throw new Error("분석에 실패했습니다")
      // const analysisResult = await response.json()

      // 임시: mock 데이터 (실제로는 AI 서버에서 받은 데이터)
      const mockAnalysisResult = {
        api: [
          {
            category: "auth",
            categoryName: "Auth Feature",
            endpoints: [
              {
                method: "POST",
                url: "/auth/signup",
                function: "authController.signup",
                children: [
                  {
                    function: "body validation",
                    file: "middleware/validator.mjs",
                    description: "Validation of Signup Request Body",
                    children: [],
                  },
                  {
                    function: "findByUserid",
                    file: "data/auth.mjs",
                    description: "Check for Existing UserID",
                    children: [],
                  },
                  {
                    function: "bcrypt hash",
                    file: "bcrypt",
                    description: "Hash Password",
                    children: [],
                  },
                  {
                    function: "createUser",
                    file: "data/auth.mjs",
                    description: "Create New User",
                    children: [],
                  },
                  {
                    function: "createJwtToken",
                    file: "middleware/auth.mjs",
                    description: "Generate JWT Token",
                    children: [],
                  },
                  {
                    function: "res.send",
                    file: "app.mjs",
                    description: "Send JWT Token and User ID",
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
      };

      // 분석 결과를 localStorage에 저장
      const dataString = JSON.stringify(mockAnalysisResult);
      localStorage.setItem("analysisResult", dataString);

      // 저장 확인
      console.log("분석 결과 저장 완료:", {
        hasData: !!localStorage.getItem("analysisResult"),
        dataLength: dataString.length,
      });

      // 약간의 지연 후 visualize 페이지로 이동 (localStorage 저장이 완료되도록)
      await new Promise((resolve) => setTimeout(resolve, 100));

      // visualize 페이지로 이동
      router.push("/visualize");
    } catch (error) {
      console.error("분석 실패:", error);
      alert(error instanceof Error ? error.message : "분석에 실패했습니다");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <main className="min-h-screen" style={{ backgroundColor: "#131515" }}>
      <Header />

      {/* Main Content */}
      <div className="pt-20 px-6 pb-12">
        <div className="max-w-7xl mx-auto">
          <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
            <div className="w-full max-w-2xl">
              <div className="text-center mb-12">
                <h1 className="text-5xl font-bold text-white mb-4">
                  프로젝트 폴더를
                  <br />
                  <span style={{ color: "#7DE2D1" }}>분석해보세요</span>
                </h1>
                <p className="text-slate-400 text-lg font-light">
                  코드 폴더를 업로드하면 함수 호출 흐름과 API 구조를 한눈에 볼
                  수 있습니다
                </p>
              </div>

              {/* Upload Box */}
              <div className="relative">
                <input
                  type="file"
                  webkitdirectory="true"
                  directory="true"
                  onChange={handleFolderUpload}
                  disabled={isUploading}
                  className="hidden"
                  id="folder-upload"
                />
                <label htmlFor="folder-upload" className="block cursor-pointer">
                  <div
                    className="border-2 border-dashed border-[#339989]/50 rounded-xl p-16 text-center hover:border-[#339989] transition"
                    style={{ backgroundColor: "#1a1a18/50" }}
                  >
                    <Upload
                      className="w-16 h-16 mx-auto mb-4"
                      style={{ color: "#7DE2D1" }}
                    />
                    <h3 className="text-2xl font-bold text-white mb-2">
                      폴더를 여기에 드래그하거나 클릭하세요
                    </h3>
                    <p className="text-slate-400 mb-6">
                      JavaScript, Python, Java 등 다양한 언어의 프로젝트를
                      지원합니다
                    </p>
                    {isUploading && (
                      <div className="flex items-center justify-center gap-3">
                        <div
                          className="w-2 h-2 rounded-full animate-pulse"
                          style={{ backgroundColor: "#7DE2D1" }}
                        ></div>
                        <span className="text-slate-400 text-sm font-medium">
                          분석 중입니다...
                        </span>
                      </div>
                    )}
                  </div>
                </label>
              </div>

              {/* Info */}
              <div className="grid grid-cols-3 gap-4 mt-12">
                {[
                  {
                    icon: Code2,
                    label: "지원 언어",
                    value: "JavaScript, Python, Java",
                  },
                  {
                    icon: Network,
                    label: "분석 항목",
                    value: "함수, API, 데이터 흐름",
                  },
                  {
                    icon: FileJson,
                    label: "지원 포맷",
                    value: ".js, .py, .java 등",
                  },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={i}
                      className="p-4 rounded-lg border border-[#2B2C28]"
                      style={{ backgroundColor: "#1a1a18/50" }}
                    >
                      <Icon
                        className="w-6 h-6 mb-2"
                        style={{ color: "#7DE2D1" }}
                      />
                      <p className="text-slate-400 text-xs font-semibold uppercase mb-1">
                        {item.label}
                      </p>
                      <p className="text-white text-sm">{item.value}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
