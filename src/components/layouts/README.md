# layouts

Layout components: `RootLayout.tsx`, `AuthLayout.tsx`

Next.js บังคับว่า root layout ต้องอยู่ที่ `src/app/layout.tsx` (มี `<html>`/`<body>` ตาม
file convention) จึงย้ายไฟล์นั้นออกทั้งไฟล์ไม่ได้ — `RootLayout.tsx` ที่นี่คือ UI จริงที่ถูก
ดึงออกมา แล้วให้ `src/app/layout.tsx` import ไปใช้แทน
