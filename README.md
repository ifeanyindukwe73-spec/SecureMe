# SafeCircle

SafeCircle is a frontend demo for school and organization safety reporting, response coordination, and privacy-conscious trend exploration.

## Run locally

```sh
npm install
npm run dev
```

Create a production build with `npm run build`.

The incident board starts with fictional sample reports and saves new reports, assignments, status changes, investigation updates, history, and in-app notifications in this browser's local storage. Reporter submissions appear in the response-team incident board when it is opened, and an already-open board refreshes automatically.

## App structure

- `src/pages/LandingScreen.tsx` — public landing page and navigation.
- `src/pages/ReportersFlow.tsx` — student incident-reporting flow.
- `src/pages/Dashboard.tsx` — response-team incident dashboard.
- `src/pages/TrendsDashboard.tsx` — public aggregate trend view by time and location.
- `src/pages/ResponseTeamAccess.tsx` — response-team access design and demo entry.
- `src/pages/OrganizationMapSetup.tsx` — organization floor-plan and location editor.
- `src/components/` — reusable brand, prototype notice, and organization-map helpers.

`src/App.tsx` owns page navigation. Non-landing pages are lazy-loaded so the charting screens do not need to load with the first page.

## Demo limitations

This is a local demo, not an operational safety service:

- The response-team entry is not authenticated. There is no identity provider, authorization, organization isolation, or production-grade audit controls.
- Demo data is stored in this browser only. Other browsers/devices do not share reports. Notifications appear in the in-app inbox only; no email, SMS, push, or emergency-service dispatch is configured.
- The included incidents are fictional sample records. Do not use this demo to handle real reports or sensitive personal information.
- The response board and trends dashboard use the same browser-stored incident records. Trends are local demo aggregates, not live school statistics; a production trends API should suppress small groups and exclude identifying details.
- The map editor stores its image and locations in this browser's local storage. Do not upload confidential floor plans. A production system needs authenticated, organization-scoped storage and authorization.

Before production use, add organization identity with MFA/passkeys, enforce server-side authorization, configure verified notification channels and emergency escalation procedures, and move the data into audited, organization-scoped storage.
