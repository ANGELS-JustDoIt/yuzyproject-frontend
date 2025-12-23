"use client";

import { useState, useRef } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Upload, FileImage, Loader2, CheckCircle2, XCircle } from "lucide-react";

const OCR_API_URL = "http://localhost:8000";

export default function CapturePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 파일 선택 핸들러
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 이미지 파일인지 확인
    if (!file.type.startsWith("image/")) {
      setError("이미지 파일만 업로드 가능합니다.");
      return;
    }

    setSelectedFile(file);
    setError(null);
    setOcrResult(null);

    // 미리보기 생성
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // OCR 실행
  const handleCapture = async () => {
    if (!selectedFile) {
      setError("이미지를 선택해주세요.");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setOcrResult(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      // 쿼리 파라미터 설정 (선택적)
      const params = new URLSearchParams({
        lang: "kor+eng",
        scale: "3",
        code_mode: "true",
        layout: "true",
        normalize: "true",
      });

      const response = await fetch(`${OCR_API_URL}/capture?${params}`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          detail: `서버 오류: ${response.status}`,
        }));
        throw new Error(errorData.detail || "OCR 처리 실패");
      }

      const data = await response.json();
      setOcrResult(data.text || "");
    } catch (err: any) {
      setError(err.message || "OCR 처리 중 오류가 발생했습니다.");
      console.error("OCR Error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // 파일 초기화
  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setOcrResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <main className="min-h-screen" style={{ backgroundColor: "#131515" }}>
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">OCR 이미지 인식</h1>
          <p className="text-gray-400">
            이미지를 업로드하여 텍스트를 추출합니다
          </p>
        </div>

        {/* 파일 선택 영역 */}
        <div className="bg-[#2b2c28] rounded-lg p-6 mb-6 border border-[#2b2c28]">
          <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-[#339989] rounded-lg bg-[#1a1a18]">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              <FileImage className="w-16 h-16 text-[#339989] mb-4" />
              <span className="text-white font-medium mb-2">
                이미지 파일을 선택하세요
              </span>
              <span className="text-gray-400 text-sm">
                PNG, JPG, JPEG 등 이미지 파일만 업로드 가능
              </span>
            </label>
          </div>

          {selectedFile && (
            <div className="mt-4 flex items-center justify-between bg-[#1a1a18] p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <FileImage className="w-5 h-5 text-[#339989]" />
                <span className="text-white">{selectedFile.name}</span>
                <span className="text-gray-400 text-sm">
                  ({(selectedFile.size / 1024).toFixed(1)} KB)
                </span>
              </div>
              <Button
                variant="outline"
                onClick={handleReset}
                className="bg-[#2b2c28] border-[#339989] text-white hover:bg-[#339989]"
              >
                초기화
              </Button>
            </div>
          )}
        </div>

        {/* 미리보기 영역 */}
        {previewUrl && (
          <div className="bg-[#2b2c28] rounded-lg p-6 mb-6 border border-[#2b2c28]">
            <h2 className="text-xl font-semibold text-white mb-4">이미지 미리보기</h2>
            <div className="flex justify-center">
              <img
                src={previewUrl}
                alt="Preview"
                className="max-w-full h-auto max-h-96 rounded-lg border border-[#339989]"
              />
            </div>
          </div>
        )}

        {/* OCR 실행 버튼 */}
        {selectedFile && (
          <div className="mb-6">
            <Button
              onClick={handleCapture}
              disabled={isProcessing}
              className="w-full bg-[#339989] hover:bg-[#2d8071] text-white font-medium py-6 text-lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  OCR 처리 중...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mr-2" />
                  OCR 실행
                </>
              )}
            </Button>
          </div>
        )}

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-red-400">
              <XCircle className="w-5 h-5" />
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* OCR 결과 영역 */}
        {ocrResult !== null && (
          <div className="bg-[#2b2c28] rounded-lg p-6 border border-[#339989]">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-[#339989]" />
              <h2 className="text-xl font-semibold text-white">OCR 결과</h2>
            </div>
            <div className="bg-[#1a1a18] rounded-lg p-4 border border-[#2b2c28]">
              <pre className="whitespace-pre-wrap text-white font-mono text-sm overflow-auto max-h-96">
                {ocrResult || "(텍스트가 없습니다)"}
              </pre>
            </div>
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(ocrResult);
                  alert("클립보드에 복사되었습니다!");
                }}
                className="bg-[#2b2c28] border-[#339989] text-white hover:bg-[#339989]"
              >
                결과 복사
              </Button>
            </div>
          </div>
        )}

        {/* 사용 방법 안내 */}
        <div className="mt-8 bg-[#2b2c28] rounded-lg p-6 border border-[#2b2c28]">
          <h3 className="text-lg font-semibold text-white mb-3">사용 방법</h3>
          <ul className="text-gray-400 space-y-2 list-disc list-inside">
            <li>이미지 파일을 선택하거나 드래그하여 업로드합니다.</li>
            <li>선택한 이미지가 미리보기에 표시됩니다.</li>
            <li>"OCR 실행" 버튼을 클릭하여 텍스트를 추출합니다.</li>
            <li>추출된 텍스트는 결과 영역에 표시되며 클립보드로 복사할 수 있습니다.</li>
          </ul>
        </div>
      </div>
    </main>
  );
}

