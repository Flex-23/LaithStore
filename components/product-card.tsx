"use client";

import { SmartImage } from "./smart-image";
import { useCart } from "./providers/cart-context";
import { useToast } from "./providers/toast";
import { CartIcon, CheckIcon } from "./icons";
import { discountPercent, effectivePrice, formatNumber, formatPrice } from "@/lib/format";
import { useState } from "react";

export type ProductCardData = {
  id: string;
  name: string;
  description: string;
  price: number;
  discountedPrice: number | null;
  isDiscounted: boolean;
  image: string;
  stockQuantity: number;
};

export function ProductCard({
  product,
  priority = false,
}: {
  product: ProductCardData;
  priority?: boolean;
}) {
  const { addItem, openCart } = useCart();
  const { toast } = useToast();
  const [justAdded, setJustAdded] = useState(false);

  const unit = effectivePrice(product);
  const soldOut = product.stockQuantity <= 0;
  const percent =
    product.isDiscounted && product.discountedPrice != null
      ? discountPercent(product.price, product.discountedPrice)
      : 0;

  function handleAdd() {
    if (soldOut) return;
    addItem({
      id: product.id,
      name: product.name,
      price: unit,
      image: product.image,
      stock: product.stockQuantity,
    });
    toast(`تمت إضافة ${product.name} إلى السلة`);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1400);
    openCart();
  }

  return (
    <article className="group flex flex-col">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-border">
        <SmartImage
          src={product.image}
          alt={product.name}
          priority={priority}
          className="h-full w-full transition-transform duration-700 group-hover:scale-[1.04]"
        />

        {/* Badges */}
        <div className="absolute inset-s-3 top-3 flex flex-col items-start gap-2">
          {percent > 0 && (
            <span className="badge badge-sale">-{percent}%</span>
          )}
          {soldOut && <span className="badge">نفدت الكمية</span>}
          {!soldOut && product.stockQuantity <= 5 && (
            <span className="badge">
              بقي {formatNumber(product.stockQuantity)} فقط
            </span>
          )}
        </div>

        {/* Add to cart */}
        <div className="absolute inset-x-3 bottom-3 translate-y-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 max-sm:translate-y-0 max-sm:opacity-100">
          <button
            onClick={handleAdd}
            disabled={soldOut}
            className="btn btn-primary btn-sm glass w-full !text-foreground"
          >
            {justAdded ? (
              <>
                <CheckIcon width={16} height={16} /> تمت الإضافة
              </>
            ) : (
              <>
                <CartIcon width={16} height={16} />
                {soldOut ? "غير متوفر" : "أضف إلى السلة"}
              </>
            )}
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-1 flex-col">
        <h3 className="font-serif text-lg leading-tight text-foreground">
          {product.name}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted">
          {product.description}
        </p>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-base font-semibold text-foreground">
            {formatPrice(unit)}
          </span>
          {percent > 0 && (
            <span className="text-sm text-muted line-through">
              {formatPrice(product.price)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
