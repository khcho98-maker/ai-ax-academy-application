# AI AX Academy Application - Handoff

## Live Services

- Website: https://ai-ax-academy-application.vercel.app
- Google Sheet: https://docs.google.com/spreadsheets/d/1vAdtW82msiGfwPivi4TFZE6aFIwmsUEwObmf62K9-ok/edit
- Vercel project: ai-ax-academy-application

## Project Structure

- `index.html`: single-page academy landing page, application form, sponsor toggle UI
- `api/apply.js`: Vercel serverless endpoint for application submissions
- `api/sponsors.js`: Vercel serverless endpoint for sponsor list, cached daily on Vercel CDN
- `google-apps-script.js`: Apps Script code backing application writes and sponsor reads
- `vercel.json`: Vercel routing config

## Required Vercel Environment Variables

- `GOOGLE_SHEETS_WEBHOOK_URL`: Apps Script web app `/exec` URL
- Optional `SPONSORS_CSV_URL`: not currently used; if set, sponsor API reads CSV instead of Apps Script

## Google Sheet Layout

Spreadsheet tabs:

1. Application tab currently named `??1`
   - Columns: application timestamp, name, email, source
   - The Apps Script targets this tab by `APPLICATION_SHEET_ID = 895118963`, not by name.
2. `후원자`
   - Columns: `후원자명`, `금액`
   - The Apps Script targets this tab by `SPONSOR_SHEET_ID = 742379800`, not by name.

## Apps Script Deployment Rule

After editing `google-apps-script.js` in Apps Script:

1. Save the script.
2. Open `Deploy > Manage deployments`.
3. Edit the web app deployment.
4. Select `New version`.
5. Deploy.
6. Keep access as `Anyone` and execute as the owner.

If a new `/exec` URL is generated, update Vercel `GOOGLE_SHEETS_WEBHOOK_URL` and redeploy production.

## Sponsor Refresh Behavior

`/api/sponsors` is intentionally cached as a daily batch-like endpoint:

- `CDN-Cache-Control: public, s-maxage=86400, stale-while-revalidate=3600`
- Google Sheet changes may take up to a day to appear on the site.
- For urgent sponsor refreshes, redeploy or temporarily change the cache behavior.

## Deployment

```bash
vercel --prod --yes
```

## Current Notes

- The site is already deployed on Vercel.
- The local repository has no GitHub remote yet.
- Do not commit `.env.local`.
