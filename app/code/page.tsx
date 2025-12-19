"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Upload, Code2, Network, FileJson, Download } from "lucide-react";
import Link from "next/link";
import Header from "@/components/Header";

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

export default function CodePage() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<string>("");
  const router = useRouter();

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
        throw new Error("분석할 수 있는 파일이 없습니다.");
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

      setProgress("AI 모델 서버로 전송 중...");

      // aimodels 서버 URL (환경 변수 또는 기본값)
      const AIMODELS_BASE_URL =
        process.env.NEXT_PUBLIC_AIMODELS_URL || "http://localhost:8000";

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

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `AI 모델 서버 오류 (${response.status}): ${errorText}`
          );
        }

        const analysisResult = await response.json();
        console.log("분석 결과:", analysisResult);

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
          const analysisText = `코드 분석 완료 - ${chunks.length}개 파일, ${totalLines}줄, ${totalChars}자`;
          
          await myApi.createArchive({
            analysisText,
            rawResponse: analysisResult,
          });
          console.log("분석 결과가 DB에 저장되었습니다.");
        } catch (saveError) {
          console.error("DB 저장 실패:", saveError);
          // 저장 실패해도 분석 결과는 사용 가능하므로 계속 진행
        }

        setProgress("완료!");
        alert(
          `분석 완료!\n- 처리된 파일: ${chunks.length}개\n- 총 라인 수: ${totalLines}줄\n- 총 문자 수: ${totalChars}자\n\n시각화 페이지로 이동합니다.`
        );

        // /visualize 페이지로 이동
        router.push("/visualize");
      } catch (apiError) {
        console.error("AI 모델 서버 요청 실패:", apiError);
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

        throw new Error(
          `AI 모델 서버 연결 실패: ${
            apiError instanceof Error ? apiError.message : "알 수 없는 오류"
          }\n\n파일은 다운로드되었습니다.`
        );
      }
    } catch (error) {
      console.error("분석 실패:", error);
      alert(
        error instanceof Error ? error.message : "폴더 분석에 실패했습니다"
      );
    } finally {
      setIsUploading(false);
      setProgress("");
      // input 초기화
      e.target.value = "";
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
