// Default storefront home-page copy. The admin can override every field from
// /admin/home; until then (or if the DB is unreachable) these are shown.

const img = (id: string, w = 900) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export type HomeContentData = {
  heroEyebrow: string;
  heroTitle: string;
  heroHighlight: string;
  heroSubtitle: string;
  heroCta: string;
  heroImage1: string;
  heroImage2: string;
  promoEyebrow: string;
  promoTitle: string;
  promoText: string;
  promoCta: string;
  promoImage: string;
};

export const DEFAULT_HOME_CONTENT: HomeContentData = {
  heroEyebrow: "الموسم الجديد · 2026",
  heroTitle: "أشياء يومية،\nبعناية استثنائية.",
  heroHighlight: "بعناية",
  heroSubtitle:
    "تشكيلة مختارة من الإلكترونيات والأزياء ومستلزمات المنزل — اخترناها لجودة صنعها، وصُممت لتدوم.",
  heroCta: "تسوّق التشكيلة",
  heroImage1: img("1491553895911-0055eca6402d"),
  heroImage2: img("1523275335684-37898b6baf30"),
  promoEyebrow: "تشكيلة الموسم",
  promoTitle: "قطع تستحق الاقتناء",
  promoText: "اكتشف منتجاتنا الأكثر طلباً، الآن مع خصومات موسمية.",
  promoCta: "اكتشف الآن",
  promoImage: img("1441986300917-64674bd600d8", 1600),
};

export const HOME_CONTENT_ID = "main";
