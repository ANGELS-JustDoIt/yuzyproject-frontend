import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "./api";

/**
 * 인증이 필요한 페이지에서 사용하는 훅
 * 토큰이 없으면 로그인 페이지로 즉시 리다이렉트합니다.
 * 컴포넌트 렌더링 전에 체크하므로 페이지가 잠깐 보이는 현상을 방지합니다.
 */
export function useRequireAuth() {
  const router = useRouter();

  useEffect(() => {
    // 즉시 체크하고 리다이렉트
    const token = getToken();
    if (!token) {
      router.replace("/login");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 빈 배열로 마운트 시 한 번만 실행
}

