"use client";

import { useState, useEffect } from "react";
import {
  Code2,
  ChevronRight,
  ChevronDown,
  FileCode,
  Lock,
  MessageSquare,
  Settings,
  Database,
  ArrowRight,
  X,
  Info,
} from "lucide-react";
import Link from "next/link";
import Header from "@/components/Header";

// JSON 구조에 맞는 타입 정의
interface FunctionChild {
  function: string;
  file: string;
  description: string;
  children: FunctionChild[];
}

interface Endpoint {
  method: string;
  url: string;
  function: string;
  children: FunctionChild[];
}

interface Category {
  category: string;
  categoryName: string;
  endpoints: Endpoint[];
}

interface AnalysisData {
  api: Category[];
}

export default function VisualizePage() {
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null);
  const [selectedFunction, setSelectedFunction] =
    useState<FunctionChild | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // AI 서버에서 분석 결과 받아오기
  useEffect(() => {
    const loadAnalysisData = () => {
      try {
        setIsLoading(true);
        setError(null);

        // 방법 1: localStorage에서 받기
        const storedData = localStorage.getItem("analysisResult");
        console.log(
          "localStorage에서 데이터 읽기 시도:",
          storedData ? "데이터 있음" : "데이터 없음"
        );

        if (storedData) {
          try {
            const parsed = JSON.parse(storedData);
            console.log("파싱된 데이터:", parsed);

            // 데이터 구조 검증
            if (!parsed || !parsed.api || !Array.isArray(parsed.api)) {
              throw new Error("잘못된 데이터 형식입니다.");
            }

            setAnalysisData(parsed);

            if (parsed.api && parsed.api.length > 0) {
              setSelectedCategory(parsed.api[0].category);
              if (
                parsed.api[0].endpoints &&
                parsed.api[0].endpoints.length > 0
              ) {
                const firstEndpoint = parsed.api[0].endpoints[0];
                setSelectedEndpoint(
                  `${parsed.api[0].category}-${firstEndpoint.method}-${firstEndpoint.url}`
                );
              }
            }
            setIsLoading(false);
            return;
          } catch (parseError) {
            console.error("JSON 파싱 오류:", parseError);
            throw new Error(
              "저장된 데이터를 읽을 수 없습니다. 다시 분석해주세요."
            );
          }
        }

        // 방법 2: URL 쿼리 파라미터에서 받기 (브라우저에서만 작동)
        if (typeof window !== "undefined") {
          const urlParams = new URLSearchParams(window.location.search);
          const dataParam = urlParams.get("data");
          if (dataParam) {
            try {
              const parsed = JSON.parse(decodeURIComponent(dataParam));
              if (parsed && parsed.api && Array.isArray(parsed.api)) {
                setAnalysisData(parsed);
                if (parsed.api.length > 0) {
                  setSelectedCategory(parsed.api[0].category);
                  if (
                    parsed.api[0].endpoints &&
                    parsed.api[0].endpoints.length > 0
                  ) {
                    const firstEndpoint = parsed.api[0].endpoints[0];
                    setSelectedEndpoint(
                      `${parsed.api[0].category}-${firstEndpoint.method}-${firstEndpoint.url}`
                    );
                  }
                }
                setIsLoading(false);
                return;
              }
            } catch (urlParseError) {
              console.error("URL 파라미터 파싱 오류:", urlParseError);
            }
          }
        }

        // 방법 3: API 호출 (백엔드에서 받아오기)
        // const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
        // const response = await fetch(`${API_BASE_URL}/api/analysis`, {
        //   headers: {
        //     Authorization: `Bearer ${getToken()}`,
        //   },
        // });
        // if (!response.ok) throw new Error("분석 결과를 불러올 수 없습니다");
        // const data = await response.json();
        // setAnalysisData(data);

        // 데이터가 없으면 에러 표시
        setError(
          "분석 결과를 찾을 수 없습니다. 코드 분석 페이지에서 폴더를 업로드해주세요."
        );
        setIsLoading(false);
      } catch (err) {
        console.error("분석 데이터 로드 실패:", err);
        setError(
          err instanceof Error
            ? err.message
            : "분석 결과를 불러오는데 실패했습니다."
        );
        setIsLoading(false);
      }
    };

    // 클라이언트에서만 실행
    if (typeof window !== "undefined") {
      loadAnalysisData();
    } else {
      setIsLoading(false);
      setError("브라우저 환경에서만 작동합니다.");
    }
  }, []);

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET":
        return "#339989";
      case "POST":
        return "#7DE2D1";
      case "PUT":
        return "#FFB563";
      case "DELETE":
        return "#FF6B6B";
      case "PATCH":
        return "#9B59B6";
      default:
        return "#339989";
    }
  };

  const getFileIcon = (file: string) => {
    if (file.includes("middleware")) return Settings;
    if (file.includes("data") || file.includes("repository")) return Database;
    if (file.includes("controller")) return Code2;
    if (file.includes("bcrypt") || file.includes("jwt")) return Lock;
    return FileCode;
  };

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const handleFunctionClick = (func: FunctionChild) => {
    setSelectedFunction(func);
  };

  const renderFunctionTree = (
    children: FunctionChild[],
    level: number = 0,
    parentId: string = ""
  ) => {
    return children.map((child, index) => {
      const nodeId = `${parentId}-${index}`;
      const isExpanded = expandedNodes.has(nodeId);
      const hasChildren = child.children && child.children.length > 0;
      const Icon = getFileIcon(child.file);
      const isSelected =
        selectedFunction?.function === child.function &&
        selectedFunction?.file === child.file;

      return (
        <div key={nodeId} className="ml-2 md:ml-4">
          <div
            onClick={() => handleFunctionClick(child)}
            className={`flex items-start gap-2 p-3 rounded-lg mb-2 transition-all cursor-pointer group ${
              level === 0
                ? "bg-[#1a1a18] border border-[#2B2C28]"
                : "bg-[#131515] border border-[#2B2C28]/50"
            } ${
              isSelected
                ? "border-[#7DE2D1] bg-[#339989]/10 shadow-lg shadow-[#339989]/20"
                : "hover:border-[#339989] hover:bg-[#1a1a18]/80"
            }`}
          >
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNode(nodeId);
                }}
                className="mt-1 text-slate-400 hover:text-white transition flex-shrink-0"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            ) : (
              <div className="w-4 h-4 flex-shrink-0" />
            )}

            <Icon className="w-4 h-4 text-[#7DE2D1] mt-1 flex-shrink-0 group-hover:scale-110 transition-transform" />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-white font-mono text-sm font-medium truncate ${
                    isSelected ? "text-[#7DE2D1]" : "group-hover:text-[#7DE2D1]"
                  } transition-colors`}
                >
                  {child.function}
                </span>
              </div>
              <div className="text-xs text-slate-400 mb-1 truncate">
                {child.file}
              </div>
              <div className="text-xs text-slate-500 line-clamp-2">
                {child.description}
              </div>
            </div>

            {isSelected && (
              <div className="w-2 h-2 rounded-full bg-[#7DE2D1] flex-shrink-0 mt-2 animate-pulse" />
            )}
          </div>

          {hasChildren && isExpanded && (
            <div className="ml-4 md:ml-6 border-l-2 border-[#2B2C28] pl-2 md:pl-4">
              {renderFunctionTree(child.children, level + 1, nodeId)}
            </div>
          )}
        </div>
      );
    });
  };

  const selectedCategoryData = analysisData?.api.find(
    (cat) => cat.category === selectedCategory
  );
  const selectedEndpointData = selectedCategoryData?.endpoints.find(
    (ep) => `${selectedCategory}-${ep.method}-${ep.url}` === selectedEndpoint
  );

  if (isLoading) {
    return (
      <main
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#131515" }}
      >
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#339989] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <div className="text-slate-400">분석 결과를 불러오는 중...</div>
        </div>
      </main>
    );
  }

  if (error || !analysisData) {
    return (
      <main
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: "#131515" }}
      >
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-[#FF6B6B]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-[#FF6B6B]" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">오류 발생</h2>
          <p className="text-slate-400 mb-6">
            {error || "분석 결과를 찾을 수 없습니다."}
          </p>
          <Link
            href="/code"
            className="inline-block px-6 py-3 bg-[#339989] text-white rounded-lg hover:bg-[#7DE2D1] transition font-medium"
          >
            코드 분석 페이지로 돌아가기
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#131515" }}
    >
      <Header />

      <div className="flex flex-col lg:flex-row flex-1 pt-20">
        {/* 좌측 사이드바: 카테고리 및 엔드포인트 목록 */}
        <aside
          className={`w-full lg:w-80 border-r border-[#2B2C28] overflow-y-auto transition-all ${
            isMobileMenuOpen ? "hidden lg:block" : "block"
          }`}
          style={{
            backgroundColor: "#1a1a18",
            maxHeight: "calc(100vh - 80px)",
          }}
        >
          <div className="p-4">
            <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              API 분석 결과
            </h2>

            {analysisData.api.map((category) => (
              <div key={category.category} className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  {category.category === "auth" ? (
                    <Lock className="w-4 h-4 text-[#7DE2D1]" />
                  ) : (
                    <MessageSquare className="w-4 h-4 text-[#FFB563]" />
                  )}
                  <h3
                    className={`font-semibold text-sm ${
                      category.category === "auth"
                        ? "text-[#7DE2D1]"
                        : "text-[#FFB563]"
                    }`}
                  >
                    {category.categoryName} ({category.endpoints.length}개)
                  </h3>
                </div>
                <div className="space-y-1">
                  {category.endpoints.map((endpoint) => {
                    const endpointId = `${category.category}-${endpoint.method}-${endpoint.url}`;
                    const isSelected = selectedEndpoint === endpointId;
                    return (
                      <button
                        key={endpointId}
                        onClick={() => {
                          setSelectedCategory(category.category);
                          setSelectedEndpoint(endpointId);
                          setSelectedFunction(null);
                          setExpandedNodes(new Set());
                        }}
                        className={`w-full text-left px-3 py-2 rounded text-sm transition-all group ${
                          isSelected
                            ? "bg-[#339989] text-white shadow-lg"
                            : "text-slate-400 hover:bg-[#2B2C28] hover:text-white"
                        }`}
                      >
                        <div
                          className="font-mono text-xs mb-1"
                          style={{
                            color: isSelected
                              ? "#ffffff"
                              : getMethodColor(endpoint.method),
                          }}
                        >
                          {endpoint.method}
                        </div>
                        <div className="font-medium truncate">
                          {endpoint.url}
                        </div>
                        <div className="text-xs truncate mt-1 opacity-75">
                          {endpoint.function}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* 중앙 영역: 함수 호출 흐름 트리 */}
        <main
          className="flex-1 p-4 md:p-6 overflow-y-auto"
          style={{ maxHeight: "calc(100vh - 64px)" }}
        >
          {selectedEndpointData ? (
            <>
              <div className="mb-6">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <div
                    className="px-3 py-1 rounded font-mono text-xs font-bold"
                    style={{
                      backgroundColor:
                        getMethodColor(selectedEndpointData.method) + "20",
                      color: getMethodColor(selectedEndpointData.method),
                    }}
                  >
                    {selectedEndpointData.method}
                  </div>
                  <h1 className="text-xl md:text-2xl font-bold text-white break-all">
                    {selectedEndpointData.url}
                  </h1>
                </div>
                <p className="text-slate-400 font-mono text-sm break-all">
                  {selectedEndpointData.function}
                </p>
              </div>

              {/* 메인 함수 */}
              <div className="mb-4">
                <div className="bg-[#1a1a18] border-2 border-[#339989] rounded-lg p-4 hover:shadow-lg hover:shadow-[#339989]/20 transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <Code2 className="w-5 h-5 text-[#339989]" />
                    <span className="text-white font-mono font-semibold break-all">
                      {selectedEndpointData.function}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    Controller Function
                  </div>
                </div>
              </div>

              {/* 화살표 */}
              <div className="flex items-center justify-center py-2 mb-4">
                <ArrowRight className="w-6 h-6 text-[#7DE2D1] rotate-90" />
              </div>

              {/* 함수 호출 트리 */}
              <div className="space-y-2">
                {renderFunctionTree(
                  selectedEndpointData.children,
                  0,
                  selectedEndpoint || ""
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <FileCode className="w-16 h-16 text-slate-600 mb-4" />
              <p className="text-slate-500 text-sm">
                좌측에서 엔드포인트를 선택하면
              </p>
              <p className="text-slate-500 text-sm">
                함수 호출 흐름이 표시됩니다
              </p>
            </div>
          )}
        </main>

        {/* 우측 패널: 선택된 함수 상세 정보 */}
        <aside
          className={`w-full lg:w-96 border-l border-[#2B2C28] p-4 md:p-6 overflow-y-auto transition-all ${
            selectedFunction ? "block" : "hidden lg:block"
          }`}
          style={{
            backgroundColor: "#1a1a18",
            maxHeight: "calc(100vh - 80px)",
          }}
        >
          {selectedFunction ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-bold text-lg">함수 상세 정보</h2>
                <button
                  onClick={() => setSelectedFunction(null)}
                  className="lg:hidden text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* 함수명 */}
                <div className="bg-[#131515] rounded-lg p-4 border border-[#2B2C28]">
                  <div className="text-xs text-slate-500 uppercase font-semibold mb-2">
                    함수명
                  </div>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const Icon = getFileIcon(selectedFunction.file);
                      return <Icon className="w-5 h-5 text-[#7DE2D1]" />;
                    })()}
                    <div className="text-[#7DE2D1] font-mono text-sm break-all">
                      {selectedFunction.function}
                    </div>
                  </div>
                </div>

                {/* 파일 경로 */}
                <div className="bg-[#131515] rounded-lg p-4 border border-[#2B2C28]">
                  <div className="text-xs text-slate-500 uppercase font-semibold mb-2">
                    파일 경로
                  </div>
                  <div className="text-slate-300 text-sm font-mono break-all">
                    {selectedFunction.file}
                  </div>
                </div>

                {/* 설명 */}
                <div className="bg-[#131515] rounded-lg p-4 border border-[#2B2C28]">
                  <div className="text-xs text-slate-500 uppercase font-semibold mb-2 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    설명
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {selectedFunction.description}
                  </p>
                </div>

                {/* 자식 함수 수 */}
                {selectedFunction.children &&
                  selectedFunction.children.length > 0 && (
                    <div className="bg-[#131515] rounded-lg p-4 border border-[#2B2C28]">
                      <div className="text-xs text-slate-500 uppercase font-semibold mb-2">
                        호출하는 함수
                      </div>
                      <div className="text-2xl font-bold text-[#7DE2D1]">
                        {selectedFunction.children.length}개
                      </div>
                    </div>
                  )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <FileCode className="w-16 h-16 text-slate-600 mb-4" />
              <p className="text-slate-500 text-sm">함수를 클릭하면</p>
              <p className="text-slate-500 text-sm">상세 정보가 표시됩니다</p>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
