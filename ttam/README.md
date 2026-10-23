# React + Vite

## Booking and payment demo

The frontend uses the NestJS API at `http://localhost:3000/api` by default. Set
`VITE_API_URL` to change that base URL. Start the backend and configure its
PostgreSQL database, `JWT_SECRET`, `OWNER_EMAIL`, and `OWNER_PASSWORD` before
using account signup, login, or persistent bookings.
The API URL must include the `/api` prefix. Copy `.env.example` to `.env` for
local configuration; `VITE_` values are included in the built frontend, so do
not put secrets in them. Set `VITE_API_URL` in your frontend hosting
environment for production builds.

Bookings hold a place for 24 hours while awaiting payment. The Telebirr and CBE
checkout records a method, Birr amount, and reference for demonstration only; it
does not transfer or verify funds. Paid booking cancellations calculate an
8% fee 1–5 days before departure, 4% at 6–10 days, and 2% at 11 or more days.
Agent commission is 10% of the amount recorded as paid, recalculated to 10% of
the retained cancellation fee after the refund is due. Refund amounts remain
due until staff issue them outside the demo and record that the refund was sent.
Owners can set a journey image by URL or upload a JPG, PNG, or WebP file up to
2 MB.
Clients can download a PDF booking receipt after recording a demo payment.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
