import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_HOME_CONTENT, HOME_CONTENT_ID } from "../lib/home-content.ts";

const prisma = new PrismaClient();

const img = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=80`;

type SeedProduct = {
  name: string;
  description: string;
  price: number; // IQD
  discountedPrice?: number; // IQD
  image: string;
  stockQuantity: number;
};

const catalog: {
  name: string;
  description: string;
  image: string;
  products: SeedProduct[];
}[] = [
  {
    name: "إلكترونيات",
    description: "صوت وصورة وكل ما هو ذكي.",
    image: img("1498049794561-7780e7231661"),
    products: [
      {
        name: "سماعات أورا اللاسلكية",
        description: "إلغاء ضوضاء نشط مع بطارية تدوم 40 ساعة.",
        price: 260_000,
        discountedPrice: 195_000,
        image: img("1505740420928-5e560c06d30e"),
        stockQuantity: 34,
      },
      {
        name: "مكبر صوت بالس بلوتوث",
        description: "صوت محيطي 360° يملأ الغرفة بحجم الجيب.",
        price: 115_000,
        image: img("1608043152269-423dbba4e7e1"),
        stockQuantity: 52,
      },
      {
        name: "كاميرا لومن بدون مرآة",
        description: "مستشعر 24 ميغابكسل مع تصوير سينمائي بدقة 4K.",
        price: 1_170_000,
        discountedPrice: 1_040_000,
        image: img("1516035069371-29a1b244cc32"),
        stockQuantity: 12,
      },
      {
        name: "ساعة فيغا الذكية",
        description: "تتبّع صحي مع شاشة تعمل دائماً.",
        price: 325_000,
        image: img("1523275335684-37898b6baf30"),
        stockQuantity: 40,
      },
      {
        name: "سماعات نيمبوس الصغيرة",
        description: "خفيفة كالريشة مع وضوح فائق للمكالمات.",
        price: 105_000,
        discountedPrice: 78_000,
        image: img("1590658268037-6bf12165a8df"),
        stockQuantity: 66,
      },
      {
        name: "قاعدة شحن فلَكس",
        description: "شحن لاسلكي سريع بقوة 15 واط بتصميم بسيط.",
        price: 52_000,
        image: img("1591290619762-c588cb56b0cd"),
        stockQuantity: 80,
      },
    ],
  },
  {
    name: "أزياء",
    description: "أساسيات الخزانة بلمسة عصرية.",
    image: img("1441984904996-e0b6ba687e04"),
    products: [
      {
        name: "حذاء رانر الرياضي",
        description: "حذاء يومي مريح من الجلد الناعم.",
        price: 170_000,
        discountedPrice: 130_000,
        image: img("1542291026-7eec264c27ff"),
        stockQuantity: 45,
      },
      {
        name: "جاكيت دنيم هيريتج",
        description: "دنيم نيلي كلاسيكي بقصّة مضبوطة.",
        price: 208_000,
        image: img("1544022613-e87ca75a784a"),
        stockQuantity: 28,
      },
      {
        name: "كنزة صوف ميرينو",
        description: "صوف ميرينو يتنفس في كل الفصول.",
        price: 155_000,
        image: img("1576566588028-4147f3842f27"),
        stockQuantity: 33,
      },
      {
        name: "معطف ترنش كلاسيكي",
        description: "معطف مقاوم للماء بخطوط أنيقة.",
        price: 300_000,
        discountedPrice: 247_000,
        image: img("1591047139829-d91aecb6caea"),
        stockQuantity: 18,
      },
      {
        name: "قميص كتّان صيفي",
        description: "قميص كتّان مريح يتنفس طوال اليوم.",
        price: 90_000,
        image: img("1602810318383-e386cc2a3ccf"),
        stockQuantity: 54,
      },
    ],
  },
  {
    name: "المنزل والمعيشة",
    description: "قطع تجعل البيت يشعر كأنه وطن.",
    image: img("1493663284031-b7e3aefcae8e"),
    products: [
      {
        name: "كرسي استرخاء نورديك",
        description: "هيكل من خشب البلوط المنحوت مع مقعد منسوج.",
        price: 455_000,
        discountedPrice: 390_000,
        image: img("1567538096630-e0c55bd6374c"),
        stockQuantity: 9,
      },
      {
        name: "طقم قهوة مقطّرة سيراميك",
        description: "طقوس القهوة البطيئة في خزف مطفي.",
        price: 78_000,
        image: img("1495474472287-4d71bcdd2085"),
        stockQuantity: 41,
      },
      {
        name: "بطانية كتّان",
        description: "كتّان مغسول بالحجر لأمسيات دافئة.",
        price: 105_000,
        image: img("1583847268964-b28dc8f51f92"),
        stockQuantity: 37,
      },
      {
        name: "نبتة تيرا في أصيص",
        description: "خضرة قليلة العناية في أصيص فخاري.",
        price: 60_000,
        discountedPrice: 45_000,
        image: img("1485955900006-10f4d324d411"),
        stockQuantity: 60,
      },
      {
        name: "شمعة عنبر معطّرة",
        description: "شمع صويا مصبوب يدوياً، يحترق 60 ساعة.",
        price: 38_000,
        image: img("1602874801007-bd458bb1b8b6"),
        stockQuantity: 72,
      },
    ],
  },
  {
    name: "الجمال",
    description: "تركيبات نقية لبشرة متألقة.",
    image: img("1596462502278-27bfdc403348"),
    products: [
      {
        name: "سيروم هيدرا غلو",
        description: "سيروم حمض الهيالورونيك لترطيب عميق.",
        price: 65_000,
        discountedPrice: 52_000,
        image: img("1556228720-195a672e8a03"),
        stockQuantity: 88,
      },
      {
        name: "أحمر شفاه فيلفت مات",
        description: "لون يدوم طويلاً بإحساس خفيف.",
        price: 32_000,
        image: img("1586495777744-4413f21062fa"),
        stockQuantity: 95,
      },
      {
        name: "كريم الوجه بوتانيك",
        description: "مرطب غني بسيراميدات نباتية.",
        price: 52_000,
        image: img("1570172619644-dfd03ed5d881"),
        stockQuantity: 64,
      },
      {
        name: "زيت الشعر سيلك",
        description: "مزيج الأرغان يروّض التجعد ويضيف لمعاناً.",
        price: 45_000,
        discountedPrice: 36_000,
        image: img("1522338242992-e1a54906a8da"),
        stockQuantity: 77,
      },
      {
        name: "عطر نوار",
        description: "عبير دافئ بلمسة خشبية مميزة.",
        price: 115_000,
        image: img("1541643600914-78b084683601"),
        stockQuantity: 26,
      },
    ],
  },
  {
    name: "إكسسوارات",
    description: "اللمسات الأخيرة التي تصنع الفرق.",
    image: img("1509941943102-10c232535736"),
    products: [
      {
        name: "حقيبة ظهر جلدية يومية",
        description: "جلد طبيعي كامل مع جيب مبطّن للحاسوب.",
        price: 235_000,
        discountedPrice: 182_000,
        image: img("1553062407-98eeb64c6a62"),
        stockQuantity: 22,
      },
      {
        name: "نظارة شمسية أفياتور",
        description: "عدسات مستقطبة في إطار خفيف.",
        price: 115_000,
        image: img("1511499767150-a48a237f0083"),
        stockQuantity: 48,
      },
      {
        name: "محفظة جلدية بسيطة",
        description: "محفظة رفيعة تتسع للأساسيات.",
        price: 65_000,
        image: img("1627123424574-724758594e93"),
        stockQuantity: 70,
      },
      {
        name: "حقيبة سفر قماشية",
        description: "حقيبة قماش متينة للرحلات القصيرة.",
        price: 170_000,
        discountedPrice: 130_000,
        image: img("1547949003-9792a18a2601"),
        stockQuantity: 19,
      },
      {
        name: "قبعة قش منسوجة",
        description: "حافة منسوجة يدوياً لأمسيات مشمسة.",
        price: 52_000,
        image: img("1521369909029-2afed882baee"),
        stockQuantity: 58,
      },
    ],
  },
];

async function main() {
  console.log("🌱 Seeding database...");

  // Admin + demo customer.
  const adminPassword = await bcrypt.hash("admin1234", 10);
  const userPassword = await bcrypt.hash("user1234", 10);

  await prisma.user.upsert({
    where: { phone: "07700000000" },
    update: { name: "مدير المتجر", governorate: "بغداد" },
    create: {
      name: "مدير المتجر",
      phone: "07700000000",
      governorate: "بغداد",
      password: adminPassword,
      role: Role.ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { phone: "07711111111" },
    update: { name: "سارة أحمد", governorate: "البصرة" },
    create: {
      name: "سارة أحمد",
      phone: "07711111111",
      governorate: "البصرة",
      password: userPassword,
      role: Role.USER,
    },
  });

  // Demo agent (المندوب) — AG-0001 with orders + dashboard access, 5% commission.
  const agentPassword = await bcrypt.hash("agent1234", 10);
  await prisma.user.upsert({
    where: { phone: "07722222222" },
    update: {},
    create: {
      name: "علي حسن",
      phone: "07722222222",
      governorate: "بغداد",
      password: agentPassword,
      role: Role.AGENT,
      agentNumber: 1,
      commissionPerOrder: 2000,
      canManageOrders: true,
      canViewDashboard: true,
    },
  });

  // Home-page copy: create once with the defaults; never overwrite admin edits.
  await prisma.homeContent.upsert({
    where: { id: HOME_CONTENT_ID },
    update: {},
    create: { id: HOME_CONTENT_ID, ...DEFAULT_HOME_CONTENT },
  });

  // Replace the whole catalog (and the demo orders that reference it) so
  // re-seeding never leaves stale English/USD rows behind.
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  for (const cat of catalog) {
    await prisma.category.create({
      data: {
        name: cat.name,
        description: cat.description,
        image: cat.image,
        products: {
          create: cat.products.map((p) => ({
            name: p.name,
            description: p.description,
            price: p.price,
            discountedPrice: p.discountedPrice ?? null,
            isDiscounted: p.discountedPrice != null,
            image: p.image,
            stockQuantity: p.stockQuantity,
          })),
        },
      },
    });
  }

  console.log("✅ Seed complete.");
  console.log("   Admin login  → phone: 07700000000 · password: admin1234");
  console.log("   Agent login  → phone: 07722222222 · password: agent1234");
  console.log("   Customer     → phone: 07711111111 · password: user1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
