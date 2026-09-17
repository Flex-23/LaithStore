import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const categoryId = request.nextUrl.searchParams.get("categoryId");
  try {
    const products = await prisma.product.findMany({
      where: categoryId ? { categoryId } : undefined,
      orderBy: { createdAt: "desc" },
      include: { category: { select: { id: true, name: true } } },
    });
    return Response.json({ products });
  } catch {
    return Response.json(
      { products: [], error: "Database unreachable" },
      { status: 503 },
    );
  }
}
