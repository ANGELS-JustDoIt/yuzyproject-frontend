# Frontend Service

Next.js 16 기반의 React 웹 애플리케이션입니다. TypeScript로 작성되었으며, 코드 분석 및 시각화, 게시글 관리, 사용자 인증 등의 기능을 제공합니다.

## 📋 목차

- [주요 기능](#주요-기능)
- [기술 스택](#기술-스택)
- [환경 요구사항](#환경-요구사항)
- [설치 및 설정](#설치-및-설정)
- [실행 방법](#실행-방법)
- [프로젝트 구조](#프로젝트-구조)
- [주요 페이지](#주요-페이지)
- [환경 변수](#환경-변수)

## 🚀 주요 기능

- **사용자 인증**: 로그인, 회원가입, JWT 토큰 기반 인증
- **코드 분석**: 프로젝트 코드를 업로드하여 분석
- **코드 시각화**: 분석된 코드를 시각적으로 표현
- **화면 캡처**: Windows 화면 캡처 및 OCR 기능
- **게시글 관리**: 게시글 작성, 조회, 수정, 삭제
- **대시보드**: 사용자 활동 및 통계 대시보드
- **프로필 관리**: 사용자 프로필 조회 및 수정

## 🛠 기술 스택

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI
- **Form Handling**: React Hook Form + Zod
- **Charts**: Recharts
- **Icons**: Lucide React
- **State Management**: React Hooks (Context API)
- **HTTP Client**: Fetch API

## 📦 환경 요구사항

- **Node.js**: v18 이상 권장
- **npm**, **yarn**, **pnpm**, 또는 **bun**

## 🔧 설치 및 설정

### 1. 의존성 설치

```bash
cd yuzyproject-frontend
npm install
```

### 2. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 변수를 설정합니다:

```env
# 백엔드 API URL
NEXT_PUBLIC_API_URL=http://localhost:9090

# AI 모델 서비스 URL (선택사항)
NEXT_PUBLIC_AI_API_URL=http://localhost:8000
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000`으로 접속하여 애플리케이션을 확인할 수 있습니다.

## ▶️ 실행 방법

### 개발 모드

```bash
npm run dev
```

개발 서버가 실행되며, 파일 변경 시 자동으로 새로고침됩니다.

### 프로덕션 빌드

```bash
npm run build
npm start
```

### 린트 실행

```bash
npm run lint
```

## 📁 프로젝트 구조

```
yuzyproject-frontend/
├── app/                    # Next.js App Router 페이지
│   ├── layout.tsx         # 루트 레이아웃
│   ├── page.tsx           # 홈 페이지
│   ├── globals.css        # 전역 스타일
│   ├── login/             # 로그인 페이지
│   ├── signup/            # 회원가입 페이지
│   ├── dashboard/         # 대시보드 페이지
│   ├── posts/             # 게시글 목록/상세 페이지
│   ├── my/                # 프로필 페이지
│   ├── code/              # 코드 입력 페이지
│   ├── capture/           # 화면 캡처 페이지
│   ├── visualize/         # 코드 시각화 페이지
│   └── visualize-sample/  # 샘플 시각화 페이지
├── components/            # 재사용 가능한 컴포넌트
│   ├── Header.tsx         # 헤더 컴포넌트
│   └── ui/                # UI 컴포넌트 (Radix UI 기반)
├── lib/                   # 유틸리티 및 헬퍼 함수
│   ├── api.ts             # API 호출 함수
│   ├── useAuth.ts         # 인증 관련 훅
│   └── utils.ts           # 유틸리티 함수
├── public/                # 정적 파일
├── components.json         # shadcn/ui 설정
├── tsconfig.json          # TypeScript 설정
├── next.config.ts         # Next.js 설정
├── tailwind.config.js     # Tailwind CSS 설정
└── package.json           # 프로젝트 의존성
```

## 📄 주요 페이지

### 인증 페이지

- **`/login`**: 사용자 로그인
- **`/signup`**: 회원가입

### 메인 페이지

- **`/`**: 홈 페이지
- **`/dashboard`**: 사용자 대시보드 (통계 및 활동)

### 게시글 페이지

- **`/posts`**: 게시글 목록
- **`/posts/[id]`**: 게시글 상세 (동적 라우팅)

### 코드 분석 페이지

- **`/code`**: 코드 입력 및 업로드
- **`/visualize`**: 코드 시각화 결과 표시
- **`/visualize-sample`**: 샘플 시각화 예제
- **`/capture`**: 화면 캡처 및 OCR

### 사용자 페이지

- **`/my`**: 사용자 프로필 조회 및 수정

## 🔑 인증 시스템

### 토큰 관리

- **저장**: `localStorage`에 JWT 토큰 저장
- **전송**: API 요청 시 `Authorization` 헤더에 포함
- **형식**: `Bearer {token}`

### 인증 훅

`lib/useAuth.ts`에서 인증 상태 관리:

```typescript
const { user, login, logout, isAuthenticated } = useAuth();
```

### 보호된 라우트

인증이 필요한 페이지는 `useAuth` 훅을 사용하여 인증 상태를 확인합니다.

## 🌐 API 통신

### API 클라이언트

`lib/api.ts`에서 백엔드 API와 통신하는 함수들을 제공합니다:

- **인증 API**: `login()`, `signup()`, `logout()`
- **게시글 API**: `getPosts()`, `createPost()`, `updatePost()`, `deletePost()`
- **사용자 API**: `getProfile()`, `updateProfile()`
- **AI API**: `analyzeCode()`, `visualizeCode()`, `captureScreen()`

### 에러 처리

API 호출 실패 시 적절한 에러 메시지를 표시합니다.

## 🎨 UI 컴포넌트

### Radix UI 기반 컴포넌트

shadcn/ui 스타일의 컴포넌트를 사용합니다:

- Button, Input, Dialog, Dropdown 등
- `components/ui/` 디렉토리에 위치

### 스타일링

- **Tailwind CSS**: 유틸리티 퍼스트 CSS 프레임워크
- **CSS Variables**: 다크 모드 지원을 위한 CSS 변수
- **반응형 디자인**: 모바일, 태블릿, 데스크톱 지원

## 📊 코드 시각화

### 시각화 기능

- API 엔드포인트를 그래프 형태로 시각화
- Recharts를 사용한 차트 표현
- 인터랙티브한 UI 제공

### 데이터 형식

AI 모델 서비스에서 받은 JSON 데이터를 파싱하여 시각화합니다.

## 📤 파일 업로드

### 지원 기능

- **코드 파일 업로드**: 텍스트 파일 업로드
- **이미지 업로드**: 게시글 이미지 업로드
- **FormData**: multipart/form-data 형식으로 전송

## 🔧 환경 변수

### 필수 변수

- `NEXT_PUBLIC_API_URL`: 백엔드 서버 URL

### 선택 변수

- `NEXT_PUBLIC_AI_API_URL`: AI 모델 서비스 URL

**참고**: Next.js에서 클라이언트 측에서 사용할 환경 변수는 `NEXT_PUBLIC_` 접두사가 필요합니다.

## 🚀 배포

### Vercel 배포 (권장)

1. GitHub 저장소에 코드 푸시
2. Vercel에 프로젝트 연결
3. 환경 변수 설정
4. 자동 배포

### 수동 빌드

```bash
npm run build
npm start
```

## 🐛 문제 해결

### API 연결 실패
- 백엔드 서버가 실행 중인지 확인
- `NEXT_PUBLIC_API_URL` 환경 변수 확인
- CORS 설정 확인

### 빌드 오류
- Node.js 버전 확인 (v18 이상)
- 의존성 재설치: `rm -rf node_modules && npm install`
- TypeScript 타입 오류 확인

### 스타일이 적용되지 않음
- Tailwind CSS 설정 확인
- `globals.css` 임포트 확인
- 브라우저 캐시 클리어

## 📝 주요 의존성

### Core
- `next`: Next.js 프레임워크
- `react`, `react-dom`: React 라이브러리
- `typescript`: TypeScript 컴파일러

### UI
- `@radix-ui/*`: Radix UI 컴포넌트
- `tailwindcss`: Tailwind CSS
- `lucide-react`: 아이콘 라이브러리

### Forms & Validation
- `react-hook-form`: 폼 관리
- `zod`: 스키마 검증
- `@hookform/resolvers`: React Hook Form 통합

### Charts
- `recharts`: 차트 라이브러리

### Utilities
- `clsx`: 클래스명 유틸리티
- `date-fns`: 날짜 처리

## 📚 추가 리소스

- [Next.js 문서](https://nextjs.org/docs)
- [React 문서](https://react.dev)
- [Tailwind CSS 문서](https://tailwindcss.com/docs)
- [Radix UI 문서](https://www.radix-ui.com)

## 📝 라이선스

ISC
