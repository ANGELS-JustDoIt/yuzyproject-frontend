# v0.dev 통합 가이드

## 개요

이 문서는 v0.dev에서 생성한 컴포넌트를 유지프로젝트에 통합하는 방법을 설명합니다.

## v0.dev 사용 방법

### 1. v0.dev 접속

1. https://v0.dev 접속
2. 계정 로그인 (GitHub 계정 권장)

### 2. 컴포넌트 생성

v0.dev에서 프롬프트 입력 시 다음 정보를 포함하세요:

```
프로젝트 컨텍스트:
- Next.js 16 App Router
- shadcn/ui (new-york 스타일)
- TypeScript
- 다크 테마 (#131515 배경)
- Primary: #339989, Accent: #7DE2D1
- lucide-react 아이콘 사용

[원하는 컴포넌트 설명]
```

### 3. 생성된 코드 통합

#### 방법 A: 직접 복사

1. v0.dev에서 생성된 코드 복사
2. 프로젝트의 적절한 위치에 파일 생성
3. import 경로 확인 및 수정

#### 방법 B: 컴포넌트로 분리

1. 재사용 가능한 컴포넌트는 `components/` 폴더에 저장
2. 페이지 전용 컴포넌트는 `app/[page]/` 폴더에 저장

## 통합 체크리스트

### ✅ 스타일 확인

- [ ] 배경색이 #131515인가?
- [ ] Primary 색상이 #339989인가?
- [ ] 카드/입력 필드가 #1a1a18 또는 #2b2c28인가?
- [ ] 텍스트 색상이 적절한가? (white, slate-400 등)

### ✅ 의존성 확인

- [ ] 필요한 shadcn/ui 컴포넌트가 설치되어 있는가?
- [ ] lucide-react 아이콘이 올바르게 import 되었는가?
- [ ] Next.js Link 컴포넌트 사용 시 `next/link`에서 import 했는가?

### ✅ 기능 확인

- [ ] 인터랙티브 컴포넌트에 `"use client"` 지시어가 있는가?
- [ ] API 호출이 필요한 경우 `@/lib/api`를 사용하는가?
- [ ] 폼 제출 시 `name` 속성이 모든 input에 있는가?

### ✅ 타입 확인

- [ ] TypeScript 타입이 올바르게 정의되어 있는가?
- [ ] interface/type이 적절히 사용되었는가?

## 일반적인 문제 해결

### 문제 1: 스타일이 맞지 않음

**해결**: `.v0-context.md` 파일의 색상 팔레트를 참고하여 수동으로 수정

### 문제 2: 컴포넌트를 찾을 수 없음

**해결**:

```bash
npx shadcn@latest add [component-name]
```

### 문제 3: API 호출이 작동하지 않음

**해결**:

- `lib/api.ts`의 API 함수 확인
- 토큰이 올바르게 설정되었는지 확인
- CORS 설정 확인

### 문제 4: 폼 제출이 작동하지 않음

**해결**:

- 모든 input 필드에 `name` 속성 확인
- `onSubmit` 핸들러에서 `e.preventDefault()` 확인
- FormData에서 값이 올바르게 추출되는지 확인

## 예시: 회원정보 수정 폼 통합

### v0.dev에서 생성한 코드

```tsx
// v0.dev에서 생성된 코드를 받았을 때
```

### 프로젝트에 통합

1. `app/my/page.tsx`의 기존 폼과 비교
2. 스타일 일관성 확인
3. API 호출 로직 확인 (`myApi.updateProfile`)
4. 모든 input에 `name` 속성 확인

## v0.dev 프롬프트 템플릿

### 기본 템플릿

```
다크 테마의 [컴포넌트 이름]을 만들어주세요.

요구사항:
- Next.js 16 App Router
- TypeScript
- shadcn/ui 컴포넌트 사용
- 배경: #131515
- Primary: #339989
- Accent: #7DE2D1
- lucide-react 아이콘

[상세 설명]
```

### API 통합이 필요한 경우

```
[컴포넌트 설명]

API 통합:
- @/lib/api에서 myApi 사용
- 비동기 처리 필요
- 에러 핸들링 포함
- 로딩 상태 표시
```

## 추가 리소스

- [v0.dev 공식 문서](https://v0.dev/docs)
- [shadcn/ui 문서](https://ui.shadcn.com)
- [Next.js 문서](https://nextjs.org/docs)
- 프로젝트 내 `.v0-context.md` 파일 참고

## 현재 프로젝트 상태

### 최근 수정 사항

- ✅ 마이페이지 회원정보 수정 기능 수정 완료
  - 비밀번호 필드 `name` 속성 추가
  - 빈 값 처리 개선
  - 사용자 피드백 개선

### 다음 단계

v0.dev에서 새로운 컴포넌트를 생성할 때는 위의 가이드를 참고하여 일관성 있게 통합하세요.









