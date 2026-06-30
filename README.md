# AI AX Academy 신청 페이지

Vercel에 바로 올릴 수 있는 신청 페이지입니다. `index.html`의 신청 폼이 `/api/apply`로 전송되고, Vercel API가 Google Apps Script 웹앱을 호출해 구글 시트에 행을 추가합니다.

## 1. 구글 시트 준비

1. 구글 시트를 만들고 첫 행에 아래 헤더를 넣습니다.
   - 신청일시
   - 이름
   - 전화번호
   - 유입경로
2. `확장 프로그램 > Apps Script`를 열고 `google-apps-script.js` 내용을 붙여 넣습니다.
3. Apps Script의 `SHEET_NAME`을 실제 시트 탭 이름에 맞춥니다.
4. `배포 > 새 배포 > 웹 앱`으로 배포합니다.
   - 실행 사용자: 나
   - 액세스 권한: 모든 사용자
5. 생성된 웹 앱 URL을 복사합니다.

## 2. Vercel 환경변수

Vercel 프로젝트 Settings > Environment Variables에 아래 값을 추가합니다.

- `GOOGLE_SHEETS_WEBHOOK_URL`: Apps Script 웹 앱 URL

## 3. 배포

Vercel CLI를 쓸 경우:

```bash
npm install -g vercel
vercel
vercel --prod
```

또는 이 폴더를 GitHub에 올린 뒤 Vercel에서 Import하면 됩니다.
