# قفزة (Kaffza) — أول منصة تجارة إلكترونية عُمانية

<div align="center">

**Kaffza** | **قفزة**

*منصة SaaS متكاملة للتجارة الإلكترونية في سلطنة عُمان*

**جوهرة الشهباء الحديثة ش.م.م**

</div>

---

## حول المشروع

قفزة (Kaffza) هي أول منصة تجارة إلكترونية عُمانية متكاملة تعمل بنظام SaaS، مصممة لتمكين التجار من إنشاء وإدارة متاجرهم الإلكترونية بسهولة. المنصة تدعم اللغتين العربية والإنجليزية، وتعمل بعملة الريال العُماني حصرياً، مع تكامل محلي مع بوابة الدفع Thawani Pay وخدمة الشحن جيناكم.

## المميزات الرئيسية

| الميزة | الوصف |
| :--- | :--- |
| **Multi-tenant SaaS** | كل تاجر يحصل على متجره الخاص بنطاق فرعي مخصص |
| **ثنائي اللغة (RTL)** | دعم كامل للعربية والإنجليزية مع تبديل تلقائي لاتجاه النص |
| **Thawani Pay** | بوابة دفع عُمانية محلية |
| **جيناكم** | خدمة شحن عُمانية محلية |
| **نظام Escrow** | حماية مالية ذكية تتكيف مع مستوى ثقة التاجر |
| **نظام نزاعات** | آلية حل النزاعات بين التجار والعملاء |
| **محفظة التاجر** | إدارة الأرصدة والسحب مع سجل معاملات كامل |
| **OTP + JWT** | مصادقة آمنة عبر رمز التحقق ورموز JWT |

## التقنيات المستخدمة

| الطبقة | التقنية |
| :--- | :--- |
| Backend | Node.js, NestJS, Prisma, PostgreSQL, Redis |
| Web | Next.js 15, React 19, Tailwind CSS, next-intl |
| Mobile | React Native, Expo, NativeWind |
| Monorepo | Turborepo, pnpm workspaces |
| DevOps | Docker Compose, Nginx |

## هيكل المشروع

```
kaffza-oman/
├── apps/
│   ├── api/          # NestJS Backend API
│   ├── web/          # Next.js Web Application
│   └── mobile/       # React Native Mobile App
├── packages/
│   ├── types/        # Shared TypeScript types
│   ├── validators/   # Shared Zod validation schemas
│   ├── tsconfig/     # Shared TypeScript configs
│   └── config/       # Shared ESLint/Prettier configs
├── docs/             # Architecture docs & diagrams
└── docker-compose.yml
```

## البدء السريع

### المتطلبات

يتطلب تشغيل المشروع توفر Node.js بإصدار 20 أو أحدث، pnpm بإصدار 9 أو أحدث، و Docker مع Docker Compose لتشغيل قاعدة البيانات والخدمات المساعدة.

### التثبيت

```bash
# استنساخ المشروع
git clone https://github.com/YOUR_USERNAME/Kaffza-Oman.git
cd Kaffza-Oman

# تثبيت الحزم
pnpm install

# تشغيل الخدمات (PostgreSQL, Redis, MinIO)
docker compose up -d

# نسخ ملف البيئة
cp .env.example .env

# تشغيل migrations
pnpm db:migrate

# تشغيل seeds
pnpm db:seed

# تشغيل جميع التطبيقات
pnpm dev
```

### المنافذ

| الخدمة | المنفذ |
| :--- | :--- |
| Web (Next.js) | `http://localhost:3000` |
| API (NestJS) | `http://localhost:4000` |
| API Docs (Swagger) | `http://localhost:4000/api/docs` |
| PostgreSQL | `localhost:5432` |
| Redis | `localhost:6379` |
| MinIO Console | `http://localhost:9001` |

## خطط الاشتراك

| الخطة | السعر الشهري | العمولة |
| :--- | :--- | :--- |
| البداية (Starter) | 5 ر.ع | 2% |
| النمو (Growth) | 25 ر.ع | 1% |
| المحترف (Pro) | 75 ر.ع | 0.5% |

لا توجد رسوم تسجيل.

## الوثائق

للاطلاع على التصميم المعماري الكامل، مخططات قاعدة البيانات، وتدفقات العمل، يرجى مراجعة [وثيقة التصميم المعماري](./docs/ARCHITECTURE.md).

## الترخيص

هذا المشروع ملكية خاصة لشركة **جوهرة الشهباء الحديثة ش.م.م**. جميع الحقوق محفوظة.
