const CART_KEY = 'kaffza_plan_cart';

export type PlanCartItem = {
  slug: string;
  quantity: number;
};

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function readPlanCart(): PlanCartItem[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PlanCartItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item.slug && Number(item.quantity) > 0);
  } catch {
    return [];
  }
}

export function writePlanCart(items: PlanCartItem[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event('kaffza-plan-cart-updated'));
}

export function getPlanCartCount() {
  return readPlanCart().reduce((acc, item) => acc + item.quantity, 0);
}

export function addPlanToCart(slug: string, quantity = 1) {
  const items = readPlanCart();
  const index = items.findIndex((item) => item.slug === slug);
  if (index === -1) {
    items.push({ slug, quantity });
  } else {
    items[index].quantity += quantity;
  }
  writePlanCart(items);
}

export function removePlanFromCart(slug: string) {
  const items = readPlanCart().filter((item) => item.slug !== slug);
  writePlanCart(items);
}

export function clearPlanCart() {
  writePlanCart([]);
}
