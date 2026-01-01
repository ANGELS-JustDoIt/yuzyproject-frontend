"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Upload, ArrowRight, Code2, Network, FileJson } from "lucide-react"

interface CodeFlow {
  functionName: string
  calls: string[]
  params: string[]
  returns: string
}

interface AnalysisResult {
  fileName: string
  language: string
  functions: CodeFlow[]
  apiEndpoints: string[]
  dataFlow: string[]
}

export default function DashboardPage() {
  const [isUploading, setIsUploading] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [selectedTab, setSelectedTab] = useState<"flow" | "api">("flow")

  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsUploading(true)
    // 실제로는 백엔드에 폴더를 업로드하고 분석 결과를 받을 것
    // 여기서는 mock 데이터를 사용합니다
    setTimeout(() => {
      setAnalysisResult({
        fileName: "project-folder",
        language: "JavaScript",
        functions: [
          {
            functionName: "initializeApp",
            calls: ["setupDatabase", "configureRoutes", "startServer"],
            params: ["config: Config"],
            returns: "Promise<void>",
          },
          {
            functionName: "setupDatabase",
            calls: ["connectDB", "loadModels"],
            params: ["dbUrl: string"],
            returns: "Database",
          },
          {
            functionName: "fetchUserData",
            calls: ["queryDatabase", "validateUser"],
            params: ["userId: string"],
            returns: "Promise<User>",
          },
        ],
        apiEndpoints: [
          "GET /api/users/:id",
          "POST /api/users",
          "PUT /api/users/:id",
          "DELETE /api/users/:id",
          "GET /api/posts",
          "POST /api/posts",
        ],
        dataFlow: [
          "Client → API Request → Router",
          "Router → Controller → Service",
          "Service → Database Query → Response",
          "Response → JSON Format → Client",
        ],
      })
      setIsUploading(false)
    }, 1500)
  }

  return (
    <main className="min-h-screen" style={{ backgroundColor: "#131515" }}>
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-[#2B2C28] bg-[#131515]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#339989] rounded-lg flex items-center justify-center">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">CodeFlow</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="/" className="text-slate-400 hover:text-[#7DE2D1] transition text-sm font-medium">
              홈
            </a>
            <Button className="text-white font-semibold h-10" style={{ backgroundColor: "#339989" }}>
              로그아웃
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-24 px-6 pb-12">
        <div className="max-w-7xl mx-auto">
          {!analysisResult ? (
            // Upload Section
            <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
              <div className="w-full max-w-2xl">
                <div className="text-center mb-12">
                  <h1 className="text-5xl font-bold text-white mb-4">
                    프로젝트 폴더를
                    <br />
                    <span style={{ color: "#7DE2D1" }}>분석해보세요</span>
                  </h1>
                  <p className="text-slate-400 text-lg font-light">
                    코드 폴더를 업로드하면 함수 호출 흐름과 API 구조를 한눈에 볼 수 있습니다
                  </p>
                </div>

                {/* Upload Box */}
                <div className="relative">
                  <input
                    type="file"
                    {...({
                      webkitdirectory: true,
                      directory: true,
                    } as React.InputHTMLAttributes<HTMLInputElement>)}
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
                      <Upload className="w-16 h-16 mx-auto mb-4" style={{ color: "#7DE2D1" }} />
                      <h3 className="text-2xl font-bold text-white mb-2">폴더를 여기에 드래그하거나 클릭하세요</h3>
                      <p className="text-slate-400 mb-6">
                        JavaScript, Python, Java 등 다양한 언어의 프로젝트를 지원합니다
                      </p>
                      {isUploading && (
                        <div className="flex items-center justify-center gap-3">
                          <div
                            className="w-2 h-2 rounded-full animate-pulse"
                            style={{ backgroundColor: "#7DE2D1" }}
                          ></div>
                          <span className="text-slate-400 text-sm font-medium">분석 중입니다...</span>
                        </div>
                      )}
                    </div>
                  </label>
                </div>

                {/* Info */}
                <div className="grid grid-cols-3 gap-4 mt-12">
                  {[
                    { icon: Code2, label: "지원 언어", value: "JavaScript, Python, Java" },
                    { icon: Network, label: "분석 항목", value: "함수, API, 데이터 흐름" },
                    { icon: FileJson, label: "지원 포맷", value: ".js, .py, .java 등" },
                  ].map((item, i) => {
                    const Icon = item.icon
                    return (
                      <div
                        key={i}
                        className="p-4 rounded-lg border border-[#2B2C28]"
                        style={{ backgroundColor: "#1a1a18/50" }}
                      >
                        <Icon className="w-6 h-6 mb-2" style={{ color: "#7DE2D1" }} />
                        <p className="text-slate-400 text-xs font-semibold uppercase mb-1">{item.label}</p>
                        <p className="text-white text-sm">{item.value}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : (
            // Analysis Result Section
            <div>
              <div className="mb-12 flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2">분석 완료</h1>
                  <p className="text-slate-400 font-light">
                    {analysisResult.fileName} • {analysisResult.language}
                  </p>
                </div>
                <Button
                  onClick={() => setAnalysisResult(null)}
                  className="text-white font-semibold h-10"
                  style={{ backgroundColor: "#339989" }}
                >
                  새 폴더 분석
                </Button>
              </div>

              {/* Tabs */}
              <div className="flex gap-4 mb-8 border-b border-[#2B2C28]">
                <button
                  onClick={() => setSelectedTab("flow")}
                  className={`px-6 py-4 font-semibold transition relative ${
                    selectedTab === "flow" ? "text-white" : "text-slate-400 hover:text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Code2 className="w-5 h-5" />
                    코드 흐름 분석
                  </div>
                  {selectedTab === "flow" && (
                    <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: "#7DE2D1" }}></div>
                  )}
                </button>
                <button
                  onClick={() => setSelectedTab("api")}
                  className={`px-6 py-4 font-semibold transition relative ${
                    selectedTab === "api" ? "text-white" : "text-slate-400 hover:text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Network className="w-5 h-5" />
                    API & 데이터 흐름
                  </div>
                  {selectedTab === "api" && (
                    <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: "#7DE2D1" }}></div>
                  )}
                </button>
              </div>

              {/* Code Flow Analysis */}
              {selectedTab === "flow" && (
                <div className="space-y-6 mb-12">
                  <h2 className="text-2xl font-bold text-white">함수 호출 흐름</h2>

                  {analysisResult.functions.map((func, idx) => (
                    <div
                      key={idx}
                      className="p-6 rounded-xl border border-[#2B2C28] space-y-4"
                      style={{ backgroundColor: "#1a1a18" }}
                    >
                      {/* Function Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#7DE2D1" }}></div>
                          <h3 className="text-lg font-bold text-white font-mono">{func.functionName}</h3>
                        </div>
                        <span
                          className="text-xs px-3 py-1 rounded-full font-semibold"
                          style={{ backgroundColor: "#339989/20", color: "#7DE2D1" }}
                        >
                          {func.returns}
                        </span>
                      </div>

                      {/* Parameters */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-slate-400 text-xs uppercase font-semibold mb-2">매개변수</p>
                          <div className="bg-[#131515]/50 rounded-lg p-3 border border-[#2B2C28]">
                            <code className="text-[#7DE2D1] text-sm font-mono">{func.params.join(", ")}</code>
                          </div>
                        </div>
                        <div>
                          <p className="text-slate-400 text-xs uppercase font-semibold mb-2">반환값</p>
                          <div className="bg-[#131515]/50 rounded-lg p-3 border border-[#2B2C28]">
                            <code className="text-[#339989] text-sm font-mono">{func.returns}</code>
                          </div>
                        </div>
                      </div>

                      {/* Function Calls */}
                      <div>
                        <p className="text-slate-400 text-xs uppercase font-semibold mb-3">호출 함수</p>
                        <div className="flex flex-wrap gap-2">
                          {func.calls.map((call, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#339989]/30"
                              style={{ backgroundColor: "#339989/5" }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#7DE2D1" }}></span>
                              <code className="text-sm text-white font-mono">{call}</code>
                              {i < func.calls.length - 1 && <ArrowRight className="w-3 h-3 text-slate-500 ml-2" />}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* API & Data Flow Analysis */}
              {selectedTab === "api" && (
                <div className="space-y-8 mb-12">
                  {/* API Endpoints */}
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-6">API 엔드포인트</h2>
                    <div className="grid gap-3">
                      {analysisResult.apiEndpoints.map((endpoint, idx) => {
                        const [method, path] = endpoint.split(" ")
                        const methodColor =
                          method === "GET"
                            ? "#339989"
                            : method === "POST"
                              ? "#7DE2D1"
                              : method === "PUT"
                                ? "#FFB563"
                                : "#FF6B6B"

                        return (
                          <div
                            key={idx}
                            className="flex items-center gap-4 p-4 rounded-lg border border-[#2B2C28]"
                            style={{ backgroundColor: "#1a1a18" }}
                          >
                            <span
                              className="px-3 py-1 rounded font-bold text-sm min-w-fit"
                              style={{ backgroundColor: methodColor + "20", color: methodColor }}
                            >
                              {method}
                            </span>
                            <code className="text-slate-300 font-mono flex-1">{path}</code>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Data Flow */}
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-6">데이터 흐름</h2>
                    <div className="space-y-3">
                      {analysisResult.dataFlow.map((flow, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-lg border border-[#2B2C28]"
                          style={{ backgroundColor: "#1a1a18" }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 flex-1 text-white font-light">
                              {flow.split(" → ").map((part, i) => (
                                <span key={i} className="flex items-center gap-2">
                                  <span className="px-3 py-2 rounded-lg bg-[#2B2C28] text-sm font-mono">{part}</span>
                                  {i < flow.split(" → ").length - 1 && (
                                    <ArrowRight className="w-4 h-4" style={{ color: "#7DE2D1" }} />
                                  )}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Export Options */}
              <div className="border-t border-[#2B2C28] pt-8">
                <h3 className="text-lg font-bold text-white mb-4">분석 결과 내보내기</h3>
                <div className="flex gap-4">
                  <Button className="text-white font-semibold" style={{ backgroundColor: "#339989" }}>
                    PDF 다운로드
                  </Button>
                  <Button className="border border-[#2B2C28] text-white hover:bg-[#2B2C28]/50 bg-transparent font-semibold">
                    JSON 내보내기
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
