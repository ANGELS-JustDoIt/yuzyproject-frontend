"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Upload,
  Code2,
  Network,
  FileJson,
  Download,
  Sparkles,
  Brain,
  FileCode,
  Folder,
  FileText,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import Header from "@/components/Header";
import { useRequireAuth } from "@/lib/useAuth";
import { getToken } from "@/lib/api";

// 분석할 파일 확장자 목록
const TARGET_EXTENSIONS = [
  ".mjs",
  ".js",
  ".ts",
  ".py",
  ".java",
  ".go",
  ".json",
  ".yaml",
  ".yml",
  ".sh",
  ".rb",
  ".php",
  ".html",
  ".css",
  ".scss",
  ".md",
  ".jsx",
  ".tsx",
];

// 제외할 디렉토리
const IGNORE_DIRS = new Set([
  "node_modules",
  "venv",
  ".git",
  "__pycache__",
  "dist",
  "build",
  ".idea",
  ".vscode",
  "coverage",
  "frontend",
  "front",
  "client",
  "web",
]);

// 제외할 파일
const IGNORE_FILES = new Set(["package-lock.json", "yarn.lock", ".DS_Store"]);

// 분석 단계별 메시지
const ANALYSIS_STEPS = [
  "코드 구조를 스캔하고 있습니다...",
  "함수와 클래스를 식별 중입니다...",
  "의존성 관계를 분석 중입니다...",
  "API 엔드포인트를 추출 중입니다...",
  "데이터 흐름을 추적 중입니다...",
  "최종 분석 결과를 정리 중입니다...",
];

interface FolderInfo {
  fileCount: number;
  totalLines: number;
  totalChars: number;
}

export default function CodePage() {
  // 인증 체크 - 토큰이 없으면 로그인 페이지로 즉시 리다이렉트
  useRequireAuth();
  
  // 클라이언트 사이드에서 즉시 체크하여 페이지가 보이는 것을 방지
  if (typeof window !== "undefined" && !getToken()) {
    return null; // 리다이렉트 중이므로 아무것도 렌더링하지 않음
  }
  
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [showFolderInfo, setShowFolderInfo] = useState(false);
  const [folderInfo, setFolderInfo] = useState<FolderInfo | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [mergedContent, setMergedContent] = useState<string>("");
  const [isAnalysisComplete, setIsAnalysisComplete] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0); // 경과 시간 (초)
  const analysisStepRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, []);

  // 파일이 분석 대상인지 확인
  const shouldCollectFile = (file: File): boolean => {
    const fileName = file.name;
    if (IGNORE_FILES.has(fileName)) {
      return false;
    }
    const ext = fileName.substring(fileName.lastIndexOf(".")).toLowerCase();
    return TARGET_EXTENSIONS.includes(ext);
  };

  // 파일 경로에서 디렉토리 제외 여부 확인
  const shouldIgnorePath = (filePath: string): boolean => {
    const parts = filePath.split("/");
    return parts.some((part) => IGNORE_DIRS.has(part));
  };

  // 파일을 읽어서 내용 반환
  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.onerror = reject;
      reader.readAsText(file, "utf-8");
    });
  };

  // 폴더 업로드 처리 및 분석
  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setProgress("파일을 읽는 중...");

    try {
      // 파일 필터링 및 정렬
      const fileArray = Array.from(files);
      const validFiles = fileArray.filter((file) => {
        // webkitRelativePath를 사용하여 상대 경로 확인
        const relativePath = (file as any).webkitRelativePath || file.name;
        return shouldCollectFile(file) && !shouldIgnorePath(relativePath);
      });

      if (validFiles.length === 0) {
        setIsUploading(false);
        setProgress("");
        // alert 제거, 에러는 콘솔에만 표시
        console.error("분석할 수 있는 파일이 없습니다.");
        return;
      }

      setProgress(`${validFiles.length}개 파일 분석 중...`);

      // 파일 내용 읽기 및 병합
      const chunks: string[] = [];
      let totalLines = 0;
      let totalChars = 0;
      const maxLines = 1700;
      const maxChars = 50000;

      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        const relativePath = (file as any).webkitRelativePath || file.name;

        // 제한 확인
        if (totalLines >= maxLines || totalChars >= maxChars) {
          break;
        }

        try {
          const content = await readFileContent(file);
          const lines = content.split("\n");
          const remainLines = maxLines - totalLines;
          const takeLines = lines.slice(0, Math.max(0, remainLines));
          const fileContent = takeLines.join("\n");

          // 문자 제한 적용
          const remainChars = maxChars - totalChars;
          const finalContent =
            fileContent.length > remainChars
              ? fileContent.substring(0, Math.max(0, remainChars))
              : fileContent;

          if (finalContent.trim().length === 0) {
            continue;
          }

          // 파일 블록 생성
          const block = [
            "===== FILE START =====",
            `PATH: ${relativePath}`,
            "----- CODE -----",
            finalContent.trim(),
            "===== FILE END =====",
            "",
          ].join("\n");

          chunks.push(block);
          totalLines += finalContent.split("\n").length;
          totalChars += finalContent.length;

          // 진행 상황 업데이트
          if ((i + 1) % 10 === 0) {
            setProgress(`${i + 1}/${validFiles.length}개 파일 처리 중...`);
          }
        } catch (error) {
          console.warn(`파일 읽기 실패: ${relativePath}`, error);
          continue;
        }
      }

      // 최종 병합된 내용 생성
      const mergedContent = chunks.join("\n");
      setMergedContent(mergedContent);

      // 폴더 정보 저장
      const info: FolderInfo = {
        fileCount: chunks.length,
        totalLines,
        totalChars,
      };
      setFolderInfo(info);

      // 파일 읽기 완료 후 확인 다이얼로그 표시
      setIsUploading(false);
      setShowStartDialog(true);
    } catch (error) {
      console.error("분석 실패:", error);
      setIsAnalyzing(false);
      setIsAnalysisComplete(false);
      setShowFolderInfo(false);
      // 에러는 콘솔에만 표시, alert 제거
    } finally {
      setIsUploading(false);
      setProgress("");
      // input 초기화는 사용자가 취소할 때만
    }
  };

  // 분석 시작
  const handleStartAnalysis = async () => {
    setShowStartDialog(false);

    // 폴더 정보 화면 표시 (애니메이션)
    setShowFolderInfo(true);
    await new Promise((resolve) => setTimeout(resolve, 2000)); // 2초간 폴더 정보 표시

    // 분석 화면으로 전환 (애니메이션)
    setShowFolderInfo(false);
    await new Promise((resolve) => setTimeout(resolve, 500)); // 전환 애니메이션

    // 분석 시작
    await startAnalysis();
  };

  // 분석 시작 함수
  const startAnalysis = async () => {
    if (!mergedContent) return;

    // 분석 화면 표시
    setIsAnalyzing(true);
    setIsAnalysisComplete(false);
    setAnalysisStep(0);
    setElapsedTime(0); // 경과 시간 초기화
    analysisStepRef.current = 0;

    // 경과 시간 타이머 시작
    timerIntervalRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000); // 1초마다 업데이트

    // aimodels 서버 URL (환경 변수 또는 기본값)
    const AIMODELS_BASE_URL =
      process.env.NEXT_PUBLIC_AIMODELS_URL || "http://localhost:8000";

    // 단계 진행 인터벌 (각 단계당 15초)
    const STEP_DURATION = 15000; // 15초
    let stepInterval: NodeJS.Timeout | null = null;
    let currentStepIndex = 0;

    // 단계 진행 함수
    const advanceStep = () => {
      if (currentStepIndex < ANALYSIS_STEPS.length - 1) {
        currentStepIndex++;
        setAnalysisStep(currentStepIndex);
        analysisStepRef.current = currentStepIndex;
      }
    };

    // 단계 진행 인터벌 시작
    stepInterval = setInterval(advanceStep, STEP_DURATION);

    try {
      // aimodels의 /visualize 엔드포인트로 POST 요청
      const response = await fetch(`${AIMODELS_BASE_URL}/visualize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: mergedContent,
        }),
      });

      // 요청 완료 시 인터벌 정리
      if (stepInterval) {
        clearInterval(stepInterval);
        stepInterval = null;
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error("서버 에러 응답:", errorText);
        throw new Error(
          `AI 모델 서버 오류 (${response.status}): ${errorText.substring(
            0,
            200
          )}`
        );
      }

      let analysisResult;
      try {
        analysisResult = await response.json();
        console.log("분석 결과:", analysisResult);
      } catch (jsonError) {
        console.error("JSON 파싱 실패:", jsonError);
        const responseText = await response.text();
        console.error("서버 응답 텍스트:", responseText.substring(0, 500));
        throw new Error(
          `서버 응답을 파싱할 수 없습니다. JSON 형식 오류일 수 있습니다.`
        );
      }

      // 데이터 구조 검증
      if (
        !analysisResult ||
        !analysisResult.api ||
        !Array.isArray(analysisResult.api)
      ) {
        console.error("잘못된 데이터 형식:", analysisResult);
        throw new Error(
          "서버에서 받은 데이터 형식이 올바르지 않습니다. api 필드가 없거나 배열이 아닙니다."
        );
      }

      // 결과를 localStorage에 저장
      localStorage.setItem("analysisResult", JSON.stringify(analysisResult));

      // DB에 분석 결과 저장
      setProgress("분석 결과를 저장하는 중...");
      try {
        const { myApi } = await import("@/lib/api");

        // analysisText 생성 (요약 텍스트)
        const analysisText = `코드 분석 완료 - ${
          folderInfo?.fileCount || 0
        }개 파일, ${folderInfo?.totalLines || 0}줄, ${
          folderInfo?.totalChars || 0
        }자`;

        await myApi.createArchive({
          analysisText,
          rawResponse: analysisResult,
        });
        console.log("분석 결과가 DB에 저장되었습니다.");
      } catch (saveError) {
        console.error("DB 저장 실패:", saveError);
        // 저장 실패해도 분석 결과는 사용 가능하므로 계속 진행
      }

      // 분석 완료 단계 표시
      setAnalysisStep(ANALYSIS_STEPS.length - 1);
      setIsAnalysisComplete(true);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 완료 메시지 잠시 표시

      // 분석 완료 다이얼로그 표시
      setIsAnalyzing(false);
      setShowCompletionDialog(true);
    } catch (apiError) {
      // 에러 발생 시 인터벌 정리
      if (stepInterval) {
        clearInterval(stepInterval);
        stepInterval = null;
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      setIsAnalyzing(false);
      setIsAnalysisComplete(false);
      setShowFolderInfo(false);

      console.error("AI 모델 서버 요청 실패:", apiError);

      // 에러 메시지 추출
      let errorMessage = "알 수 없는 오류";
      if (apiError instanceof Error) {
        errorMessage = apiError.message;
        // JSON 파싱 에러인 경우 더 명확한 메시지
        if (errorMessage.includes("JSON") || errorMessage.includes("파싱")) {
          errorMessage =
            "서버에서 JSON 파싱 오류가 발생했습니다. 서버 로그를 확인하세요.";
        }
      }

      // API 요청 실패 시에도 파일 다운로드는 진행
      const blob = new Blob([mergedContent], {
        type: "text/plain;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "project_full_context.txt";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // 사용자에게 에러 표시 (alert 대신 더 나은 UI)
      alert(
        `AI 모델 서버 오류가 발생했습니다.\n\n` +
          `오류: ${errorMessage}\n\n` +
          `코드 파일은 다운로드되었습니다.`
      );

      // 에러를 다시 throw하지 않고 상태만 업데이트
      // throw new Error(...) 제거하여 페이지가 깨지지 않도록 함
    }
  };

  // 시각화 페이지로 이동
  const handleNavigateToVisualize = async () => {
    setShowCompletionDialog(false);
    // 페이지 전환 애니메이션
    setIsTransitioning(true);
    await new Promise((resolve) => setTimeout(resolve, 800)); // 전환 애니메이션
    router.push("/visualize");
  };

  return (
    <main className="min-h-screen" style={{ backgroundColor: "#131515" }}>
      <Header />

      {/* 분석 완료 다이얼로그 */}
      {showCompletionDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl mx-4">
            <div className="bg-[#1a1a18] border border-[#339989]/30 rounded-2xl p-12 shadow-2xl animate-slide-up">
              {/* 완료 아이콘 */}
              <div className="flex justify-center mb-8">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-32 h-32 border-4 border-[#7DE2D1]/20 rounded-full animate-ping"></div>
                  </div>
                  <div className="relative w-32 h-32 bg-[#7DE2D1]/10 rounded-full flex items-center justify-center">
                    <Brain className="w-16 h-16 text-[#7DE2D1]" />
                  </div>
                </div>
              </div>

              {/* 메인 텍스트 */}
              <h2 className="text-4xl font-bold text-white text-center mb-4">
                분석 완료!
              </h2>
              <p className="text-xl text-slate-400 text-center mb-8">
                시각화 페이지로 넘어갈까요?
              </p>

              {/* 버튼 */}
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={handleNavigateToVisualize}
                  className="px-8 py-6 text-lg font-semibold bg-[#339989] hover:bg-[#7DE2D1] text-white rounded-xl transition-all duration-300 transform hover:scale-105"
                >
                  확인
                </Button>
                <Button
                  onClick={() => setShowCompletionDialog(false)}
                  className="px-8 py-6 text-lg font-semibold bg-[#2B2C28] hover:bg-[#3a3b37] text-slate-300 rounded-xl transition-all duration-300"
                >
                  취소
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 페이지 전환 오버레이 */}
      {isTransitioning && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in">
          <div className="text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-40 h-40 border-4 border-[#7DE2D1]/30 rounded-full animate-ping"></div>
              </div>
              <div className="relative w-40 h-40 bg-[#7DE2D1]/10 rounded-full flex items-center justify-center">
                <BarChart3 className="w-20 h-20 text-[#7DE2D1] animate-pulse" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              시각화 페이지로 이동 중...
            </h2>
            <p className="text-slate-400">잠시만 기다려주세요</p>
          </div>
        </div>
      )}

      {/* 폴더 정보 화면 */}
      {showFolderInfo && folderInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-slide-up">
          <div className="relative w-full max-w-4xl mx-4">
            <div className="bg-[#1a1a18] border border-[#339989]/30 rounded-2xl p-16 shadow-2xl">
              {/* 아이콘 */}
              <div className="flex justify-center mb-8">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-32 h-32 border-4 border-[#7DE2D1]/20 rounded-full animate-ping"></div>
                  </div>
                  <div className="relative w-32 h-32 bg-[#7DE2D1]/10 rounded-full flex items-center justify-center">
                    <Folder className="w-16 h-16 text-[#7DE2D1] animate-pulse" />
                  </div>
                </div>
              </div>

              {/* 메인 텍스트 */}
              <h2 className="text-4xl font-bold text-white text-center mb-12">
                폴더 분석 준비 완료
              </h2>

              {/* 폴더 정보 카드 */}
              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="bg-[#2B2C28] rounded-xl p-6 border border-[#339989]/20">
                  <div className="flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8 text-[#7DE2D1]" />
                  </div>
                  <p className="text-slate-400 text-sm font-semibold uppercase mb-2 text-center">
                    파일 개수
                  </p>
                  <p className="text-3xl font-bold text-white text-center">
                    {folderInfo.fileCount}
                  </p>
                </div>
                <div className="bg-[#2B2C28] rounded-xl p-6 border border-[#339989]/20">
                  <div className="flex items-center justify-center mb-4">
                    <Code2 className="w-8 h-8 text-[#7DE2D1]" />
                  </div>
                  <p className="text-slate-400 text-sm font-semibold uppercase mb-2 text-center">
                    총 라인 수
                  </p>
                  <p className="text-3xl font-bold text-white text-center">
                    {folderInfo.totalLines.toLocaleString()}
                  </p>
                </div>
                <div className="bg-[#2B2C28] rounded-xl p-6 border border-[#339989]/20">
                  <div className="flex items-center justify-center mb-4">
                    <FileCode className="w-8 h-8 text-[#7DE2D1]" />
                  </div>
                  <p className="text-slate-400 text-sm font-semibold uppercase mb-2 text-center">
                    총 문자 수
                  </p>
                  <p className="text-3xl font-bold text-white text-center">
                    {folderInfo.totalChars.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* 안내 메시지 */}
              <div className="text-center">
                <p className="text-slate-400 text-lg">
                  AI 분석을 시작합니다...
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 시작 확인 다이얼로그 */}
      {showStartDialog && folderInfo && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl mx-4">
            <div className="bg-[#1a1a18] border border-[#339989]/30 rounded-2xl p-12 shadow-2xl animate-slide-up">
              {/* 아이콘 */}
              <div className="flex justify-center mb-8">
                <div className="relative">
                  <div className="w-24 h-24 bg-[#7DE2D1]/10 rounded-full flex items-center justify-center">
                    <Folder className="w-12 h-12 text-[#7DE2D1]" />
                  </div>
                </div>
              </div>

              {/* 메인 텍스트 */}
              <h2 className="text-3xl font-bold text-white text-center mb-4">
                이 파일로 시작할까요?
              </h2>

              {/* 폴더 정보 */}
              <div className="bg-[#2B2C28] rounded-xl p-6 mb-8 border border-[#339989]/20">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-slate-400 text-sm mb-1">파일 개수</p>
                    <p className="text-2xl font-bold text-white">
                      {folderInfo.fileCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm mb-1">총 라인 수</p>
                    <p className="text-2xl font-bold text-white">
                      {folderInfo.totalLines.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm mb-1">총 문자 수</p>
                    <p className="text-2xl font-bold text-white">
                      {folderInfo.totalChars.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={handleStartAnalysis}
                  className="px-8 py-6 text-lg font-semibold bg-[#339989] hover:bg-[#7DE2D1] text-white rounded-xl transition-all duration-300 transform hover:scale-105"
                >
                  확인
                </Button>
                <Button
                  onClick={() => {
                    setShowStartDialog(false);
                    setFolderInfo(null);
                    setMergedContent("");
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                  className="px-8 py-6 text-lg font-semibold bg-[#2B2C28] hover:bg-[#3a3b37] text-slate-300 rounded-xl transition-all duration-300"
                >
                  취소
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI 분석 중 오버레이 */}
      {isAnalyzing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-4xl mx-4">
            <div className="bg-[#1a1a18] border border-[#339989]/30 rounded-2xl p-16 shadow-2xl">
              {/* 애니메이션 아이콘 */}
              <div className="flex justify-center mb-10">
                <div className="relative">
                  {!isAnalysisComplete ? (
                    <>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-32 h-32 border-4 border-[#7DE2D1]/20 rounded-full animate-ping"></div>
                      </div>
                      <div className="relative w-32 h-32 bg-[#7DE2D1]/10 rounded-full flex items-center justify-center">
                        <Brain className="w-16 h-16 text-[#7DE2D1] animate-pulse" />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div
                          className="w-56 h-56 border-4 border-[#7DE2D1]/60 rounded-full"
                          style={{
                            boxShadow: "0 0 60px rgba(125, 226, 209, 0.8)",
                          }}
                        ></div>
                      </div>
                      <div
                        className="relative w-56 h-56 bg-[#7DE2D1]/30 rounded-full flex items-center justify-center"
                        style={{
                          boxShadow:
                            "0 0 50px rgba(125, 226, 209, 0.7), inset 0 0 30px rgba(125, 226, 209, 0.3)",
                        }}
                      >
                        <Brain
                          className="w-28 h-28 text-[#7DE2D1]"
                          style={{
                            filter:
                              "drop-shadow(0 0 30px rgba(125, 226, 209, 1)) brightness(1.3)",
                          }}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* 메인 텍스트 */}
              <h2 className="text-4xl font-bold text-white text-center mb-6">
                코드를 분석중입니다...
              </h2>

              {/* 경과 시간 표시 */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#2B2C28] rounded-lg border border-[#339989]/30">
                  <div className="w-2 h-2 rounded-full bg-[#7DE2D1] animate-pulse"></div>
                  <span className="text-slate-300 text-sm font-medium">
                    경과 시간:{" "}
                    <span className="text-[#7DE2D1] font-bold">
                      {Math.floor(elapsedTime / 60)}분 {elapsedTime % 60}초
                    </span>
                  </span>
                </div>
              </div>

              {/* 현재 단계 표시 */}
              <div className="mb-10">
                <div className="flex items-center justify-center gap-3 mb-6">
                  <Sparkles
                    className="w-6 h-6 text-[#7DE2D1] animate-spin"
                    style={{ animationDuration: "2s" }}
                  />
                  <p className="text-xl text-[#7DE2D1] font-medium">
                    {ANALYSIS_STEPS[analysisStep]}
                  </p>
                </div>

                {/* 진행 바 */}
                <div className="w-full bg-[#2B2C28] rounded-full h-3 overflow-hidden mb-3">
                  <div
                    className="h-full bg-gradient-to-r from-[#339989] to-[#7DE2D1] rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${
                        ((analysisStep + 1) / ANALYSIS_STEPS.length) * 100
                      }%`,
                    }}
                  ></div>
                </div>
                <p className="text-sm text-slate-400 text-center">
                  {analysisStep + 1} / {ANALYSIS_STEPS.length}
                </p>
              </div>

              {/* 단계별 아이콘 표시 */}
              <div className="flex justify-center gap-4 mt-10">
                {ANALYSIS_STEPS.map((_, index) => (
                  <div
                    key={index}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index <= analysisStep
                        ? "bg-[#7DE2D1] scale-125 shadow-lg shadow-[#7DE2D1]/50"
                        : "bg-[#2B2C28]"
                    }`}
                  ></div>
                ))}
              </div>

              {/* 부가 정보 */}
              <div className="mt-10 pt-6 border-t border-[#2B2C28]">
                <div className="flex items-center justify-center gap-2 text-slate-400 text-base">
                  <FileCode className="w-5 h-5" />
                  <span>AI가 코드베이스를 깊이 있게 분석하고 있습니다</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="pt-20 px-6 pb-12">
        <div className="max-w-7xl mx-auto">
          <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
            <div className="w-full max-w-2xl animate-pulse-slow">
              <div className="text-center mb-12">
                <h1 className="text-5xl font-bold text-white mb-4 animate-bounce-slow">
                  프로젝트 폴더를
                  <br />
                  <span
                    className="inline-block animate-pulse-glow"
                    style={{ color: "#7DE2D1" }}
                  >
                    분석해보세요
                  </span>
                </h1>
                <p className="text-slate-400 text-lg font-light animate-fade-in-slow">
                  코드 폴더를 업로드하면 함수 호출 흐름과 API 구조를 한눈에 볼
                  수 있습니다
                </p>
              </div>

              {/* Upload Box */}
              <div className="relative animate-scale-breathe">
                <input
                  ref={fileInputRef}
                  type="file"
                  {...({ webkitdirectory: "true" } as any)}
                  {...({ directory: "true" } as any)}
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
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-2 h-2 rounded-full animate-pulse"
                            style={{ backgroundColor: "#7DE2D1" }}
                          ></div>
                          <span className="text-slate-400 text-sm font-medium">
                            {progress || "분석 중입니다..."}
                          </span>
                        </div>
                        {progress && (
                          <div className="text-xs text-slate-500">
                            완료되면 자동으로 다운로드됩니다
                          </div>
                        )}
                      </div>
                    )}
                    {!isUploading && (
                      <div className="flex items-center justify-center gap-2 text-slate-500 text-sm mt-4">
                        <Download className="w-4 h-4" />
                        <span>
                          분석 후 합쳐진 파일이 자동으로 다운로드됩니다
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
