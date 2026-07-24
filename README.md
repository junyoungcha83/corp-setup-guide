# 법인설립가이드

부동산 경매 법인 설립 가이드 PWA. `기본` 탭(가이드 + 진행 체크박스), `참고` 탭(동영상 링크 → 인라인 임베드).

## 구조
- PWA(GitHub Pages): `index.html` · `assets/{app.js,app.css,icon.svg}` · `sw.js` · `manifest`
- Cloudflare Worker + KV: `api/` — GET/PUT `/api/data` (X-Edit-Token). 배포·개발: `cd api && npm run deploy` / `npm run dev`
- 데이터 키 `corp-guide-data` = `{ version, checks:{}, videos:[] }`

읽기는 공개, 편집(체크·동영상 추가/삭제)은 헤더 🔒 에 편집 비밀번호 입력 시.
