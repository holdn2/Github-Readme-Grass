# GitHub Real Grass

GitHub Real Grass는 GitHub 사용자의 기여 캘린더를 README에 넣기 쉬운 SVG 이미지로 렌더링합니다. 공개 기여 데이터를 가져와 작은 흙밭과 잔디 그래프로 표시하며, 기여가 많은 날일수록 잔디가 더 많이 보입니다.

현재 렌더러는 첫 번째 SVG 버전입니다. SVG 표현이 시각적으로 부족해지면 나중에 더 사실적인 PNG 렌더링을 추가할 수 있습니다.

English documentation: [README.md](README.md)

## README에 넣기

앱을 배포한 뒤 README에 아래 Markdown 이미지를 추가합니다.

```md
![GitHub grass](https://your-app.vercel.app/api/grass?username=USERNAME)
```

`your-app.vercel.app`은 배포 URL로, `USERNAME`은 GitHub 사용자명으로 바꿉니다.

## API

```txt
GET /api/grass?username=USERNAME
```

파라미터:

| 이름 | 필수 | 설명 |
| --- | --- | --- |
| `username` | 예 | 렌더링할 GitHub 사용자명입니다. 영문자, 숫자, 하이픈만 허용합니다. 영문자 또는 숫자로 시작하고 끝나야 하며, 연속 하이픈은 허용하지 않고, 최대 길이는 39자입니다. |

README 이미지 embed에서 실패 상황도 보이도록 응답은 항상 SVG입니다.

| 상태 | Content type | 의미 |
| --- | --- | --- |
| `200` | `image/svg+xml` | 기여 그래프 렌더링 성공. |
| `400` | `image/svg+xml` | 사용자명이 없거나 올바르지 않음. |
| `404` | `image/svg+xml` | GitHub 사용자를 찾을 수 없음. |
| `500` | `image/svg+xml` | 토큰 누락, GitHub API 실패, 서버 오류. |

## 캐시 동작

엔드포인트는 CDN에 적합한 캐시 헤더를 반환합니다.

```txt
Cache-Control: public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400
Content-Type: image/svg+xml; charset=utf-8
```

새 데이터는 1시간 동안 캐시되며, CDN이 재검증하는 동안 stale 응답을 사용할 수 있습니다.

## 로컬 설정

필요한 항목:

- Node.js
- npm
- 공개 기여 데이터를 조회하기 위해 GitHub GraphQL API를 호출할 수 있는 GitHub token

의존성을 설치합니다.

```sh
npm install
```

`.env.local`을 만듭니다.

```env
GITHUB_TOKEN=github_pat_your_token_here
```

개발 서버를 시작합니다.

```sh
npm run dev
```

아래 주소를 엽니다.

```txt
http://localhost:3000/api/grass?username=octocat
```

## Vercel 배포

1. 이 저장소를 Vercel에 Next.js 프로젝트로 가져옵니다.
2. Vercel 프로젝트 설정의 Environment Variables에 `GITHUB_TOKEN`을 추가합니다.
3. 배포합니다.
4. README embed에 Vercel URL을 사용합니다.

```md
![GitHub grass](https://your-app.vercel.app/api/grass?username=octocat)
```

## GITHUB_TOKEN

`GITHUB_TOKEN`은 GitHub GraphQL을 통해 contribution calendar 데이터를 읽기 위해 필요합니다.

공개 기여 데이터를 조회할 수 있도록 GitHub GraphQL API 호출 권한이 있는 token을 사용합니다. token을 클라이언트 코드나 README 예시에 노출하지 말고 환경 변수로만 설정하세요.

## 제한 사항

- 첫 버전은 SVG만 지원하며, PNG는 나중에 추가될 수 있습니다.
- 사용자 계정, 데이터베이스 저장, 테마 편집기, GitHub Action 생성, 대체 레이아웃은 없습니다.
- 데이터 신선도는 1시간 캐시 헤더의 영향을 받습니다.
- GitHub API rate limit과 token 권한에 따라 사용 가능 여부가 달라질 수 있습니다.
- 비공개 기여 표시 여부는 token과 GitHub API가 허용하는 범위에 따릅니다.

## 개발 명령

```sh
npm run dev
npm run typecheck
npm test
npm run build
```
