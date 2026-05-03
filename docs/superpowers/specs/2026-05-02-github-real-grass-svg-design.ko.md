# GitHub Real Grass SVG 설계

## 목표

README에서 바로 사용할 수 있는 GitHub 기여 그래프 렌더러를 만든다. 사용자는 GitHub 사용자명만 포함한 Markdown 이미지 URL 하나를 README에 넣으면 커스텀 SVG 기여 그래프를 볼 수 있어야 한다.

```md
![GitHub grass](https://your-app.vercel.app/api/grass?username=USERNAME)
```

1차 버전은 GitHub README에서 잘 동작하는 가벼운 동적 SVG를 우선한다. SVG 표현이 시각적으로 아쉽다면 나중에 더 사실적인 PNG 렌더링을 추가할 수 있다.

## 제품 범위

앱은 공개 이미지 엔드포인트 하나를 제공한다.

```txt
GET /api/grass?username=USERNAME
```

이 엔드포인트는 대상 사용자의 GitHub contribution calendar를 가져온 뒤 `image/svg+xml` 응답을 반환한다. 기여가 없는 날은 갈색 흙으로 렌더링한다. 기여가 많은 날일수록 더 촘촘한 초록 잔디가 보이도록 한다. 시각 스타일은 하나로 이어진 Minecraft 느낌의 pixel field처럼 느껴져야 한다. 일반 GitHub heatmap보다 자연스럽고 귀여우면서도 README 크기에서 읽기 쉬워야 한다.

1차 버전에서 제외할 항목:

- PNG 렌더링.
- 사용자 계정.
- 영구 데이터베이스 저장.
- 테마 편집 UI.
- 여러 그래프 레이아웃.
- GitHub Action 기반 생성.

## 아키텍처

Vercel에 배포할 수 있는 최소 Next.js 프로젝트를 사용한다.

주요 단위:

- `app/api/grass/route.ts`: HTTP 엔드포인트. query param 검증, GitHub 데이터 조회, SVG 렌더링, 이미지 응답 헤더 설정을 담당한다.
- `src/github/contributions.ts`: contribution calendar 데이터를 가져오는 GitHub GraphQL 클라이언트.
- `src/render/svg.ts`: 순수 SVG 렌더러. 정규화된 contribution weeks와 렌더링 옵션을 받아 SVG 문자열을 반환한다.
- `src/render/levels.ts`: raw contribution count를 시각 밀도 level로 변환한다.
- `src/render/escape.ts`: SVG에 들어가는 텍스트 값을 escape한다.

렌더러는 네트워크 없이 테스트 가능한 순수 함수여야 한다. GitHub 조회와 HTTP 응답 처리는 렌더링 코드 밖에 둔다.

## 데이터 흐름

1. `/api/grass?username=USERNAME`으로 요청이 들어온다.
2. API가 `username`을 검증한다.
3. API가 환경변수 `GITHUB_TOKEN`을 읽는다.
4. API가 GitHub GraphQL `user(login:) { contributionsCollection { contributionCalendar { weeks { contributionDays { date contributionCount weekday }}}}}`를 호출한다.
5. raw day 데이터를 안정적인 weeks/days 구조로 정규화한다.
6. 각 contribution count를 밀도 level로 변환한다.
   - `0`: 맨 흙.
   - `1`: 드문드문 난 잔디.
   - `2`: 적은 잔디.
   - `3`: 중간 정도의 잔디.
   - `4`: 가득 찬 잔디.
7. SVG 렌더러가 README용 고정 크기 이미지를 만든다.
8. API가 cache header와 함께 SVG를 반환한다.

## 시각 디자인

각 날짜는 작은 top-down pixel tile로 표현한다. 전체 grid는 떨어진 cube 모음이 아니라 하나로 이어진 Minecraft 느낌의 잔디밭처럼 보여야 한다.

- tile gap은 최소화해서 날짜별 구분은 가능하되, 인접한 날짜들이 시각적으로 붙어 보이게 한다.
- contribution `0`인 날은 은은한 pixel variation이 있는 갈색 흙 tile로 표현한다.
- contribution `1-4`인 날은 deterministic한 초록 pixel patch가 있는 잔디 tile로 표현한다.
- contribution level이 높을수록 초록 coverage, contrast, patch density가 증가한다.
- level `3`은 이전의 full-grass level처럼 충분히 촘촘하게 보이게 한다.
- level `3`과 level `4`는 같은 진한 full-grass 색상 palette를 사용한다.
- level `4`는 level `3` 위에 Minecraft 느낌과 어울리는 작은 pixel flower 한 송이와 더 작은 1-pixel flower accent 한 송이를 추가해 구분한다. 단, tile이 번잡해 보이지 않아야 한다.
- level `1`, `2`, `3`은 grass coverage와 contrast 차이가 분명해야 하며, level `3`은 level `2`보다 확실히 더 진하고 촘촘해야 한다.
- level `2`는 연한 잔디 느낌보다 조금 더 진하게 보이되, level `3`보다는 명확히 밝게 유지한다.
- README의 365일 scale에서는 tall grass blade나 분리된 isometric cube face가 지저분해지므로 사용하지 않는다.
- field texture는 단순 SVG rectangle만 사용하고 외부 이미지는 사용하지 않는다.

시각 표현은 절제한다.

- 큰 장식 배경은 넣지 않는다.
- animation은 넣지 않는다.
- 무거운 gradient는 쓰지 않는다.
- custom font에 의존하지 않는다.
- README embed에서 읽기 어려운 텍스트는 넣지 않는다.

1차 버전에는 `USERNAME's GitHub grass` 같은 compact title, month label, 흙부터 꽃이 있는 가득 찬 잔디까지의 작은 legend를 포함한다.
Title/header 영역에는 넉넉한 세로 여백을 유지해서 title이 month label이나 첫 번째 tile row와 명확히 분리되어 보이게 한다.
month label은 title보다 첫 번째 tile row에 더 가깝게 배치해서 graph에 붙어 있는 label처럼 보이게 한다.

## Contribution Level 매핑

GitHub가 반환한 calendar 데이터를 사용하되, 선택된 사용자의 contribution 범위에 맞게 local level을 계산한다.

매핑:

- `0`: count가 정확히 0.
- `1`: count가 0보다 크고 non-zero count의 25 percentile 이하.
- `2`: 25 percentile 초과, 50 percentile 이하.
- `3`: 50 percentile 초과, 75 percentile 이하.
- `4`: 75 percentile 초과.

non-zero contribution day가 너무 적으면 단순 threshold를 사용한다.

- `1`: contribution 1개.
- `2`: contribution 2-3개.
- `3`: contribution 4-6개.
- `4`: contribution 7개 이상.

"너무 적다"는 반환된 calendar 안에서 non-zero contribution day가 4일 미만인 경우를 의미한다.

## API 동작

필수 query param:

- `username`: GitHub 사용자명.

검증:

- GitHub 사용자명에 맞는 문자만 허용한다. 영문자, 숫자, hyphen.
- 사용자명은 영문자 또는 숫자로 시작하고 끝나야 한다.
- 연속 hyphen은 거부한다.
- 길이는 39자 이하로 제한한다.
- 빈 값은 거부한다.

응답:

- `200 image/svg+xml`: 성공적으로 렌더링된 그래프.
- `200 image/svg+xml`: 잘못된 username을 나타내는 작은 error SVG. `X-GitHub-Real-Grass-Status: 400` header를 함께 보낸다.
- `200 image/svg+xml`: GitHub 사용자를 찾을 수 없음을 나타내는 작은 error SVG. `X-GitHub-Real-Grass-Status: 404` header를 함께 보낸다.
- `200 image/svg+xml`: token, 설정, network 실패를 나타내는 작은 error SVG. `X-GitHub-Real-Grass-Status: 500` header를 함께 보낸다.

이미지 요청에는 JSON을 반환하지 않는다. README embed에서는 실패 상황에서도 눈에 보이는 실패 이미지가 나와야 하기 때문이다.
Error SVG 응답은 HTTP `200`을 사용한다. README image proxy가 non-2xx 이미지를 깨진 이미지로 처리하지 않고 diagnostic SVG를 보여주게 하기 위함이다.

## 캐싱

CDN 친화적인 header를 사용한다.

```txt
Cache-Control: public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400
Content-Type: image/svg+xml; charset=utf-8
```

README 용도에서는 1시간 freshness면 충분하고, GitHub API 사용량도 적절히 줄일 수 있다.
Error SVG 응답은 일시적 실패가 cache되지 않도록 `Cache-Control: no-store`를 사용한다.

## 설정

환경변수:

- `GITHUB_TOKEN`: public contribution data 조회를 위해 GitHub GraphQL API를 호출할 수 있는 token.

README에는 배포자가 Vercel project settings에 이 token을 추가해야 한다고 설명한다.

## 테스트

Unit test:

- Username validation.
- Contribution count에서 density level로의 변환.
- SVG escaping.
- Renderer output이 기대한 SVG 구조를 포함하고, escape되지 않은 raw username을 포함하지 않는지 확인.

Integration-style test:

- API가 SVG content type을 반환하는지 확인.
- username이 없으면 SVG error response를 반환하는지 확인.
- mocked GitHub not-found response가 SVG error response를 반환하는지 확인.

수동 검증:

- Next.js를 local에서 시작한다.
- `/api/grass?username=octocat`을 연다.
- SVG가 browser에서 렌더링되는지 확인한다.
- 생성된 README 안내의 Markdown embed 형식이 동작하는지 확인한다.

## 1차 구현 계획의 경계

첫 구현은 Next.js 프로젝트 생성, SVG 엔드포인트 추가, 집중된 테스트 추가, README 사용법 및 배포 안내 작성까지 포함한다. PNG export나 visual editor는 구현하지 않는다.
