"use client";
import { useState, useEffect } from "react";
import type React from "react";
import { useRouter } from "next/navigation";

import {
  Bell,
  Calendar,
  Archive,
  Bookmark,
  User,
  ChevronLeft,
  ChevronRight,
  X,
  Plus,
  Edit,
  Trash2,
  Heart,
  MessageCircle,
  Eye,
  Loader2,
} from "lucide-react";
import Header from "@/components/Header";
import { postApi, myApi } from "@/lib/api";
import { Button } from "@/components/ui/button";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// DB 스키마에 맞춘 타입 정의
interface Member {
  user_id: string;
  password: string;
  email: string;
  hope_job: string;
  created_at: string;
}

interface Grass {
  grass_id: number;
  grass_date: string;
  user_id: string;
  is_login: boolean;
  is_code: boolean;
  is_board: boolean;
  is_reply: boolean;
}

interface StudyArchive {
  user_id: string;
  archive_id: number;
  analysis_text: string;
  raw_response: string;
  created_at: string;
}

// interface StudyArchiveImg {
//   archive_image_id: number
//   archive_id: number
//   image_url: string
//   created_at: string
// }

interface Scrap {
  scrapId?: number;
  scrab_id: number;
  boardId?: number;
  board_id: number;
  userId?: string;
  user_id: string;
  createdAt?: string;
  created_at: string;
  title?: string;
  type?: string;
  content?: string;
  views?: number;
  isSolved?: boolean;
  likeCount?: number;
  files?: any[];
  postUserName?: string;
  postUserId?: number;
  userIdx?: number;
}

interface Noti {
  noti_id: number;
  noti_type: string;
  noti_val: string;
  noti_content: string;
  read_yn: boolean;
  user_id: string;
  created_at: string;
}

interface Schedule {
  scheduleId: number;
  scheduleDate: string; // YYYY-MM-DD 형식
  title: string;
  description?: string | null;
  createdAt?: string;
}

// 목 데이터
const mockMember: Member = {
  user_id: "hubo0217",
  password: "",
  email: "hubo@example.com",
  hope_job: "머신러닝 엔지니어",
  created_at: "2024-01-01T00:00:00",
};

const mockGrass: Grass[] = Array.from({ length: 365 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (365 - i));
  const random = Math.random();
  return {
    grass_id: i + 1,
    grass_date: date.toISOString().split("T")[0],
    user_id: "hubo0217",
    is_login: random > 0.3,
    is_code: random > 0.6,
    is_board: random > 0.7,
    is_reply: random > 0.8,
  };
});

const mockArchives: StudyArchive[] = [
  {
    user_id: "hubo0217",
    archive_id: 1,
    analysis_text: "React Hooks 완벽 가이드",
    raw_response:
      "useState, useEffect, useContext 등 주요 Hooks에 대한 학습 내용 정리...",
    created_at: "2025-01-10T10:00:00",
  },
  {
    user_id: "hubo0217",
    archive_id: 2,
    analysis_text: "TypeScript 고급 타입 시스템",
    raw_response:
      "제네릭, 유틸리티 타입, 조건부 타입 등 고급 TypeScript 기능 학습...",
    created_at: "2025-01-09T14:30:00",
  },
];

const mockScraps: Scrap[] = [
  {
    scrab_id: 1,
    board_id: 101,
    user_id: "hubo0217",
    created_at: "2025-01-10T12:00:00",
  },
  {
    scrab_id: 2,
    board_id: 102,
    user_id: "hubo0217",
    created_at: "2025-01-09T16:00:00",
  },
  {
    scrab_id: 3,
    board_id: 103,
    user_id: "hubo0217",
    created_at: "2025-01-08T10:00:00",
  },
];

const mockNotifications: Noti[] = [
  {
    noti_id: 1,
    noti_type: "comment",
    noti_val: "board_1",
    noti_content: "새로운 댓글이 달렸습니다",
    read_yn: false,
    user_id: "hubo0217",
    created_at: "2025-01-12T10:00:00",
  },
  {
    noti_id: 2,
    noti_type: "scrap",
    noti_val: "board_2",
    noti_content: "스크랩한 글이 업데이트되었습니다",
    read_yn: false,
    user_id: "hubo0217",
    created_at: "2025-01-12T09:00:00",
  },
  {
    noti_id: 3,
    noti_type: "schedule",
    noti_val: "schedule_1",
    noti_content: "오늘 일정이 1개 있습니다",
    read_yn: true,
    user_id: "hubo0217",
    created_at: "2025-01-12T08:00:00",
  },
];

export default function MyPage() {
  const router = useRouter();
  const [member, setMember] = useState<Member | null>(null);
  const [grassData, setGrassData] = useState<Grass[]>([]);
  const [archives, setArchives] = useState<StudyArchive[]>([]);
  const [scraps, setScraps] = useState<Scrap[]>([]);
  const [notifications, setNotifications] = useState<Noti[]>([]);
  const [stats, setStats] = useState<{
    scrapsCount: number;
    archivesCount: number;
    viewsCount: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [activeSection, setActiveSection] = useState<
    "archive" | "scraps" | "profile" | "notifications" | null
  >(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedYear, setSelectedYear] = useState(2025);

  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [showDateScheduleModal, setShowDateScheduleModal] = useState(false);

  // 스크랩 게시글 상세보기 관련
  const [selectedScrapPost, setSelectedScrapPost] = useState<Scrap | null>(
    null
  );
  const [showScrapPostModal, setShowScrapPostModal] = useState(false);
  const [editingScrapPost, setEditingScrapPost] = useState<Scrap | null>(null);
  const [scrapPostComments, setScrapPostComments] = useState<any[]>([]);
  const [scrapPostLiked, setScrapPostLiked] = useState(false);
  const [scrapCommentText, setScrapCommentText] = useState("");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        const { myApi } = await import("@/lib/api");

        // 일정 조회를 위한 날짜 계산
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth() + 1;
        const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
        const endDate = `${year}-${String(month).padStart(2, "0")}-31`;

        // 모든 API를 병렬로 호출
        const [
          profileData,
          grassData,
          scrapsData,
          notificationsData,
          schedulesData,
          archivesData,
        ] = await Promise.all([
          myApi.getProfile(),
          myApi.getGrass(),
          myApi.getScraps(),
          myApi.getNotifications(),
          myApi.getSchedules(startDate, endDate),
          myApi.getArchives(),
        ]);

        // 프로필 및 통계 처리
        if (profileData.profile) {
          setMember({
            user_id:
              profileData.profile.userId || profileData.profile.userName || "",
            password: "",
            email: profileData.profile.email || "",
            hope_job: profileData.profile.hopeJob || "",
            created_at: profileData.profile.createdAt || "",
          });
          setCurrentUserId(profileData.profile.userIdx || null);
        }
        if (profileData.stats) {
          setStats(profileData.stats);
        }

        // 아카이브 처리
        if (archivesData.archives) {
          const processedArchives = archivesData.archives.map((a: Record<string, unknown>) => ({
            user_id: String(
              a.userId || a.user_id || a.userName || a.user_name || ""
            ),
            archive_id: Number(a.archiveId || a.archive_id || 0),
            analysis_text: String(a.analysisText || a.analysis_text || ""),
            raw_response: String(a.rawResponse || a.raw_response || ""),
            created_at: String(a.createdAt || a.created_at || ""),
          }));
          // 시간 순서로 정렬 (최신 것부터 오래된 순서)
          processedArchives.sort((a, b) => {
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();
            return dateB - dateA;
          });
          setArchives(processedArchives);
        }

        // 잔디 데이터 처리
        console.log("잔디 데이터 응답:", grassData);
        if (grassData.grass && Array.isArray(grassData.grass)) {
          const processedGrass = grassData.grass.map(
            (g: Record<string, unknown>) => {
              // 날짜 형식 변환 (Date 객체일 수도 있고 문자열일 수도 있음)
              let grassDate = "";
              if (g.grassDate) {
                grassDate =
                  g.grassDate instanceof Date
                    ? g.grassDate.toISOString().split("T")[0]
                    : String(g.grassDate).split("T")[0];
              } else if (g.grass_date) {
                grassDate =
                  g.grass_date instanceof Date
                    ? g.grass_date.toISOString().split("T")[0]
                    : String(g.grass_date).split("T")[0];
              }

              return {
                grass_id: Number(g.grassId || g.grass_id) || 0,
                grass_date: grassDate,
                user_id: String(
                  g.userId || g.user_id || g.userName || g.user_name || ""
                ),
                is_login: Boolean(g.isLogin ?? g.is_login ?? false),
                is_code: Boolean(g.isCode ?? g.is_code ?? false),
                is_board: Boolean(g.isBoard ?? g.is_board ?? false),
                is_reply: Boolean(g.isReply ?? g.is_reply ?? false),
              };
            }
          );
          console.log("처리된 잔디 데이터:", processedGrass);
          setGrassData(processedGrass);
        } else {
          // 잔디 데이터가 없으면 빈 배열로 설정
          console.log("잔디 데이터가 없습니다.");
          setGrassData([]);
        }

        // 스크랩 처리
        if (scrapsData.scraps) {
          setScraps(
            scrapsData.scraps.map((s: Record<string, unknown>) => ({
              scrapId: Number(s.scrapId || s.scrab_id || s.scrabId || 0),
              scrab_id: Number(s.scrapId || s.scrab_id || s.scrabId || 0),
              boardId: Number(s.boardId || s.board_id || 0),
              board_id: Number(s.boardId || s.board_id || 0),
              userId: String(
                s.userId || s.user_id || s.userName || s.user_name || ""
              ),
              user_id: String(
                s.userId || s.user_id || s.userName || s.user_name || ""
              ),
              createdAt: String(s.createdAt || s.created_at || ""),
              created_at: String(s.createdAt || s.created_at || ""),
              title: s.title ? String(s.title) : undefined,
              type: s.type ? String(s.type) : undefined,
              content: s.content ? String(s.content) : undefined,
              views: s.views ? Number(s.views) : undefined,
              isSolved:
                s.isSolved !== undefined ? Boolean(s.isSolved) : undefined,
              likeCount: s.likeCount ? Number(s.likeCount) : undefined,
              files: s.files ? (s.files as any[]) : undefined,
              postUserName: s.postUserName ? String(s.postUserName) : undefined,
              postUserId: s.postUserId ? Number(s.postUserId) : undefined,
              userIdx: s.userIdx ? Number(s.userIdx) : undefined,
            }))
          );
        }

        // 알림 처리
        if (notificationsData.notifications) {
          setNotifications(
            notificationsData.notifications.map(
              (n: Record<string, unknown>) => ({
                noti_id: Number(n.notiId || n.noti_id || 0),
                noti_type: String(n.notiType || n.noti_type || ""),
                noti_val: String(n.notiVal || n.noti_val || ""),
                noti_content: String(n.notiContent || n.noti_content || ""),
                read_yn: Boolean(n.readYn ?? n.read_yn ?? false),
                user_id: String(
                  n.userId || n.user_id || n.userName || n.user_name || ""
                ),
                created_at: String(n.createdAt || n.created_at || ""),
              })
            )
          );
        }

        // 일정 처리
        if (schedulesData.schedules) {
          setSchedules(
            schedulesData.schedules.map((s: Record<string, unknown>) => {
              // scheduleDate를 YYYY-MM-DD 형식으로 정규화
              let scheduleDate: string | Date = (s.scheduleDate ||
                s.schedule_date ||
                "") as string | Date;
              if (scheduleDate instanceof Date) {
                // Date 객체인 경우 로컬 날짜를 사용하여 타임존 문제 해결
                const year = scheduleDate.getFullYear();
                const month = String(scheduleDate.getMonth() + 1).padStart(
                  2,
                  "0"
                );
                const day = String(scheduleDate.getDate()).padStart(2, "0");
                scheduleDate = `${year}-${month}-${day}`;
              } else if (typeof scheduleDate === "string") {
                // 문자열인 경우 ISO 형식이면 날짜 부분만 추출
                let dateStr = scheduleDate.split("T")[0];
                // 만약 문자열이 "2025-01-09" 형식이지만 실제로는 "2025-01-10"이어야 하는 경우
                // (타임존 변환으로 인해 하루 전으로 표시된 경우) 복구
                // 하지만 이는 정확하지 않으므로, Date 객체로 변환하여 로컬 날짜 사용
                if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                  // 문자열을 Date 객체로 변환할 때 타임존 문제를 피하기 위해
                  // 로컬 시간대 기준으로 파싱
                  const [y, m, d] = dateStr.split("-").map(Number);
                  const dateObj = new Date(y, m - 1, d);
                  const year = dateObj.getFullYear();
                  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
                  const day = String(dateObj.getDate()).padStart(2, "0");
                  dateStr = `${year}-${month}-${day}`;
                }
                scheduleDate = dateStr;
              }
              return {
                scheduleId: Number(s.scheduleId || s.schedule_id || 0),
                scheduleDate: String(scheduleDate),
                title: String(s.title || ""),
                description: s.description ? String(s.description) : null,
                createdAt: s.createdAt ? String(s.createdAt) : undefined,
              };
            })
          );
        }
      } catch (error: unknown) {
        console.error("데이터 로드 실패:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "데이터를 불러오는데 실패했습니다";
        alert(`${errorMessage}. 로그인이 필요할 수 있습니다.`);
        // 에러 발생 시 mock 데이터 사용
        setMember(mockMember);
        setGrassData(mockGrass);
        setScraps(mockScraps);
        setNotifications(mockNotifications);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // 잔디 데이터 가져오기
  const getGrassData = (date: string): Grass | null => {
    if (!grassData || grassData.length === 0) return null;
    // 날짜 형식 정규화 (YYYY-MM-DD)
    const normalizedDate = date.split("T")[0];
    const grass = grassData.find((g) => {
      if (!g.grass_date) return false;
      const grassDateNormalized = String(g.grass_date).split("T")[0];
      return grassDateNormalized === normalizedDate;
    });
    return grass || null;
  };

  // 활동 점수 계산
  const getGrassActivity = (date: string) => {
    const grass = getGrassData(date);
    if (!grass) return 0;
    let score = 0;
    if (grass.is_login) score += 1;
    if (grass.is_code) score += 1;
    if (grass.is_board) score += 1;
    if (grass.is_reply) score += 1;
    return score;
  };

  // 활동 목록 텍스트 생성
  const getActivityText = (grass: Grass | null): string => {
    if (!grass) return "활동 없음";
    const activities: string[] = [];
    if (grass.is_login) activities.push("로그인");
    if (grass.is_code) activities.push("코드 분석");
    if (grass.is_board) activities.push("게시글 작성");
    if (grass.is_reply) activities.push("댓글 작성");
    return activities.length > 0 ? activities.join(", ") : "활동 없음";
  };

  // 홀수/짝수 월별 기본 회색 색상 (투명도 적용)
  const getDefaultGrayColor = (month: number) => {
    // 홀수 월(1,3,5,7,9,11월)과 짝수 월(2,4,6,8,10,12월)로 구분
    // month는 0-11이므로, +1해서 1-12로 변환
    const monthNum = month + 1;
    const isOdd = monthNum % 2 === 1; // 홀수 월
    const grayValue = isOdd ? 100 : 160; // 홀수 월: 100, 짝수 월: 160 (더 큰 대비)
    const opacity = 0.25; // 투명도 25% (더 투명하게)
    return `rgba(${grayValue}, ${grayValue}, ${grayValue}, ${opacity})`;
  };

  const getGrassColor = (score: number, month: number) => {
    if (score === 0) return getDefaultGrayColor(month);
    if (score === 1) return "#2d5a4e"; // 더 연한 녹색
    if (score === 2) return "#4a7c6f"; // 더 연한 녹색
    if (score === 3) return "#5ba89a"; // 더 연한 녹색
    return "#7DE2D1"; // 가장 밝은 색상 유지
  };

  // 잔디 그래프 데이터 생성 (2025년 1월 1일부터 12월 31일까지)
  const targetYear = 2025;
  const startDate = new Date(targetYear, 0, 1); // 2025년 1월 1일
  const endDate = new Date(targetYear, 11, 31); // 2025년 12월 31일

  // 1월 1일이 무슨 요일인지 확인 (0=일요일, 1=월요일, ...)
  const startDayOfWeek = startDate.getDay();

  // 전체 일수 계산 (2025년은 평년이므로 365일)
  const totalDays = 365;

  // 주 수 계산 (첫 주의 시작 요일 고려)
  const weeks = Math.ceil((totalDays + startDayOfWeek) / 7);
  const days = 7;

  const grassGrid = Array.from({ length: weeks }, (_, week) =>
    Array.from({ length: days }, (_, day) => {
      const dayIndex = week * 7 + day - startDayOfWeek;
      if (dayIndex < 0 || dayIndex >= totalDays) {
        return null; // 범위 밖의 날짜
      }
      const date = new Date(targetYear, 0, 1);
      date.setDate(date.getDate() + dayIndex);

      // 로컬 시간 기준으로 날짜 문자열 생성 (YYYY-MM-DD)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const dayOfMonth = String(date.getDate()).padStart(2, "0");
      const dateString = `${year}-${month}-${dayOfMonth}`;

      // 날짜가 2025년인지 확인
      if (date.getFullYear() !== targetYear) {
        return null;
      }

      const monthIndex = date.getMonth();
      const grass = getGrassData(dateString);
      const score = getGrassActivity(dateString);
      return { score, month: monthIndex, dateString, grass };
    })
  );

  const totalContributions = grassGrid
    .flat()
    .filter((item) => item !== null && item.score > 0).length;

  // 월 라벨 생성 (각 월의 첫 번째 주에만 표시)
  const monthLabels: (number | null)[] = [];
  let lastMonth = -1;
  grassGrid.forEach((week, weekIndex) => {
    const firstDayInWeek = week.find((item) => item !== null);
    if (firstDayInWeek) {
      const date = new Date(firstDayInWeek.dateString);
      const month = date.getMonth(); // 0-11
      // 이전 주와 다른 월이면 라벨 표시 (각 월의 첫 번째 주에만)
      if (month !== lastMonth) {
        monthLabels[weekIndex] = month + 1; // 1-12로 변환
        lastMonth = month;
      } else {
        monthLabels[weekIndex] = null;
      }
    } else {
      monthLabels[weekIndex] = null;
    }
  });

  // 년도 변경 함수
  const changeYear = (direction: "prev" | "next") => {
    setSelectedYear((prev) => prev + (direction === "next" ? 1 : -1));
  };

  // 캘린더 관련
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const nextMonth = async () => {
    const newMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1
    );
    setCurrentMonth(newMonth);

    // 새 월의 일정 조회
    try {
      const { myApi } = await import("@/lib/api");
      const year = newMonth.getFullYear();
      const month = newMonth.getMonth() + 1;
      const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
      const endDate = `${year}-${String(month).padStart(2, "0")}-31`;
      const schedulesData = await myApi.getSchedules(startDate, endDate);
      if (schedulesData.schedules) {
        setSchedules(
          schedulesData.schedules.map((s: Record<string, unknown>) => {
            // scheduleDate를 YYYY-MM-DD 형식으로 정규화
            let scheduleDate: string | Date = (s.scheduleDate ||
              s.schedule_date ||
              "") as string | Date;
            if (scheduleDate instanceof Date) {
              // Date 객체인 경우 로컬 날짜를 사용하여 타임존 문제 해결
              const year = scheduleDate.getFullYear();
              const month = String(scheduleDate.getMonth() + 1).padStart(
                2,
                "0"
              );
              const day = String(scheduleDate.getDate()).padStart(2, "0");
              scheduleDate = `${year}-${month}-${day}`;
            } else if (typeof scheduleDate === "string") {
              let dateStr = scheduleDate.split("T")[0];
              // Date 객체로 변환하여 로컬 날짜로 복구
              if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                const dateObj = new Date(dateStr + "T00:00:00");
                const year = dateObj.getFullYear();
                const month = String(dateObj.getMonth() + 1).padStart(2, "0");
                const day = String(dateObj.getDate()).padStart(2, "0");
                dateStr = `${year}-${month}-${day}`;
              }
              scheduleDate = dateStr;
            }
            return {
              scheduleId: Number(s.scheduleId || s.schedule_id || 0),
              scheduleDate: String(scheduleDate),
              title: String(s.title || ""),
              description: s.description ? String(s.description) : null,
              createdAt: s.createdAt ? String(s.createdAt) : undefined,
            };
          })
        );
      }
    } catch (error) {
      console.error("일정 조회 실패:", error);
    }
  };

  const prevMonth = async () => {
    const newMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() - 1
    );
    setCurrentMonth(newMonth);

    // 새 월의 일정 조회
    try {
      const { myApi } = await import("@/lib/api");
      const year = newMonth.getFullYear();
      const month = newMonth.getMonth() + 1;
      const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
      const endDate = `${year}-${String(month).padStart(2, "0")}-31`;
      const schedulesData = await myApi.getSchedules(startDate, endDate);
      if (schedulesData.schedules) {
        setSchedules(
          schedulesData.schedules.map((s: Record<string, unknown>) => {
            // scheduleDate를 YYYY-MM-DD 형식으로 정규화
            let scheduleDate: string | Date = (s.scheduleDate ||
              s.schedule_date ||
              "") as string | Date;
            if (scheduleDate instanceof Date) {
              // Date 객체인 경우 로컬 날짜를 사용하여 타임존 문제 해결
              const year = scheduleDate.getFullYear();
              const month = String(scheduleDate.getMonth() + 1).padStart(
                2,
                "0"
              );
              const day = String(scheduleDate.getDate()).padStart(2, "0");
              scheduleDate = `${year}-${month}-${day}`;
            } else if (typeof scheduleDate === "string") {
              let dateStr = scheduleDate.split("T")[0];
              // Date 객체로 변환하여 로컬 날짜로 복구
              if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                const dateObj = new Date(dateStr + "T00:00:00");
                const year = dateObj.getFullYear();
                const month = String(dateObj.getMonth() + 1).padStart(2, "0");
                const day = String(dateObj.getDate()).padStart(2, "0");
                dateStr = `${year}-${month}-${day}`;
              }
              scheduleDate = dateStr;
            }
            return {
              scheduleId: Number(s.scheduleId || s.schedule_id || 0),
              scheduleDate: String(scheduleDate),
              title: String(s.title || ""),
              description: s.description ? String(s.description) : null,
              createdAt: s.createdAt ? String(s.createdAt) : undefined,
            };
          })
        );
      }
    } catch (error) {
      console.error("일정 조회 실패:", error);
    }
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
  });

  // 일정 관리
  const saveSchedule = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const day = Number(formData.get("date"));
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;

    // 현재 월의 날짜로 YYYY-MM-DD 형식 생성
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;
    const scheduleDate = `${year}-${String(month).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;

    try {
      const { myApi } = await import("@/lib/api");

      // 수정 중이면 수정 API 호출, 아니면 생성 API 호출
      if (editingSchedule) {
        await myApi.updateSchedule(editingSchedule.scheduleId, {
          title,
          description: description || undefined,
          scheduleDate,
        });
      } else {
        await myApi.createSchedule({
          title,
          description: description || undefined,
          scheduleDate,
        });
      }

      // 일정 목록 다시 조회
      const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
      const endDate = `${year}-${String(month).padStart(2, "0")}-31`;
      const schedulesData = await myApi.getSchedules(startDate, endDate);
      if (schedulesData.schedules) {
        setSchedules(
          schedulesData.schedules.map((s: Record<string, unknown>) => {
            // scheduleDate를 YYYY-MM-DD 형식으로 정규화
            let scheduleDate: string | Date = (s.scheduleDate ||
              s.schedule_date ||
              "") as string | Date;
            if (scheduleDate instanceof Date) {
              // Date 객체인 경우 로컬 날짜를 사용하여 타임존 문제 해결
              const year = scheduleDate.getFullYear();
              const month = String(scheduleDate.getMonth() + 1).padStart(
                2,
                "0"
              );
              const day = String(scheduleDate.getDate()).padStart(2, "0");
              scheduleDate = `${year}-${month}-${day}`;
            } else if (typeof scheduleDate === "string") {
              let dateStr = scheduleDate.split("T")[0];
              // Date 객체로 변환하여 로컬 날짜로 복구
              if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                const dateObj = new Date(dateStr + "T00:00:00");
                const year = dateObj.getFullYear();
                const month = String(dateObj.getMonth() + 1).padStart(2, "0");
                const day = String(dateObj.getDate()).padStart(2, "0");
                dateStr = `${year}-${month}-${day}`;
              }
              scheduleDate = dateStr;
            }
            return {
              scheduleId: Number(s.scheduleId || s.schedule_id || 0),
              scheduleDate: String(scheduleDate),
              title: String(s.title || ""),
              description: s.description ? String(s.description) : null,
              createdAt: s.createdAt ? String(s.createdAt) : undefined,
            };
          })
        );
      }

      // 수정 중이었다면 수정된 일정의 날짜를 기준으로, 추가 중이었다면 선택된 날짜를 기준으로 날짜별 일정 모달 열기
      const targetDate = editingSchedule
        ? new Date(editingSchedule.scheduleDate).getDate()
        : selectedDate;

      setShowScheduleModal(false);
      setEditingSchedule(null);

      // 날짜가 있으면 날짜별 일정 모달 다시 열기
      if (targetDate !== null) {
        setSelectedDate(targetDate);
        setShowDateScheduleModal(true);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "일정 저장에 실패했습니다";
      alert(errorMessage);
    }
  };

  const deleteSchedule = async (scheduleId: number) => {
    if (confirm("일정을 삭제하시겠습니까?")) {
      try {
        const { myApi } = await import("@/lib/api");
        await myApi.deleteSchedule(scheduleId);

        // 일정 목록에서 제거
        setSchedules(schedules.filter((s) => s.scheduleId !== scheduleId));
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "일정 삭제에 실패했습니다";
        alert(errorMessage);
      }
    }
  };

  // 일정이 특정 날짜에 있는지 확인하는 헬퍼 함수
  const hasScheduleOnDay = (day: number): boolean => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;
    const dateString = `${year}-${String(month).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;
    return schedules.some((s) => {
      // scheduleDate를 YYYY-MM-DD 형식으로 정규화하여 비교
      const scheduleDate = s.scheduleDate.split("T")[0];
      return scheduleDate === dateString;
    });
  };

  // 특정 날짜의 일정 목록 가져오기
  const getSchedulesForDay = (day: number): Schedule[] => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;
    const dateString = `${year}-${String(month).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;
    return schedules.filter((s) => {
      // scheduleDate를 YYYY-MM-DD 형식으로 정규화하여 비교
      const scheduleDate = s.scheduleDate.split("T")[0];
      return scheduleDate === dateString;
    });
  };

  // 알림 관리
  const markAsRead = async (noti_id: number) => {
    try {
      const { myApi } = await import("@/lib/api");
      await myApi.markNotificationRead(noti_id);
      setNotifications(
        notifications.map((n) =>
          n.noti_id === noti_id ? { ...n, read_yn: true } : n
        )
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "알림 읽음 처리에 실패했습니다";
      alert(errorMessage);
    }
  };

  const deleteNotification = async (noti_id: number) => {
    try {
      const { myApi } = await import("@/lib/api");
      await myApi.deleteNotification(noti_id);
      setNotifications(notifications.filter((n) => n.noti_id !== noti_id));
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "알림 삭제에 실패했습니다";
      alert(errorMessage);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read_yn).length;

  // 스크랩 목록 새로고침 헬퍼 함수
  const refreshScraps = async () => {
    try {
      const scrapsData = await myApi.getScraps();
      if (scrapsData.scraps) {
        setScraps(
          scrapsData.scraps.map((s: Record<string, unknown>) => ({
            scrapId: Number(s.scrapId || s.scrab_id || s.scrabId || 0),
            scrab_id: Number(s.scrapId || s.scrab_id || s.scrabId || 0),
            boardId: Number(s.boardId || s.board_id || 0),
            board_id: Number(s.boardId || s.board_id || 0),
            userId: String(
              s.userId || s.user_id || s.userName || s.user_name || ""
            ),
            user_id: String(
              s.userId || s.user_id || s.userName || s.user_name || ""
            ),
            createdAt: String(s.createdAt || s.created_at || ""),
            created_at: String(s.createdAt || s.created_at || ""),
            title: s.title ? String(s.title) : undefined,
            type: s.type ? String(s.type) : undefined,
            content: s.content ? String(s.content) : undefined,
            views: s.views ? Number(s.views) : undefined,
            isSolved:
              s.isSolved !== undefined ? Boolean(s.isSolved) : undefined,
            likeCount: s.likeCount ? Number(s.likeCount) : undefined,
            files: s.files ? (s.files as any[]) : undefined,
            postUserName: s.postUserName ? String(s.postUserName) : undefined,
            postUserId: s.postUserId ? Number(s.postUserId) : undefined,
            userIdx: s.userIdx ? Number(s.userIdx) : undefined,
          }))
        );
      }
    } catch (err) {
      console.error("스크랩 목록 새로고침 실패:", err);
    }
  };

  // 스크랩 게시글 상세보기
  const viewScrapPost = async (scrap: Scrap) => {
    const boardId = scrap.boardId || scrap.board_id;
    setSelectedScrapPost(scrap);
    setShowScrapPostModal(true);

    try {
      // 댓글 목록 조회
      const commentsResponse = await postApi.getComments(boardId);
      setScrapPostComments(commentsResponse.comments || []);

      // 좋아요 상태 조회
      const likeResponse = await postApi.getLikeStatus(boardId);
      setScrapPostLiked(likeResponse.isLiked);
    } catch (err: any) {
      console.error("게시글 상세 조회 에러:", err);
    }
  };

  // 스크랩 게시글 수정
  const editScrapPost = (scrap: Scrap) => {
    setEditingScrapPost(scrap);
    setShowScrapPostModal(false);
  };

  // 스크랩 게시글 삭제
  const deleteScrapPost = async (boardId: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      await postApi.delete(boardId);
      alert("게시글이 삭제되었습니다.");
      setShowScrapPostModal(false);
      setSelectedScrapPost(null);
      // 스크랩 목록 새로고침
      await refreshScraps();
    } catch (err: any) {
      alert(err.message || "게시글 삭제에 실패했습니다.");
    }
  };

  // 스크랩 게시글 좋아요
  const handleScrapPostLike = async (boardId: number) => {
    try {
      const response = await postApi.toggleLike(boardId);
      setScrapPostLiked(response.isLiked);
      if (selectedScrapPost) {
        setSelectedScrapPost({
          ...selectedScrapPost,
          likeCount: response.likeCount,
        });
      }
    } catch (err: any) {
      alert(err.message || "좋아요 처리에 실패했습니다.");
    }
  };

  // 스크랩 게시글 댓글 작성
  const handleScrapCommentSubmit = async (boardId: number) => {
    const text = scrapCommentText.trim();
    if (!text) return;

    try {
      await postApi.createComment(boardId, text);
      setScrapCommentText("");
      // 댓글 목록 새로고침
      const commentsResponse = await postApi.getComments(boardId);
      setScrapPostComments(commentsResponse.comments || []);
    } catch (err: any) {
      alert(err.message || "댓글 작성에 실패했습니다.");
    }
  };

  // 스크랩 취소
  const handleUnscrap = async (boardId: number) => {
    if (!confirm("스크랩을 취소하시겠습니까?")) return;

    try {
      await myApi.deleteScrap(boardId);
      alert("스크랩이 취소되었습니다.");
      // 스크랩 목록 새로고침
      await refreshScraps();
      // 상세보기 모달이 열려있으면 닫기
      if (showScrapPostModal) {
        setShowScrapPostModal(false);
        setSelectedScrapPost(null);
      }
    } catch (err: any) {
      alert(err.message || "스크랩 취소에 실패했습니다.");
    }
  };

  // 아카이브 항목 클릭 시 visualize 페이지로 이동
  const handleArchiveClick = (archive: StudyArchive) => {
    try {
      // raw_response를 파싱하여 localStorage에 저장
      let parsedData;
      const rawResponseStr = archive.raw_response || "";

      if (!rawResponseStr) {
        throw new Error("분석 결과 데이터가 없습니다.");
      }

      try {
        parsedData = JSON.parse(rawResponseStr);
      } catch (parseError) {
        throw new Error("분석 결과 데이터를 파싱할 수 없습니다.");
      }

      // 데이터 구조 검증 (api 필드가 있는지 확인)
      if (!parsedData || typeof parsedData !== "object") {
        throw new Error("데이터 형식이 올바르지 않습니다.");
      }

      // visualize 페이지에서 필요한 api 필드 검증
      if (!parsedData.api || !Array.isArray(parsedData.api)) {
        throw new Error("분석 결과에 API 데이터가 없습니다. 코드 분석 결과 형식이 올바르지 않을 수 있습니다.");
      }

      // localStorage에 저장 (visualize 페이지에서 읽을 수 있도록)
      localStorage.setItem("analysisResult", JSON.stringify(parsedData));

      // visualize 페이지로 이동
      router.push("/visualize");
    } catch (error) {
      console.error("아카이브 데이터 처리 오류:", error);
      const errorMessage = error instanceof Error ? error.message : "아카이브 데이터를 불러오는데 실패했습니다.";
      alert(errorMessage);
    }
  };

  // 스크랩 게시글 수정 저장
  const saveScrapPost = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingScrapPost) return;

    const formData = new FormData(e.currentTarget);
    const apiFormData = new FormData();
    apiFormData.append("title", formData.get("title") as string);
    apiFormData.append("content", formData.get("content") as string);
    // type은 변경 불가하므로 기존 타입 유지 (백엔드에서 처리)

    const mainImage = formData.get("mainImage") as File | null;
    if (mainImage && mainImage.size > 0) {
      apiFormData.append("mainImage", mainImage);
    }

    const files = formData.getAll("files") as File[];
    files.forEach((file) => {
      if (file.size > 0) {
        apiFormData.append("files", file);
      }
    });

    try {
      const boardId = editingScrapPost.boardId || editingScrapPost.board_id;
      await postApi.update(boardId, apiFormData);
      alert("게시글이 성공적으로 수정되었습니다.");
      setEditingScrapPost(null);
      // 스크랩 목록 새로고침
      await refreshScraps();
    } catch (error: any) {
      alert(error.message || "게시글 저장에 실패했습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-[#131515]">
      <Header />

      {/* 알림 버튼 (my 페이지 전용) */}
      <div className="fixed top-20 right-6 z-40">
        <button
          onClick={() =>
            setActiveSection(
              activeSection === "notifications" ? null : "notifications"
            )
          }
          className="relative h-9 w-9 flex items-center justify-center rounded-lg hover:bg-[#2B2C28] transition bg-[#1a1a18] border border-[#2B2C28] shadow-lg"
        >
          <Bell className="w-5 h-5 text-slate-400" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#339989] rounded-full"></span>
          )}
        </button>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-8 pt-20">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-slate-400">로딩 중...</div>
          </div>
        ) : (
          <>
            {/* 프로필 헤더 */}
            <div className="mb-8 flex items-start justify-between">
              <div className="flex items-start gap-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#339989] to-[#7DE2D1] flex items-center justify-center border-4 border-[#2B2C28]">
                  <span className="text-3xl font-bold text-white">
                    {(member?.user_id || "U").charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold text-white">
                      {member?.user_id || "로딩 중..."}님
                    </h1>
                  </div>
                  <p className="text-slate-400 text-sm mb-4">
                    {member?.hope_job || ""}
                  </p>
                  <button
                    onClick={() => setActiveSection("profile")}
                    className="text-sm text-[#339989] hover:text-[#7DE2D1] transition flex items-center gap-1"
                  >
                    <User className="w-4 h-4" />
                    수정
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#7DE2D1]">
                    {stats?.viewsCount ?? 0}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">조회</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#7DE2D1]">
                    {stats?.scrapsCount ?? scraps.length}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">스크랩</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#7DE2D1]">
                    {stats?.archivesCount ?? archives.length}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">컬렉션</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#7DE2D1]">0</div>
                  <div className="text-xs text-slate-400 mt-1">형광펜</div>
                </div>
              </div>
            </div>

            {/* 성장 잔디 */}
            <div className="bg-[#1a1a18] border border-[#2B2C28] rounded-lg p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">
                  {totalContributions}개의 성장 잔디
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => changeYear("prev")}
                    className="p-1 hover:bg-[#2B2C28] rounded transition"
                    title="이전 년도"
                  >
                    <ChevronLeft className="w-4 h-4 text-slate-400" />
                  </button>
                  <span className="text-xs text-slate-500 min-w-[80px] text-center">
                    {selectedYear}년 기준
                  </span>
                  <button
                    onClick={() => changeYear("next")}
                    className="p-1 hover:bg-[#2B2C28] rounded transition"
                    title="다음 년도"
                  >
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </div>
              {/* 월 라벨 */}
              <div className="flex mb-1" style={{ gap: "2px", width: "100%" }}>
                {monthLabels.map((month, weekIndex) => (
                  <div
                    key={weekIndex}
                    className="flex-1 text-center"
                    style={{ minWidth: 0 }}
                  >
                    {month !== null && (
                      <span className="text-base font-bold text-slate-400">
                        {month}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <div className="w-full pb-2">
                <div className="flex" style={{ gap: "2px", width: "100%" }}>
                  {grassGrid.map((week, weekIndex) => (
                    <div
                      key={weekIndex}
                      className="flex flex-col flex-1"
                      style={{ gap: "2px" }}
                    >
                      {week.map((item, dayIndex) => {
                        if (item === null) {
                          return (
                            <div
                              key={dayIndex}
                              className="w-full aspect-square rounded-[2px]"
                              style={{ backgroundColor: "transparent" }}
                            />
                          );
                        }
                        const { score, month, dateString, grass } = item;
                        const activityText = getActivityText(grass);
                        return (
                          <div
                            key={dayIndex}
                            className="w-full aspect-square rounded-[2px] cursor-pointer hover:ring-2 hover:ring-[#7DE2D1] transition"
                            style={{
                              backgroundColor: getGrassColor(score, month),
                            }}
                            title={`${dateString}\n${activityText}`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* 빠른 접근 메뉴 */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setActiveSection("archive")}
                  className="bg-[#1a1a18] border border-[#2B2C28] rounded-lg p-6 hover:border-[#339989] transition text-left group"
                >
                  <Archive className="w-8 h-8 text-[#339989] mb-3 group-hover:text-[#7DE2D1] transition" />
                  <h3 className="text-white font-medium mb-1">
                    공부 내용 저장소
                  </h3>
                  <p className="text-xs text-slate-400">
                    {archives.length}개의 학습 기록
                  </p>
                </button>

                <button
                  onClick={() => setActiveSection("scraps")}
                  className="bg-[#1a1a18] border border-[#2B2C28] rounded-lg p-6 hover:border-[#339989] transition text-left group"
                >
                  <Bookmark className="w-8 h-8 text-[#339989] mb-3 group-hover:text-[#7DE2D1] transition" />
                  <h3 className="text-white font-medium mb-1">스크랩 모음</h3>
                  <p className="text-xs text-slate-400">
                    {scraps.length}개의 저장된 자료
                  </p>
                </button>

                <button
                  onClick={() => setActiveSection("profile")}
                  className="bg-[#1a1a18] border border-[#2B2C28] rounded-lg p-6 hover:border-[#339989] transition text-left group"
                >
                  <User className="w-8 h-8 text-[#339989] mb-3 group-hover:text-[#7DE2D1] transition" />
                  <h3 className="text-white font-medium mb-1">회원정보 수정</h3>
                  <p className="text-xs text-slate-400">프로필 관리</p>
                </button>

                <button
                  onClick={() =>
                    setActiveSection(
                      activeSection === "notifications" ? null : "notifications"
                    )
                  }
                  className="bg-[#1a1a18] border border-[#2B2C28] rounded-lg p-6 hover:border-[#339989] transition text-left group relative"
                >
                  <Bell className="w-8 h-8 text-[#339989] mb-3 group-hover:text-[#7DE2D1] transition" />
                  <h3 className="text-white font-medium mb-1">알림</h3>
                  <p className="text-xs text-slate-400">
                    {unreadCount}개의 새 알림
                  </p>
                  {unreadCount > 0 && (
                    <span className="absolute top-4 right-4 w-2 h-2 bg-[#339989] rounded-full"></span>
                  )}
                </button>
              </div>

              {/* 캘린더 */}
              <div className="bg-[#1a1a18] border border-[#2B2C28] rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">
                    일정 관리
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingSchedule(null);
                        setShowScheduleModal(true);
                      }}
                      className="p-1 hover:bg-[#339989] rounded transition"
                    >
                      <Plus className="w-4 h-4 text-[#7DE2D1]" />
                    </button>
                    <button
                      onClick={prevMonth}
                      className="p-1 hover:bg-[#2B2C28] rounded transition"
                    >
                      <ChevronLeft className="w-4 h-4 text-slate-400" />
                    </button>
                    <span className="text-sm text-slate-400 min-w-[120px] text-center">
                      {monthName}
                    </span>
                    <button
                      onClick={nextMonth}
                      className="p-1 hover:bg-[#2B2C28] rounded transition"
                    >
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-2 mb-2">
                  {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
                    <div
                      key={day}
                      className="text-center text-xs text-slate-500 font-medium"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const hasSchedule = hasScheduleOnDay(day);
                    return (
                      <div
                        key={day}
                        onClick={() => {
                          setSelectedDate(day);
                          setShowDateScheduleModal(true);
                        }}
                        className={`aspect-square flex items-center justify-center text-sm rounded-lg transition cursor-pointer relative ${
                          hasSchedule
                            ? "bg-[#339989] text-white font-medium hover:bg-[#7DE2D1]"
                            : "text-slate-400 hover:bg-[#2B2C28]"
                        }`}
                      >
                        {day}
                        {hasSchedule && (
                          <span className="absolute bottom-1 w-1 h-1 bg-white rounded-full" />
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 pt-4 border-t border-[#2B2C28]">
                  <h3 className="text-xs font-semibold text-slate-400 mb-2">
                    다가오는 일정
                  </h3>
                  <div className="space-y-2">
                    {schedules
                      .sort((a, b) =>
                        a.scheduleDate.localeCompare(b.scheduleDate)
                      )
                      .slice(0, 3)
                      .map((schedule) => {
                        const date = new Date(schedule.scheduleDate);
                        const day = date.getDate();
                        return (
                          <div
                            key={schedule.scheduleId}
                            className="flex items-center gap-2 text-sm group"
                          >
                            <Calendar className="w-3 h-3 text-[#7DE2D1]" />
                            <span className="text-slate-400">{day}일</span>
                            <span className="text-white flex-1">
                              {schedule.title}
                            </span>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                              <button
                                onClick={() => {
                                  setEditingSchedule(schedule);
                                  setShowScheduleModal(true);
                                }}
                                className="p-1 hover:bg-[#2B2C28] rounded"
                              >
                                <Edit className="w-3 h-3 text-slate-400 hover:text-[#7DE2D1]" />
                              </button>
                              <button
                                onClick={() =>
                                  deleteSchedule(schedule.scheduleId)
                                }
                                className="p-1 hover:bg-[#2B2C28] rounded"
                              >
                                <Trash2 className="w-3 h-3 text-slate-400 hover:text-red-500" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>

            {/* 알림 섹션 */}
            {activeSection === "notifications" && (
              <div className="bg-[#1a1a18] border border-[#2B2C28] rounded-lg p-6 mb-8">
                <h2 className="text-xl font-bold text-white mb-4">알림</h2>
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div
                      key={notification.noti_id}
                      className={`bg-[#131515] border rounded-lg p-4 flex items-start gap-3 group ${
                        notification.read_yn
                          ? "border-[#2B2C28]"
                          : "border-[#339989]/50"
                      }`}
                    >
                      <Bell
                        className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                          notification.read_yn
                            ? "text-slate-500"
                            : "text-[#7DE2D1]"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm mb-1 ${
                            notification.read_yn
                              ? "text-slate-400"
                              : "text-white"
                          }`}
                        >
                          {notification.noti_content}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(notification.created_at).toLocaleString(
                            "ko-KR"
                          )}
                        </p>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                        {!notification.read_yn && (
                          <button
                            onClick={() => markAsRead(notification.noti_id)}
                            className="text-xs text-[#7DE2D1] hover:text-[#339989] whitespace-nowrap"
                          >
                            읽음
                          </button>
                        )}
                        <button
                          onClick={() =>
                            deleteNotification(notification.noti_id)
                          }
                          className="p-1 hover:bg-[#2B2C28] rounded"
                        >
                          <X className="w-4 h-4 text-slate-400 hover:text-red-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 공부 내용 저장소 */}
            {activeSection === "archive" && (
              <div className="bg-[#1a1a18] border border-[#2B2C28] rounded-lg p-6 mb-8">
                <h2 className="text-xl font-bold text-white mb-4">
                  공부 내용 저장소
                </h2>
                {archives.length === 0 ? (
                  <div className="text-center py-12">
                    <Archive className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                    <p className="text-slate-400 mb-2">
                      저장된 코드 분석 결과가 없습니다.
                    </p>
                    <p className="text-sm text-slate-500">
                      코드 분석 페이지에서 프로젝트를 분석하면 여기에 저장됩니다.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {archives.map((archive, index) => {
                      // 날짜와 시간 포맷팅
                      const archiveDate = new Date(archive.created_at);
                      const year = archiveDate.getFullYear();
                      const month = String(archiveDate.getMonth() + 1).padStart(2, "0");
                      const day = String(archiveDate.getDate()).padStart(2, "0");
                      const formattedDate = `${year}-${month}-${day}`;
                      const formattedTime = archiveDate.toLocaleTimeString("ko-KR", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      });

                      return (
                        <div
                          key={archive.archive_id}
                          onClick={() => handleArchiveClick(archive)}
                          className="bg-[#131515] border border-[#2B2C28] rounded-lg p-4 hover:border-[#339989] transition cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-base text-slate-400 font-medium min-w-[2rem]">
                              {index + 1}.
                            </div>
                            <div className="flex flex-col gap-1 flex-1">
                              <div className="text-lg text-white">
                                {formattedDate}
                              </div>
                              <div className="text-base text-[#7DE2D1]">
                                {formattedTime}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 스크랩 모음 */}
            {activeSection === "scraps" && (
              <div className="bg-[#1a1a18] border border-[#2B2C28] rounded-lg p-6 mb-8">
                <h2 className="text-xl font-bold text-white mb-4">
                  스크랩 모음
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {scraps.map((scrap) => {
                    const boardId = scrap.boardId || scrap.board_id;
                    const isMyPost =
                      currentUserId !== null &&
                      (scrap.userIdx === currentUserId ||
                        scrap.postUserId === currentUserId);

                    return (
                      <div
                        key={scrap.scrab_id || scrap.scrapId}
                        className="bg-[#131515] border border-[#2B2C28] rounded-lg p-4 hover:border-[#339989] transition"
                      >
                        <div className="flex items-start gap-3">
                          <Bookmark className="w-5 h-5 text-[#7DE2D1] flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <h3
                              className="text-white font-medium mb-1 hover:text-[#7DE2D1] cursor-pointer"
                              onClick={() => viewScrapPost(scrap)}
                            >
                              {scrap.title || `게시글 #${boardId}`}
                            </h3>
                            <p className="text-xs text-slate-500 mb-2">
                              {scrap.postUserName || scrap.userId || "작성자"} •{" "}
                              {new Date(
                                scrap.created_at || scrap.createdAt || ""
                              ).toLocaleDateString("ko-KR")}
                            </p>
                            {scrap.content && (
                              <p className="text-sm text-slate-400 mb-2 line-clamp-2">
                                {scrap.content}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                              {scrap.views !== undefined && (
                                <div className="flex items-center gap-1">
                                  <Eye className="w-3 h-3" />
                                  <span>{scrap.views}</span>
                                </div>
                              )}
                              {scrap.likeCount !== undefined && (
                                <div className="flex items-center gap-1">
                                  <Heart className="w-3 h-3" />
                                  <span>{scrap.likeCount}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2 mt-3">
                              {isMyPost && (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      editScrapPost(scrap);
                                    }}
                                    className="px-2 py-1 text-xs bg-[#339989] text-white rounded hover:bg-[#7DE2D1] transition"
                                  >
                                    수정
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteScrapPost(boardId);
                                    }}
                                    className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition"
                                  >
                                    삭제
                                  </button>
                                </>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUnscrap(boardId);
                                }}
                                className="px-2 py-1 text-xs bg-slate-700 text-slate-300 rounded hover:bg-slate-600 transition"
                              >
                                스크랩 취소
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 회원정보 수정 */}
            {activeSection === "profile" && (
              <div className="bg-[#1a1a18] border border-[#2B2C28] rounded-lg p-6 mb-8">
                <h2 className="text-xl font-bold text-white mb-6">
                  회원정보 수정
                </h2>
                <div className="max-w-2xl space-y-4">
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      try {
                        const { myApi } = await import("@/lib/api");
                        const updateData: {
                          user_name?: string;
                          hope_job?: string;
                          password?: string;
                        } = {};
                        const user_name = formData.get("user_name") as string;
                        const hope_job = formData.get("hope_job") as string;
                        const password = formData.get("password") as string;
                        const profileImage = formData.get("profileImage") as File | null;

                        if (user_name && user_name !== member?.user_id)
                          updateData.user_name = user_name;
                        if (hope_job && hope_job !== member?.hope_job)
                          updateData.hope_job = hope_job;
                        if (password && password.trim())
                          updateData.password = password;
                        
                        // 프로필 이미지가 있으면 FormData로 전송
                        const formDataToSend = new FormData();
                        if (updateData.user_name) formDataToSend.append("user_name", updateData.user_name);
                        if (updateData.hope_job) formDataToSend.append("hope_job", updateData.hope_job);
                        if (updateData.password) formDataToSend.append("password", updateData.password);
                        if (profileImage && profileImage.size > 0) {
                          formDataToSend.append("profileImage", profileImage);
                        }

                        // FormData에 데이터가 있으면 FormData로 전송, 아니면 JSON으로 전송
                        const hasData = Object.keys(updateData).length > 0 || (profileImage && profileImage.size > 0);
                        if (hasData) {
                          const result = profileImage && profileImage.size > 0
                            ? await myApi.updateProfile(updateData, formDataToSend)
                            : await myApi.updateProfile(updateData);
                          if (result.profile) {
                            setMember({
                              user_id:
                                result.profile.userId ||
                                result.profile.userName ||
                                result.profile.user_name ||
                                member?.user_id ||
                                "",
                              password: "",
                              email: result.profile.email || member?.email || "",
                              hope_job: result.profile.hopeJob || result.profile.hope_job || "",
                              created_at:
                                result.profile.createdAt ||
                                result.profile.created_at ||
                                member?.created_at ||
                                "",
                            });
                            alert("프로필이 성공적으로 업데이트되었습니다.");
                            setActiveSection(null);
                          }
                        } else {
                          alert("변경된 내용이 없습니다.");
                        }
                      } catch (error: unknown) {
                        const errorMessage =
                          error instanceof Error
                            ? error.message
                            : "프로필 업데이트에 실패했습니다";
                        alert(errorMessage);
                      }
                    }}
                  >
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">
                        닉네임
                      </label>
                      <input
                        type="text"
                        name="user_name"
                        defaultValue={member?.user_id || ""}
                        className="w-full bg-[#131515] border border-[#2B2C28] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#339989] transition"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">
                        이메일
                      </label>
                      <input
                        type="email"
                        defaultValue={member?.email || ""}
                        disabled
                        className="w-full bg-[#131515] border border-[#2B2C28] rounded-lg px-4 py-2 text-slate-500 cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">
                        프로필 사진
                      </label>
                      <input
                        type="file"
                        name="profileImage"
                        accept="image/*"
                        className="w-full bg-[#131515] border border-[#2B2C28] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#339989] transition file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#339989] file:text-white hover:file:bg-[#7DE2D1] cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">
                        희망 직무
                      </label>
                      <input
                        type="text"
                        name="hope_job"
                        defaultValue={member?.hope_job || ""}
                        className="w-full bg-[#131515] border border-[#2B2C28] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#339989] transition"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">
                        비밀번호 변경
                      </label>
                      <input
                        type="password"
                        name="password"
                        placeholder="새 비밀번호 (변경 시에만 입력)"
                        className="w-full bg-[#131515] border border-[#2B2C28] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#339989] transition"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setActiveSection(null)}
                        className="px-4 py-2 text-slate-400 hover:text-white transition"
                      >
                        취소
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2 bg-[#339989] text-white rounded-lg hover:bg-[#7DE2D1] transition font-medium"
                      >
                        저장하기
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* 스크랩 게시글 상세보기 모달 */}
      {showScrapPostModal && selectedScrapPost && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a18] border border-[#2B2C28] rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#2B2C28] flex items-center justify-between sticky top-0 bg-[#1a1a18] z-10">
              <h2 className="text-xl font-bold text-white">게시글 상세</h2>
              <div className="flex items-center gap-2">
                {currentUserId !== null &&
                  (selectedScrapPost.userIdx === currentUserId ||
                    selectedScrapPost.postUserId === currentUserId) && (
                    <>
                      <Button
                        onClick={() => editScrapPost(selectedScrapPost)}
                        className="px-3 py-1 text-sm bg-[#339989] text-white rounded hover:bg-[#7DE2D1] transition"
                      >
                        수정
                      </Button>
                      <Button
                        onClick={() => {
                          const boardId =
                            selectedScrapPost.boardId ||
                            selectedScrapPost.board_id;
                          deleteScrapPost(boardId);
                        }}
                        className="px-3 py-1 text-sm bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition"
                      >
                        삭제
                      </Button>
                    </>
                  )}
                <Button
                  onClick={() => {
                    const boardId =
                      selectedScrapPost.boardId || selectedScrapPost.board_id;
                    handleUnscrap(boardId);
                  }}
                  className="px-3 py-1 text-sm bg-slate-700 text-slate-300 rounded hover:bg-slate-600 transition"
                >
                  스크랩 취소
                </Button>
                <Button
                  onClick={() => {
                    setShowScrapPostModal(false);
                    setSelectedScrapPost(null);
                    setScrapPostComments([]);
                    setScrapCommentText("");
                  }}
                  className="p-2 hover:bg-[#2B2C28] rounded transition"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </Button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-white mb-4">
                    {selectedScrapPost.title ||
                      `게시글 #${
                        selectedScrapPost.boardId || selectedScrapPost.board_id
                      }`}
                  </h1>
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <span className="font-medium text-white">
                      {selectedScrapPost.postUserName ||
                        selectedScrapPost.userId ||
                        selectedScrapPost.user_id}
                    </span>
                    <span>•</span>
                    <span>
                      {new Date(
                        selectedScrapPost.created_at ||
                          selectedScrapPost.createdAt ||
                          ""
                      ).toLocaleString("ko-KR")}
                    </span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>{selectedScrapPost.views || 0} 조회</span>
                    </div>
                    {selectedScrapPost.isSolved && (
                      <>
                        <span>•</span>
                        <span className="px-2 py-1 bg-[#339989] text-white text-xs rounded">
                          해결됨
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* 파일 표시 */}
                {selectedScrapPost.files &&
                  selectedScrapPost.files.length > 0 && (
                    <div className="space-y-2">
                      {selectedScrapPost.files
                        .filter((f: any) => f.isMainImage)
                        .map((file: any) => (
                          <img
                            key={file.fileKey}
                            src={`${API_BASE_URL}${file.filePath}`}
                            alt={file.fileName}
                            className="w-full rounded-lg"
                          />
                        ))}
                    </div>
                  )}

                <div className="prose prose-invert max-w-none">
                  <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {selectedScrapPost.content || "내용이 없습니다."}
                  </p>
                </div>

                {/* 첨부 파일 목록 */}
                {selectedScrapPost.files &&
                  selectedScrapPost.files.length > 0 && (
                    <div className="border-t border-[#2B2C28] pt-4">
                      <h3 className="text-white font-medium mb-2">첨부 파일</h3>
                      <div className="space-y-2">
                        {selectedScrapPost.files.map((file: any) => (
                          <a
                            key={file.fileKey}
                            href={`${API_BASE_URL}${file.filePath}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-[#7DE2D1] hover:underline text-sm"
                          >
                            {file.fileName}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                <div className="flex items-center gap-6 pt-4 border-t border-[#2B2C28]">
                  <Button
                    onClick={() => {
                      const boardId =
                        selectedScrapPost.boardId || selectedScrapPost.board_id;
                      handleScrapPostLike(boardId);
                    }}
                    className={`flex items-center gap-2 transition ${
                      scrapPostLiked
                        ? "text-[#7DE2D1]"
                        : "text-slate-400 hover:text-[#7DE2D1]"
                    }`}
                  >
                    <Heart
                      className={`w-5 h-5 ${
                        scrapPostLiked ? "fill-current" : ""
                      }`}
                    />
                    <span className="text-sm">
                      좋아요 {selectedScrapPost.likeCount || 0}
                    </span>
                  </Button>
                </div>

                <div className="border-t border-[#2B2C28] pt-6">
                  <h3 className="text-white font-medium mb-4">
                    {selectedScrapPost.type === "question" ? "답변" : "댓글"}{" "}
                    {scrapPostComments.length}개
                  </h3>

                  {/* 댓글 작성 폼 */}
                  <div className="mb-6">
                    <textarea
                      value={scrapCommentText}
                      onChange={(e) => setScrapCommentText(e.target.value)}
                      placeholder="댓글을 입력하세요..."
                      rows={3}
                      className="w-full bg-[#131515] border border-[#2B2C28] rounded-lg px-4 py-2 text-white resize-none focus:outline-none focus:border-[#339989] transition mb-2"
                    />
                    <Button
                      onClick={() => {
                        const boardId =
                          selectedScrapPost.boardId ||
                          selectedScrapPost.board_id;
                        handleScrapCommentSubmit(boardId);
                      }}
                      disabled={!scrapCommentText.trim()}
                      className="px-4 py-2 bg-[#339989] text-white rounded-lg hover:bg-[#7DE2D1] transition disabled:opacity-50"
                    >
                      댓글 작성
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {scrapPostComments.map((comment: any) => (
                      <div key={comment.replyId} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#2B2C28]" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
                            <span className="text-white font-medium">
                              {typeof comment.userId === "number"
                                ? `User ${comment.userId}`
                                : comment.userId}
                            </span>
                            <span>•</span>
                            <span>
                              {new Date(comment.createdAt).toLocaleString(
                                "ko-KR"
                              )}
                            </span>
                            {comment.isSelected && (
                              <span className="px-2 py-0.5 bg-[#339989] text-white text-xs rounded">
                                채택됨
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-300">
                            {comment.reply || comment.content}
                          </p>
                        </div>
                      </div>
                    ))}
                    {scrapPostComments.length === 0 && (
                      <p className="text-slate-400 text-sm text-center py-4">
                        댓글이 없습니다.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 스크랩 게시글 수정 모달 */}
      {editingScrapPost && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a18] border border-[#2B2C28] rounded-lg w-full max-w-2xl">
            <div className="p-6 border-b border-[#2B2C28] flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">게시글 수정</h2>
              <Button
                onClick={() => {
                  setEditingScrapPost(null);
                }}
                className="p-2 hover:bg-[#2B2C28] rounded transition"
              >
                <X className="w-5 h-5 text-slate-400" />
              </Button>
            </div>

            <form onSubmit={saveScrapPost} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  제목
                </label>
                <input
                  type="text"
                  name="title"
                  defaultValue={editingScrapPost.title || ""}
                  required
                  className="w-full bg-[#131515] border border-[#2B2C28] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#339989] transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  내용
                </label>
                <textarea
                  name="content"
                  defaultValue={editingScrapPost.content || ""}
                  required
                  rows={6}
                  className="w-full bg-[#131515] border border-[#2B2C28] rounded-lg px-4 py-2 text-white resize-none focus:outline-none focus:border-[#339989] transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  메인 이미지 (선택)
                </label>
                <input
                  type="file"
                  name="mainImage"
                  accept="image/*"
                  className="w-full bg-[#131515] border border-[#2B2C28] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#339989] transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  첨부 파일 (선택, 여러 개 가능)
                </label>
                <input
                  type="file"
                  name="files"
                  multiple
                  className="w-full bg-[#131515] border border-[#2B2C28] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#339989] transition"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  onClick={() => {
                    setEditingScrapPost(null);
                  }}
                  className="px-4 py-2 text-slate-400 hover:text-white transition"
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  className="px-6 py-2 bg-[#339989] text-white rounded-lg hover:bg-[#7DE2D1] transition font-medium"
                >
                  수정하기
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 날짜별 일정 목록 모달 */}
      {showDateScheduleModal && selectedDate !== null && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a18] border border-[#2B2C28] rounded-lg w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-[#2B2C28] flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월{" "}
                {selectedDate}일 일정
              </h2>
              <button
                onClick={() => {
                  setShowDateScheduleModal(false);
                  setSelectedDate(null);
                }}
                className="p-2 hover:bg-[#2B2C28] rounded transition"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {(() => {
                const daySchedules = getSchedulesForDay(selectedDate);
                return (
                  <>
                    {daySchedules.length === 0 ? (
                      <div className="text-center py-8">
                        <Calendar className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                        <p className="text-slate-400">
                          이 날짜에 등록된 일정이 없습니다.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {daySchedules.map((schedule) => (
                          <div
                            key={schedule.scheduleId}
                            className="bg-[#131515] border border-[#2B2C28] rounded-lg p-4 hover:border-[#339989] transition"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Calendar className="w-4 h-4 text-[#7DE2D1]" />
                                  <span className="text-xs text-slate-400">
                                    {schedule.scheduleDate}
                                  </span>
                                </div>
                                <h3 className="text-white font-medium">
                                  {schedule.title}
                                </h3>
                                {schedule.description && (
                                  <p className="text-sm text-slate-400 mt-1">
                                    {schedule.description}
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-1 ml-2">
                                <button
                                  onClick={() => {
                                    setEditingSchedule(schedule);
                                    setShowDateScheduleModal(false);
                                    setShowScheduleModal(true);
                                  }}
                                  className="p-1 hover:bg-[#2B2C28] rounded"
                                >
                                  <Edit className="w-4 h-4 text-slate-400 hover:text-[#7DE2D1]" />
                                </button>
                                <button
                                  onClick={() =>
                                    deleteSchedule(schedule.scheduleId)
                                  }
                                  className="p-1 hover:bg-[#2B2C28] rounded"
                                >
                                  <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-500" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            <div className="p-6 border-t border-[#2B2C28]">
              <button
                onClick={() => {
                  setEditingSchedule(null);
                  setShowDateScheduleModal(false);
                  setShowScheduleModal(true);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#339989] text-white rounded-lg hover:bg-[#7DE2D1] transition font-medium"
              >
                <Plus className="w-5 h-5" />
                일정 추가하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 일정 추가/수정 모달 */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a18] border border-[#2B2C28] rounded-lg w-full max-w-md">
            <div className="p-6 border-b border-[#2B2C28] flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {editingSchedule ? "일정 수정" : "일정 추가"}
              </h2>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="p-2 hover:bg-[#2B2C28] rounded transition"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={saveSchedule} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  날짜 (일)
                </label>
                <input
                  type="number"
                  name="date"
                  min="1"
                  max={daysInMonth}
                  defaultValue={
                    editingSchedule
                      ? new Date(editingSchedule.scheduleDate).getDate()
                      : selectedDate || ""
                  }
                  required
                  className="w-full bg-[#131515] border border-[#2B2C28] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#339989] transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  제목
                </label>
                <input
                  type="text"
                  name="title"
                  defaultValue={editingSchedule?.title || ""}
                  required
                  className="w-full bg-[#131515] border border-[#2B2C28] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#339989] transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  설명
                </label>
                <input
                  type="text"
                  name="description"
                  defaultValue={editingSchedule?.description || ""}
                  className="w-full bg-[#131515] border border-[#2B2C28] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#339989] transition"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white transition"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#339989] text-white rounded-lg hover:bg-[#7DE2D1] transition font-medium"
                >
                  {editingSchedule ? "수정하기" : "추가하기"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
