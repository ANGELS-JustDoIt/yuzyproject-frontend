"use client";
import { useState, useEffect } from "react";
import type React from "react";

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
} from "lucide-react";
import Header from "@/components/Header";

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
  scrab_id: number;
  board_id: number;
  user_id: string;
  created_at: string;
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
  const [member, setMember] = useState<Member | null>(null);
  const [grassData, setGrassData] = useState<Grass[]>([]);
  const [archives] = useState<StudyArchive[]>(mockArchives);
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

  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        const { myApi } = await import("@/lib/api");

        // 프로필 및 통계 조회
        const profileData = await myApi.getProfile();
        if (profileData.profile) {
          setMember({
            user_id:
              profileData.profile.userId || profileData.profile.userName || "",
            password: "",
            email: profileData.profile.email || "",
            hope_job: profileData.profile.hopeJob || "",
            created_at: profileData.profile.createdAt || "",
          });
        }
        if (profileData.stats) {
          setStats(profileData.stats);
        }

        // 잔디 데이터 조회
        const grassData = await myApi.getGrass();
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

        // 스크랩 조회
        const scrapsData = await myApi.getScraps();
        if (scrapsData.scraps) {
          setScraps(
            scrapsData.scraps.map((s: Record<string, unknown>) => ({
              scrab_id: Number(s.scrapId || s.scrab_id || s.scrabId || 0),
              board_id: Number(s.boardId || s.board_id || 0),
              user_id: String(
                s.userId || s.user_id || s.userName || s.user_name || ""
              ),
              created_at: String(s.createdAt || s.created_at || ""),
            }))
          );
        }

        // 알림 조회
        const notificationsData = await myApi.getNotifications();
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

        // 일정 조회 (현재 월 기준)
        const loadSchedules = async () => {
          const year = currentMonth.getFullYear();
          const month = currentMonth.getMonth() + 1;
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
                    const month = String(dateObj.getMonth() + 1).padStart(
                      2,
                      "0"
                    );
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
        };
        await loadSchedules();
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
                    <span className="px-3 py-1 bg-[#339989]/20 text-[#7DE2D1] text-xs font-medium rounded-full">
                      실력 78%
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm mb-4">
                    1년차 · {member?.hope_job || ""}
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
                    공부내용 아카이브
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

            {/* 공부내용 아카이브 */}
            {activeSection === "archive" && (
              <div className="bg-[#1a1a18] border border-[#2B2C28] rounded-lg p-6 mb-8">
                <h2 className="text-xl font-bold text-white mb-4">
                  공부내용 아카이브
                </h2>
                <div className="space-y-3">
                  {archives.map((archive) => (
                    <div
                      key={archive.archive_id}
                      className="bg-[#131515] border border-[#2B2C28] rounded-lg p-4 hover:border-[#339989] transition"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-white font-medium">
                          {archive.analysis_text}
                        </h3>
                        <span className="text-xs text-slate-500">
                          {new Date(archive.created_at).toLocaleDateString(
                            "ko-KR"
                          )}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 mb-3">
                        {archive.raw_response}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 스크랩 모음 */}
            {activeSection === "scraps" && (
              <div className="bg-[#1a1a18] border border-[#2B2C28] rounded-lg p-6 mb-8">
                <h2 className="text-xl font-bold text-white mb-4">
                  스크랩 모음
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {scraps.map((scrap) => (
                    <div
                      key={scrap.scrab_id}
                      className="bg-[#131515] border border-[#2B2C28] rounded-lg p-4 hover:border-[#339989] transition cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <Bookmark className="w-5 h-5 text-[#7DE2D1] flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-medium mb-1 hover:text-[#7DE2D1]">
                            게시글 #{scrap.board_id}
                          </h3>
                          <p className="text-xs text-slate-500">
                            {new Date(scrap.created_at).toLocaleDateString(
                              "ko-KR"
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
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
                          email?: string;
                          hope_job?: string;
                          password?: string;
                        } = {};
                        const email = formData.get("email") as string;
                        const hope_job = formData.get("hope_job") as string;
                        const password = formData.get("password") as string;

                        if (email && email !== member?.email)
                          updateData.email = email;
                        if (hope_job && hope_job !== member?.hope_job)
                          updateData.hope_job = hope_job;
                        if (password && password.trim())
                          updateData.password = password;

                        if (Object.keys(updateData).length > 0) {
                          const result = await myApi.updateProfile(updateData);
                          if (result.profile) {
                            setMember({
                              user_id:
                                result.profile.userId ||
                                result.profile.userName ||
                                member?.user_id ||
                                "",
                              password: "",
                              email: result.profile.email || "",
                              hope_job: result.profile.hopeJob || "",
                              created_at:
                                result.profile.createdAt ||
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
                        사용자 ID
                      </label>
                      <input
                        type="text"
                        defaultValue={member?.user_id || ""}
                        disabled
                        className="w-full bg-[#131515] border border-[#2B2C28] rounded-lg px-4 py-2 text-slate-500 cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">
                        이메일
                      </label>
                      <input
                        type="email"
                        name="email"
                        defaultValue={member?.email || ""}
                        className="w-full bg-[#131515] border border-[#2B2C28] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#339989] transition"
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
