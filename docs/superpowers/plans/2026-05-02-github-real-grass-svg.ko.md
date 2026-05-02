# GitHub Real Grass SVG 구현 계획

> **Agentic worker용:** 필수 하위 skill: 이 계획을 task 단위로 구현할 때는 superpowers:subagent-driven-development 권장, 또는 superpowers:executing-plans 사용. 진행 추적은 checkbox (`- [ ]`) 문법을 사용한다.

**목표:** README에서 바로 사용할 수 있는 흙/잔디 스타일 GitHub contribution SVG를 반환하는 Vercel 배포용 Next.js 엔드포인트를 만든다.

**아키텍처:** API route가 username을 검증하고, GitHub GraphQL로 contribution calendar를 가져오고, level을 정규화한 뒤 SVG를 반환한다. 렌더링은 HTTP와 network 코드에서 분리한 순수 함수로 유지해서 GitHub 접근 없이 테스트 가능하게 한다.

**기술 스택:** Next.js App Router, TypeScript, Vitest, GitHub GraphQL API, Vercel serverless deployment.

---

## 파일 구조

- `package.json`: project script와 dependency.
- `tsconfig.json`: TypeScript 설정.
- `next.config.mjs`: 최소 Next.js 설정.
- `vitest.config.ts`: unit test 설정.
- `app/api/grass/route.ts`: 공개 SVG 이미지 엔드포인트.
- `src/github/contributions.ts`: GitHub GraphQL client와 data type.
- `src/render/escape.ts`: SVG text escaping.
- `src/render/levels.ts`: contribution count를 grass density로 변환.
- `src/render/svg.ts`: 순수 SVG renderer.
- `src/validation/username.ts`: GitHub username validation.
- `src/api/error-svg.ts`: compact SVG error response renderer.
- `src/test/*.test.ts`: 집중된 unit test.
- `README.md`: 사용법, Vercel 배포, 환경변수 설정.
- `README.ko.md`: 한글 README.

## Task 1: 프로젝트 Scaffold

**파일:**
- 생성: `package.json`
- 생성: `tsconfig.json`
- 생성: `next.config.mjs`
- 생성: `vitest.config.ts`
- 생성: `app/layout.tsx`
- 생성: `app/page.tsx`

- [ ] **Step 1: package와 config 파일 생성**

Next.js TypeScript 프로젝트를 최소 구성으로 만든다. script는 `dev`, `build`, `test`, `typecheck`를 포함한다.

- [ ] **Step 2: 작은 homepage 추가**

README image URL 형식과 `/api/grass?username=octocat` 링크를 보여주는 단순 page를 만든다.

- [ ] **Step 3: dependency 설치**

실행: `npm install`

기대 결과: dependency가 설치되고 `package-lock.json`이 생성된다.

## Task 2: 핵심 순수 Utility

**파일:**
- 생성: `src/validation/username.ts`
- 생성: `src/render/escape.ts`
- 생성: `src/render/levels.ts`
- 생성: `src/test/username.test.ts`
- 생성: `src/test/escape.test.ts`
- 생성: `src/test/levels.test.ts`

- [ ] **Step 1: validation test 작성**

`octocat`, `real-grass`, 일반적인 39자 이하 이름은 허용하고, 빈 값, underscore, 앞 hyphen, 뒤 hyphen, 연속 hyphen, 39자 초과는 거부한다.

- [ ] **Step 2: username validation 구현**

`validateGithubUsername(value: string | null): { ok: true; username: string } | { ok: false; message: string }`를 제공한다.

- [ ] **Step 3: escaping test 작성**

`<`, `>`, `&`, `"`, `'`가 SVG text/attribute에서 escape되는지 확인한다.

- [ ] **Step 4: SVG escaping 구현**

`escapeSvgText(value: string): string`를 제공한다.

- [ ] **Step 5: level mapping test 작성**

zero count, percentile mapping, non-zero day가 4일 미만일 때 fallback threshold를 검증한다.

- [ ] **Step 6: level mapping 구현**

`countToLevels(counts: number[]): number[]`를 제공하고 `0`부터 `4`까지의 level을 반환한다.

- [ ] **Step 7: test 실행**

실행: `npm test`

기대 결과: utility test가 모두 통과한다.

## Task 3: SVG Renderer

**파일:**
- 생성: `src/render/svg.ts`
- 생성: `src/test/svg.test.ts`

- [ ] **Step 1: renderer test 작성**

출력이 `<svg`로 시작하는지, title, month label, legend를 포함하는지, 위험한 username이 escape 없이 들어가지 않는지 확인한다.

- [ ] **Step 2: renderer 구현**

`renderGrassSvg(input: GrassSvgInput): string`를 제공한다. input은 `username`, `weeks`, optional `generatedAt`을 포함한다.

Renderer는 다음을 그린다.

- 반환된 모든 날짜의 soil base tile.
- depth를 주는 어두운 lower edge.
- level이 높을수록 커지는 grass overlay.
- 각 월의 첫 날짜 기준 month label.
- compact legend.

- [ ] **Step 3: renderer test 실행**

실행: `npm test -- src/test/svg.test.ts`

기대 결과: renderer test가 통과한다.

## Task 4: GitHub GraphQL Client

**파일:**
- 생성: `src/github/contributions.ts`
- 생성: `src/test/contributions.test.ts`

- [ ] **Step 1: mocked fetch 기반 client test 작성**

request body, token header, 성공 normalization, user-not-found error, GraphQL error handling을 검증한다.

- [ ] **Step 2: client 구현**

`fetchContributionCalendar(username: string, token: string, fetchImpl = fetch): Promise<ContributionCalendar>`를 제공한다.

- [ ] **Step 3: client test 실행**

실행: `npm test -- src/test/contributions.test.ts`

기대 결과: client test가 통과한다.

## Task 5: API Route와 Error SVG

**파일:**
- 생성: `src/api/error-svg.ts`
- 생성: `app/api/grass/route.ts`
- 생성: `src/test/error-svg.test.ts`

- [ ] **Step 1: error SVG test 작성**

error output이 valid SVG이고 message를 escape하는지 검증한다.

- [ ] **Step 2: error SVG helper 구현**

`renderErrorSvg(title: string, message: string): string`를 제공한다.

- [ ] **Step 3: API route 구현**

Route는 다음을 수행한다.

- `username` 검증.
- invalid username이면 `400 image/svg+xml`.
- `GITHUB_TOKEN`이 없으면 `500 image/svg+xml`.
- contribution data를 가져와 SVG 렌더링.
- GitHub user를 찾을 수 없으면 `404 image/svg+xml`.
- 그 외 실패는 `500 image/svg+xml`.
- `Cache-Control: public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400` 설정.

- [ ] **Step 4: typecheck와 test 실행**

실행: `npm run typecheck`

실행: `npm test`

기대 결과: 둘 다 통과한다.

## Task 6: README 문서

**파일:**
- 생성: `README.md`
- 생성: `README.ko.md`

- [ ] **Step 1: 영어 README 작성**

README embed 예시, local setup, Vercel deployment, `GITHUB_TOKEN` 설정, API parameter, limitation을 포함한다.

- [ ] **Step 2: 한글 README 작성**

같은 내용을 읽기 쉽게 번역한다.

- [ ] **Step 3: 최종 검증**

실행: `npm run typecheck`

실행: `npm test`

실행: `npm run build`

기대 결과: typecheck, test, build가 모두 통과한다.
