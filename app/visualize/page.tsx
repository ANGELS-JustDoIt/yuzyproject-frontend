"use client";

import React, { useState, useEffect } from "react";
import {
  Code2,
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
interface MainFlowItem {
  file: string;
  code: string;
  description: string;
  function?: string; // 선택적
}

interface DetailFunction {
  function: string;
  file: string;
  code: string;
  description: string;
}

interface Endpoint {
  method: string;
  url: string;
  mainFlow: MainFlowItem[];
  detailFunctions: DetailFunction[];
  // 하위 호환성을 위한 선택적 필드
  children?: any[];
  return?: string;
  function?: string;
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

            // 데이터 구조 검증 (더 상세한 검증)
            if (!parsed) {
              throw new Error("데이터가 비어있습니다.");
            }

            if (!parsed.api) {
              console.error("파싱된 데이터에 'api' 필드가 없습니다:", parsed);
              throw new Error("데이터에 'api' 필드가 없습니다.");
            }

            if (!Array.isArray(parsed.api)) {
              console.error(
                "'api' 필드가 배열이 아닙니다:",
                typeof parsed.api,
                parsed.api
              );
              throw new Error("'api' 필드가 배열 형식이 아닙니다.");
            }

            if (parsed.api.length === 0) {
              console.warn("'api' 배열이 비어있습니다.");
              // 빈 배열도 허용하되 경고만 표시
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

  // VS Code 스타일 syntax highlighting 함수
  const highlightCode = (code: string): React.ReactElement[] => {
    const lines = code.split("\n");
    return lines.map((line, lineIndex) => {
      // 빈 줄 처리
      if (!line.trim()) {
        return (
          <div key={lineIndex} className="flex">
            <span className="text-slate-600 mr-4 select-none w-8 text-right">
              {lineIndex + 1}
            </span>
            <span className="flex-1">&nbsp;</span>
          </div>
        );
      }

      const text = line;
      const parts: Array<{ text: string; color?: string }> = [];
      let lastIndex = 0;

      // 우선순위에 따라 패턴 매칭 (순서 중요!)
      // 1. 주석 (가장 먼저 처리)
      const commentRegex = /(\/\/.*|\/\*[\s\S]*?\*\/)/g;
      let commentMatch;
      const commentMatches: Array<{
        start: number;
        end: number;
        text: string;
      }> = [];
      while ((commentMatch = commentRegex.exec(text)) !== null) {
        commentMatches.push({
          start: commentMatch.index,
          end: commentMatch.index + commentMatch[0].length,
          text: commentMatch[0],
        });
      }

      // 2. 문자열 (주석 다음)
      const stringRegex = /(['"`])(?:(?=(\\?))\2.)*?\1/g;
      let stringMatch;
      const stringMatches: Array<{ start: number; end: number; text: string }> =
        [];
      while ((stringMatch = stringRegex.exec(text)) !== null) {
        stringMatches.push({
          start: stringMatch.index,
          end: stringMatch.index + stringMatch[0].length,
          text: stringMatch[0],
        });
      }

      // 3. 모든 매치 합치기 및 정렬
      const allMatches: Array<{
        start: number;
        end: number;
        text: string;
        color: string;
      }> = [
        ...commentMatches.map((m) => ({ ...m, color: "#6A9955" })),
        ...stringMatches.map((m) => ({ ...m, color: "#CE9178" })),
      ].sort((a, b) => a.start - b.start);

      // 겹치는 매치 제거 (주석이 우선)
      const filteredMatches: Array<{
        start: number;
        end: number;
        text: string;
        color: string;
      }> = [];
      allMatches.forEach((match) => {
        const overlaps = filteredMatches.some(
          (existing) =>
            (match.start >= existing.start && match.start < existing.end) ||
            (match.end > existing.start && match.end <= existing.end) ||
            (match.start <= existing.start && match.end >= existing.end)
        );
        if (!overlaps) {
          filteredMatches.push(match);
        }
      });

      // 문자열/주석이 아닌 부분에서 다른 패턴 찾기
      const processSegment = (start: number, end: number) => {
        const segment = text.substring(start, end);
        if (!segment.trim()) return;

        // 키워드
        const keywordRegex =
          /\b(export|import|async|await|function|const|let|var|if|else|return|for|while|do|switch|case|default|try|catch|finally|throw|new|this|class|extends|super|static|public|private|protected|interface|type|enum|namespace|module|declare|as|is|in|of|typeof|instanceof|void|null|undefined|true|false|break|continue)\b/g;
        const keywordMatches: Array<{
          start: number;
          end: number;
          text: string;
        }> = [];
        let keywordMatch;
        while ((keywordMatch = keywordRegex.exec(segment)) !== null) {
          keywordMatches.push({
            start: start + keywordMatch.index,
            end: start + keywordMatch.index + keywordMatch[0].length,
            text: keywordMatch[0],
          });
        }

        // 숫자
        const numberRegex = /\b\d+\.?\d*\b/g;
        const numberMatches: Array<{
          start: number;
          end: number;
          text: string;
        }> = [];
        let numberMatch;
        while ((numberMatch = numberRegex.exec(segment)) !== null) {
          numberMatches.push({
            start: start + numberMatch.index,
            end: start + numberMatch.index + numberMatch[0].length,
            text: numberMatch[0],
          });
        }

        // 함수 호출
        const functionRegex = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g;
        const functionMatches: Array<{
          start: number;
          end: number;
          text: string;
        }> = [];
        let functionMatch;
        while ((functionMatch = functionRegex.exec(segment)) !== null) {
          functionMatches.push({
            start: start + functionMatch.index,
            end: start + functionMatch.index + functionMatch[0].length,
            text: functionMatch[0],
          });
        }

        // 모든 매치 추가
        filteredMatches.push(
          ...keywordMatches.map((m) => ({ ...m, color: "#C586C0" })),
          ...numberMatches.map((m) => ({ ...m, color: "#B5CEA8" })),
          ...functionMatches.map((m) => ({ ...m, color: "#DCDCAA" }))
        );
      };

      // 문자열/주석 사이의 세그먼트 처리
      let segmentStart = 0;
      filteredMatches.forEach((match) => {
        if (match.start > segmentStart) {
          processSegment(segmentStart, match.start);
        }
        segmentStart = Math.max(segmentStart, match.end);
      });
      if (segmentStart < text.length) {
        processSegment(segmentStart, text.length);
      }

      // 최종 정렬 및 중복 제거
      const finalMatches = filteredMatches
        .filter((match, index, self) => {
          return (
            index ===
            self.findIndex(
              (m) => m.start === match.start && m.end === match.end
            )
          );
        })
        .sort((a, b) => a.start - b.start);

      // 토큰 생성
      finalMatches.forEach((match) => {
        if (match.start > lastIndex) {
          parts.push({ text: text.substring(lastIndex, match.start) });
        }
        parts.push({ text: match.text, color: match.color });
        lastIndex = match.end;
      });

      if (lastIndex < text.length) {
        parts.push({ text: text.substring(lastIndex) });
      }

      return (
        <div
          key={lineIndex}
          className="flex hover:bg-[#131515]/50 transition-colors px-2 py-0.5 group/line"
        >
          <span className="text-slate-600 mr-4 select-none w-8 text-right group-hover/line:text-slate-500">
            {lineIndex + 1}
          </span>
          <span className="flex-1 text-[#D4D4D4] font-normal">
            {parts.length > 0 ? (
              parts.map((part, partIndex) => (
                <span
                  key={partIndex}
                  style={part.color ? { color: part.color } : {}}
                >
                  {part.text}
                </span>
              ))
            ) : (
              <span>{text}</span>
            )}
          </span>
        </div>
      );
    });
  };

  // 코드 카드 렌더링 (공통)
  const renderCodeCard = (
    item: MainFlowItem | DetailFunction,
    index: number,
    isMainFlow: boolean = true
  ) => {
    const Icon = getFileIcon(item.file);
    const codeLines = item.code ? item.code.split("\n") : [];
    const displayName =
      "function" in item && item.function
        ? item.function
        : codeLines[0]?.substring(0, 50) || "코드";

    return (
      <div key={index} className="mb-6 relative">
        {/* 단계 번호 배지 */}
        <div className="absolute -left-8 top-4 w-6 h-6 rounded-full bg-gradient-to-br from-[#339989] to-[#7DE2D1] flex items-center justify-center text-white text-xs font-bold shadow-lg z-10">
          {index + 1}
        </div>

        {/* 코드 카드 */}
        <div
          className={`rounded-xl border-2 transition-all duration-300 hover:scale-[1.01] ${
            isMainFlow
              ? "bg-gradient-to-br from-[#339989]/20 to-[#7DE2D1]/10 border-[#339989] shadow-lg shadow-[#339989]/30"
              : "bg-gradient-to-br from-[#7DE2D1]/15 to-[#2B2C28] border-[#7DE2D1]/50 shadow-md shadow-[#7DE2D1]/20"
          }`}
        >
          <div className="p-5">
            {/* 헤더 섹션 */}
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 rounded-lg bg-[#131515]/80 border border-[#2B2C28] flex-shrink-0">
                <Icon className="w-6 h-6 text-[#7DE2D1]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h3 className="text-white font-bold text-base font-mono break-all">
                    {displayName.length > 60
                      ? displayName.substring(0, 60) + "..."
                      : displayName}
                  </h3>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <FileCode className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                  <span className="text-xs text-slate-400 font-mono break-all">
                    {item.file}
                  </span>
                </div>
                <div className="flex items-start gap-2 p-3 bg-[#131515]/60 rounded-lg border border-[#2B2C28]/50">
                  <Info className="w-4 h-4 text-[#7DE2D1] flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            </div>

            {/* 코드 섹션 */}
            {item.code && item.code.trim() && (
              <div className="mt-4 relative group/codeblock">
                <div className="absolute inset-0 bg-gradient-to-r from-[#339989]/10 to-[#7DE2D1]/10 rounded-lg blur-xl opacity-0 group-hover/codeblock:opacity-100 transition-opacity"></div>
                <div className="relative p-4 bg-[#0a0a0a] rounded-lg border-2 border-[#2B2C28] group-hover/codeblock:border-[#7DE2D1]/50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-[#7DE2D1]" />
                      <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                        코드
                      </span>
                      <span className="text-xs text-slate-600">
                        ({codeLines.length}줄)
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(item.code);
                      }}
                      className="px-2 py-1 bg-[#2B2C28] hover:bg-[#339989] text-slate-400 hover:text-white rounded text-xs transition-colors opacity-0 group-hover/codeblock:opacity-100"
                      title="코드 복사"
                    >
                      복사
                    </button>
                  </div>
                  <div className="relative overflow-hidden rounded">
                    <div className="overflow-x-auto max-h-96 overflow-y-auto hide-scrollbar">
                      <pre className="text-sm text-slate-200 font-mono whitespace-pre break-words leading-relaxed m-0">
                        <code className="block">
                          {highlightCode(item.code)}
                        </code>
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 연결선과 화살표 (mainFlow에서만, 마지막이 아닐 때) */}
        {isMainFlow &&
          index < (selectedEndpointData?.mainFlow?.length || 0) - 1 && (
            <div className="flex items-center justify-center my-4 relative">
              <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 h-8 bg-gradient-to-b from-[#339989] to-[#7DE2D1]"></div>
              <div className="relative z-10 bg-[#131515] p-2 rounded-full border-2 border-[#7DE2D1]/50">
                <ArrowRight className="w-5 h-5 text-[#7DE2D1] rotate-90 animate-pulse" />
              </div>
            </div>
          )}
      </div>
    );
  };

  // 하위 호환성을 위한 기존 renderCodeFlow 함수 (children 형식 지원)
  const renderCodeFlow = (
    children: any[],
    level: number = 0,
    parentId: string = ""
  ) => {
    return children.map((child, index) => {
      const nodeId = `${parentId}-${index}`;
      const hasChildren = child.children && child.children.length > 0;
      const Icon = getFileIcon(child.file);
      const codeLines = child.code ? child.code.split("\n") : [];
      const firstLine = codeLines[0] || "";
      const displayName =
        child.function || firstLine.substring(0, 50) || "코드";

      const levelColors = [
        {
          bg: "bg-gradient-to-br from-[#339989]/20 to-[#7DE2D1]/10",
          border: "border-[#339989]",
          shadow: "shadow-lg shadow-[#339989]/30",
        },
        {
          bg: "bg-gradient-to-br from-[#7DE2D1]/15 to-[#2B2C28]",
          border: "border-[#7DE2D1]/50",
          shadow: "shadow-md shadow-[#7DE2D1]/20",
        },
        {
          bg: "bg-gradient-to-br from-[#2B2C28] to-[#131515]",
          border: "border-[#2B2C28]",
          shadow: "shadow-sm",
        },
      ];
      const colors = levelColors[Math.min(level, levelColors.length - 1)];

      return (
        <div key={nodeId} className="mb-6 relative">
          <div className="absolute -left-8 top-4 w-6 h-6 rounded-full bg-gradient-to-br from-[#339989] to-[#7DE2D1] flex items-center justify-center text-white text-xs font-bold shadow-lg z-10">
            {index + 1}
          </div>
          <div
            className={`rounded-xl border-2 transition-all duration-300 hover:scale-[1.01] ${colors.bg} ${colors.border} ${colors.shadow}`}
          >
            <div className="p-5">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 rounded-lg bg-[#131515]/80 border border-[#2B2C28] flex-shrink-0">
                  <Icon className="w-6 h-6 text-[#7DE2D1]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="text-white font-bold text-base font-mono break-all">
                      {displayName.length > 60
                        ? displayName.substring(0, 60) + "..."
                        : displayName}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <FileCode className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                    <span className="text-xs text-slate-400 font-mono break-all">
                      {child.file}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-[#131515]/60 rounded-lg border border-[#2B2C28]/50">
                    <Info className="w-4 h-4 text-[#7DE2D1] flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {child.description}
                    </p>
                  </div>
                </div>
              </div>
              {child.code && child.code.trim() && (
                <div className="mt-4 relative group/codeblock">
                  <div className="relative p-4 bg-[#0a0a0a] rounded-lg border-2 border-[#2B2C28] group-hover/codeblock:border-[#7DE2D1]/50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Code2 className="w-4 h-4 text-[#7DE2D1]" />
                        <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                          코드
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(child.code);
                        }}
                        className="px-2 py-1 bg-[#2B2C28] hover:bg-[#339989] text-slate-400 hover:text-white rounded text-xs transition-colors opacity-0 group-hover/codeblock:opacity-100"
                        title="코드 복사"
                      >
                        복사
                      </button>
                    </div>
                    <div className="relative overflow-hidden rounded">
                      <div className="overflow-x-auto max-h-96 overflow-y-auto hide-scrollbar">
                        <pre className="text-sm text-slate-200 font-mono whitespace-pre break-words leading-relaxed m-0">
                          <code className="block">
                            {highlightCode(child.code)}
                          </code>
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          {hasChildren && (
            <div className="ml-8 md:ml-12 relative">
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#7DE2D1]/50 via-[#339989]/30 to-transparent"></div>
              <div className="pl-6 md:pl-8">
                {renderCodeFlow(child.children, level + 1, nodeId)}
              </div>
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
        {/* 왼쪽 사이드바: API 목록 (개선된 디자인) */}
        <aside
          className="w-full lg:w-72 xl:w-80 border-r-2 border-[#2B2C28] overflow-y-auto hide-scrollbar transition-all block flex-shrink-0"
          style={{
            backgroundColor: "#1a1a18",
            maxHeight: "calc(100vh - 80px)",
          }}
        >
          <div className="p-5 sticky top-0 bg-[#1a1a18] z-10 border-b border-[#2B2C28] pb-4 mb-4">
            <h2 className="text-white font-bold text-xl mb-1 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-[#339989] to-[#7DE2D1] rounded-lg">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                API 목록
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-2">
              엔드포인트를 선택하여 코드 흐름을 확인하세요
            </p>
          </div>
          <div className="px-5 pb-5">
            {analysisData.api.map((category) => (
              <div key={category.category} className="mb-6">
                <div className="flex items-center gap-3 mb-4 p-3 bg-[#131515] rounded-lg border border-[#2B2C28]">
                  <div
                    className={`p-2 rounded-lg ${
                      category.category === "auth"
                        ? "bg-[#7DE2D1]/20"
                        : "bg-[#FFB563]/20"
                    }`}
                  >
                    {category.category === "auth" ? (
                      <Lock className="w-5 h-5 text-[#7DE2D1]" />
                    ) : (
                      <MessageSquare className="w-5 h-5 text-[#FFB563]" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3
                      className={`font-bold text-sm ${
                        category.category === "auth"
                          ? "text-[#7DE2D1]"
                          : "text-[#FFB563]"
                      }`}
                    >
                      {category.categoryName}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {category.endpoints.length}개 엔드포인트
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  {category.endpoints.map((endpoint) => {
                    const endpointId = `${category.category}-${endpoint.method}-${endpoint.url}`;
                    const isSelected = selectedEndpoint === endpointId;
                    return (
                      <button
                        key={endpointId}
                        onClick={() => {
                          setSelectedCategory(category.category);
                          setSelectedEndpoint(endpointId);
                        }}
                        className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-all duration-200 group border-2 ${
                          isSelected
                            ? "bg-gradient-to-br from-[#339989] to-[#7DE2D1] text-white shadow-lg shadow-[#339989]/30 border-[#7DE2D1]"
                            : "bg-[#131515] text-slate-400 hover:bg-[#2B2C28] hover:text-white border-[#2B2C28] hover:border-[#7DE2D1]/30"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className={`font-mono text-xs font-bold px-2 py-1 rounded ${
                              isSelected
                                ? "bg-white/20 text-white"
                                : "bg-[#2B2C28]"
                            }`}
                            style={{
                              color: isSelected
                                ? "#ffffff"
                                : getMethodColor(endpoint.method),
                            }}
                          >
                            {endpoint.method}
                          </div>
                          {isSelected && (
                            <ArrowRight className="w-3 h-3 text-white animate-pulse" />
                          )}
                        </div>
                        <div
                          className={`font-medium truncate ${
                            isSelected ? "text-white" : "text-slate-300"
                          }`}
                        >
                          {endpoint.url}
                        </div>
                        {endpoint.function && (
                          <div
                            className={`text-xs truncate mt-1.5 ${
                              isSelected ? "text-white/80" : "text-slate-500"
                            }`}
                          >
                            {endpoint.function}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* 가운데 영역: 코드 전체와 흐름 */}
        <main
          className="flex-1 p-6 md:p-8 lg:p-10 overflow-y-auto hide-scrollbar"
          style={{ maxHeight: "calc(100vh - 80px)" }}
        >
          {selectedEndpointData ? (
            <>
              {/* 엔드포인트 헤더 (개선된 디자인) */}
              <div className="mb-8 pb-6 border-b-2 border-[#2B2C28]">
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <div
                    className="px-4 py-2 rounded-lg font-mono text-sm font-bold shadow-lg"
                    style={{
                      backgroundColor:
                        getMethodColor(selectedEndpointData.method) + "20",
                      color: getMethodColor(selectedEndpointData.method),
                      border: `2px solid ${getMethodColor(
                        selectedEndpointData.method
                      )}40`,
                    }}
                  >
                    {selectedEndpointData.method}
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white break-all bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                    {selectedEndpointData.url}
                  </h1>
                </div>
                {selectedEndpointData.function && (
                  <div className="flex items-center gap-2 mt-3">
                    <Code2 className="w-4 h-4 text-[#7DE2D1]" />
                    <p className="text-slate-400 font-mono text-sm break-all">
                      {selectedEndpointData.function}
                    </p>
                  </div>
                )}
                <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-2 h-2 rounded-full bg-[#7DE2D1] animate-pulse"></div>
                  <span>코드 흐름 분석 결과</span>
                </div>
              </div>

              {/* 코드 흐름 - 왼쪽: mainFlow, 오른쪽: detailFunctions */}
              <div className="relative">
                {/* 타임라인 시작 마커 */}
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#2B2C28]">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-br from-[#339989] to-[#7DE2D1] shadow-lg"></div>
                  <div className="flex-1 h-0.5 bg-gradient-to-r from-[#339989] to-transparent"></div>
                  <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                    실행 흐름
                  </span>
                </div>

                {/* mainFlow와 detailFunctions가 모두 있는 경우 */}
                {selectedEndpointData.mainFlow ||
                selectedEndpointData.detailFunctions ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 왼쪽: mainFlow (큰 흐름) */}
                    <div className="space-y-2">
                      <div className="mb-4 pb-3 border-b border-[#2B2C28]">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#339989]"></div>
                          큰 흐름 (라우팅)
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          app.mjs → router → controller
                        </p>
                      </div>
                      {selectedEndpointData.mainFlow &&
                      selectedEndpointData.mainFlow.length > 0 ? (
                        <div className="relative pl-8">
                          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#339989] via-[#7DE2D1] to-transparent"></div>
                          {selectedEndpointData.mainFlow.map((item, index) =>
                            renderCodeCard(item, index, true)
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-slate-500">
                          <p>큰 흐름 정보가 없습니다.</p>
                        </div>
                      )}
                    </div>

                    {/* 오른쪽: detailFunctions (세부 함수들) */}
                    <div className="space-y-2">
                      <div className="mb-4 pb-3 border-b border-[#2B2C28]">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#7DE2D1]"></div>
                          세부 함수들
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          middleware, repository, helper functions
                        </p>
                      </div>
                      {selectedEndpointData.detailFunctions &&
                      selectedEndpointData.detailFunctions.length > 0 ? (
                        <div className="space-y-4">
                          {selectedEndpointData.detailFunctions.map(
                            (item, index) => renderCodeCard(item, index, false)
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-slate-500">
                          <p>세부 함수 정보가 없습니다.</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : selectedEndpointData.children &&
                  selectedEndpointData.children.length > 0 ? (
                  // 하위 호환성: 기존 children 형식 지원
                  <div className="space-y-2">
                    {renderCodeFlow(
                      selectedEndpointData.children as any,
                      0,
                      selectedEndpoint || ""
                    )}
                  </div>
                ) : (
                  <div className="text-center py-16 text-slate-500">
                    <div className="w-20 h-20 bg-[#2B2C28] rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileCode className="w-10 h-10 opacity-50" />
                    </div>
                    <p className="text-lg">
                      이 엔드포인트에는 코드 흐름이 없습니다.
                    </p>
                  </div>
                )}

                {/* 타임라인 종료 마커 */}
                {(selectedEndpointData.mainFlow ||
                  selectedEndpointData.detailFunctions ||
                  (selectedEndpointData.children &&
                    selectedEndpointData.children.length > 0)) && (
                  <div className="flex items-center gap-3 mt-8 pt-4 border-t border-[#2B2C28]">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-[#7DE2D1] to-[#339989] shadow-lg"></div>
                    <div className="flex-1 h-0.5 bg-gradient-to-r from-transparent to-[#7DE2D1]"></div>
                    <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                      완료
                    </span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <div className="w-24 h-24 bg-gradient-to-br from-[#339989]/20 to-[#7DE2D1]/10 rounded-full flex items-center justify-center mb-6 border-2 border-[#7DE2D1]/30">
                <FileCode className="w-12 h-12 text-[#7DE2D1]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                API를 선택하세요
              </h3>
              <p className="text-slate-400 text-sm mb-1">
                왼쪽 사이드바에서 API를 선택하면
              </p>
              <p className="text-slate-400 text-sm">
                상세한 코드 흐름이 표시됩니다
              </p>
              <div className="mt-6 flex items-center gap-2 text-xs text-slate-500">
                <ArrowRight className="w-4 h-4 rotate-180" />
                <span>왼쪽에서 선택</span>
              </div>
            </div>
          )}
        </main>
      </div>
    </main>
  );
}
