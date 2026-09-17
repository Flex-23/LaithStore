import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { products: true } } },
    });
    return Response.json({ categories });
  } catch {
    return Response.json(
      { categories: [], error: "Database unreachable" },
      { status: 503 },
    );
  }
}
