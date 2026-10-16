# لوحة تحكم الأدمين — ORO PARFUME

## الفكرة
باش التعديلات من لوحة التحكم تبان عند جميع الزوار (ماشي غير فالجهاز ديالك)، خاص الموقع يتخزن فـ Lovable Cloud (قاعدة بيانات + تسجيل دخول آمن). المتجر غادي يقرا العطور والعروض والإعدادات من Cloud بلاصة الملف الثابت.

## الصفحات
1. **/admin/login** — دخول بـ اسم المستخدم `admin` وكلمة السر اللي عطيتي. كلمة السر كتتخزن مشفّرة فـ Cloud، ماشي مكتوبة فالكود.
2. **/admin** (الرئيسية) — ملخص: عدد العطور، العروض النشطة، الزوار المتصلين دابا.
3. **/admin/perfumes** — إضافة / تعديل / حذف عطر: الاسم، الفئة (Men/Women/Unisex)، العائلة، الثمن بالدرهم، نسبة التخفيض، النوتات (Top/Heart/Base)، رفع الصورة، إظهار/إخفاء.
4. **/admin/offers** — إضافة وحذف وتعديل العروض (العنوان، الوصف، النوع، تاريخ نهاية العدّاد)، وتشغيل/إيقاف كل عرض.
5. **/admin/visitors** — عدد الأشخاص المتصلين مباشرة فالموقع (يتحدّث لحظياً) + عدد الزيارات ديال اليوم.
6. **/admin/settings** — رقم واتساب، رابط إنستغرام، وتاريخ نهاية العرض المحدود.

صفحات الأدمين محمية: أي واحد ماشي أدمين كيترجع لصفحة الدخول.

## اللي ما غاديش يتبدل
تصميم المتجر، الألوان، الخطوط وترتيب الأقسام. العطور الثمانية والعروض الحالية غادي يتنقلو كما هوما لقاعدة البيانات.

## ملاحظة على ملف HTML الواحد
ملف `oro-parfume.html` المستقل ما يقدرش يتبع لوحة التحكم (ما عندوش اتصال بـ Cloud). غادي يبقى كنسخة احتياطية ثابتة؛ الموقع المنشور هو اللي غادي يتحكم فيه الأدمين.

## Technical details
- Enable Lovable Cloud. Tables: `products`, `offers`, `site_settings` (single row), `user_roles` + `has_role`; public anon SELECT on visible products/active offers/settings; writes admin-only via RLS. Storage bucket `product-images` (public read, admin write).
- Admin account: email `admin@oro.local` (username login maps to it), created server-side with the given password, role `admin`. Email auth enabled with auto-confirm only for this seeded account.
- Visitors: Realtime presence channel `site-presence` joined by storefront; daily visit counter table `visits` (anon insert only).
- Storefront loads catalog via public server fn with publishable client; totals logic in `catalog.ts` stays and takes products as input; tests updated.
- Routes under `src/routes/_authenticated/admin.*` with admin role check.
