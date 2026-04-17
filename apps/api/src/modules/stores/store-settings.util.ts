export type PaymentMethod = 'card' | 'cod' | 'wallet' | 'bnpl';

type NullableNumber = number | null;

export interface PaymentSettings {
  cardEnabled: boolean;
  codEnabled: boolean;
  walletEnabled: boolean;
  bnplEnabled: boolean;
  minOrderAmount: NullableNumber;
  maxOrderAmount: NullableNumber;
  codMinOrderAmount: NullableNumber;
  codMaxOrderAmount: NullableNumber;
  codMaxWeightKg: NullableNumber;
}

export type ShippingStrategy = 'legacy' | 'flat' | 'weight_tier';

export interface ShippingZone {
  code: string;
  nameAr: string;
  nameEn: string;
  additionalCost: number;
  enabled: boolean;
}

export interface WeightTier {
  minWeightKg: number;
  maxWeightKg: number | null;
  cost: number;
}

export interface ShippingSettings {
  strategy: ShippingStrategy;
  flatRate: number;
  freeShippingThreshold: number | null;
  zones: ShippingZone[];
  weightTiers: WeightTier[];
}

const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  cardEnabled: true,
  codEnabled: false,
  walletEnabled: false,
  bnplEnabled: false,
  minOrderAmount: null,
  maxOrderAmount: null,
  codMinOrderAmount: null,
  codMaxOrderAmount: null,
  codMaxWeightKg: null,
};

export function normalizePaymentSettings(raw: unknown): PaymentSettings {
  const data = isObj(raw) ? raw : {};

  return {
    cardEnabled: toBool(data.cardEnabled, DEFAULT_PAYMENT_SETTINGS.cardEnabled),
    codEnabled: toBool(data.codEnabled, DEFAULT_PAYMENT_SETTINGS.codEnabled),
    walletEnabled: toBool(data.walletEnabled, DEFAULT_PAYMENT_SETTINGS.walletEnabled),
    bnplEnabled: toBool(data.bnplEnabled, DEFAULT_PAYMENT_SETTINGS.bnplEnabled),
    minOrderAmount: toNullableNumber(data.minOrderAmount),
    maxOrderAmount: toNullableNumber(data.maxOrderAmount),
    codMinOrderAmount: toNullableNumber(data.codMinOrderAmount),
    codMaxOrderAmount: toNullableNumber(data.codMaxOrderAmount),
    codMaxWeightKg: toNullableNumber(data.codMaxWeightKg),
  };
}

export function normalizeShippingSettings(raw: unknown): ShippingSettings {
  const data = isObj(raw) ? raw : {};
  const strategy = toStrategy(data.strategy);

  const zones = Array.isArray(data.zones)
    ? data.zones
        .map((z) => {
          if (!isObj(z)) return null;
          const code = String(z.code || '').trim();
          if (!code) return null;
          return {
            code,
            nameAr: String(z.nameAr || '').trim() || code,
            nameEn: String(z.nameEn || '').trim() || code,
            additionalCost: round3(Math.max(0, toNumber(z.additionalCost, 0))),
            enabled: toBool(z.enabled, true),
          } satisfies ShippingZone;
        })
        .filter((x): x is ShippingZone => !!x)
    : [];

  const tiers = Array.isArray(data.weightTiers)
    ? data.weightTiers
        .map((t) => {
          if (!isObj(t)) return null;
          const minWeightKg = Math.max(0, toNumber(t.minWeightKg, 0));
          const maxWeightRaw = toNullableNumber(t.maxWeightKg);
          const maxWeightKg =
            maxWeightRaw !== null && maxWeightRaw < minWeightKg ? minWeightKg : maxWeightRaw;
          return {
            minWeightKg: round3(minWeightKg),
            maxWeightKg: maxWeightKg === null ? null : round3(Math.max(0, maxWeightKg)),
            cost: round3(Math.max(0, toNumber(t.cost, 0))),
          } satisfies WeightTier;
        })
        .filter((x): x is WeightTier => !!x)
        .sort((a, b) => a.minWeightKg - b.minWeightKg)
    : [];

  return {
    strategy,
    flatRate: round3(Math.max(0, toNumber(data.flatRate, 0))),
    freeShippingThreshold: toNullableNumber(data.freeShippingThreshold),
    zones,
    weightTiers: tiers,
  };
}

export function validatePaymentSettings(settings: PaymentSettings) {
  if (
    settings.minOrderAmount !== null &&
    settings.maxOrderAmount !== null &&
    settings.maxOrderAmount < settings.minOrderAmount
  ) {
    throw new Error('maxOrderAmount should be >= minOrderAmount');
  }

  if (
    settings.codMinOrderAmount !== null &&
    settings.codMaxOrderAmount !== null &&
    settings.codMaxOrderAmount < settings.codMinOrderAmount
  ) {
    throw new Error('codMaxOrderAmount should be >= codMinOrderAmount');
  }
}

export function validateShippingSettings(settings: ShippingSettings) {
  if (settings.freeShippingThreshold !== null && settings.freeShippingThreshold < 0) {
    throw new Error('freeShippingThreshold should be >= 0');
  }

  for (const tier of settings.weightTiers) {
    if (tier.maxWeightKg !== null && tier.maxWeightKg < tier.minWeightKg) {
      throw new Error('weight tier max should be >= min');
    }
  }
}

export function getEnabledPaymentMethods(settings: PaymentSettings): PaymentMethod[] {
  const methods: PaymentMethod[] = [];
  if (settings.cardEnabled) methods.push('card');
  if (settings.codEnabled) methods.push('cod');
  if (settings.walletEnabled) methods.push('wallet');
  if (settings.bnplEnabled) methods.push('bnpl');
  return methods;
}

export function calculateShippingCost(
  rawSettings: unknown,
  params: {
    subtotal: number;
    weightKg: number;
    state?: string;
    city?: string;
    legacyBaseCost: number;
    legacyPerKgCost: number;
  }
) {
  const settings = normalizeShippingSettings(rawSettings);
  const subtotal = Math.max(0, Number(params.subtotal || 0));
  const weightKg = Math.max(0, Number(params.weightKg || 0));

  let cost = 0;
  if (settings.strategy === 'flat') {
    cost = settings.flatRate;
  } else if (settings.strategy === 'weight_tier') {
    const tier = settings.weightTiers.find(
      (t) => weightKg >= t.minWeightKg && (t.maxWeightKg === null || weightKg <= t.maxWeightKg)
    );
    cost = tier ? tier.cost : settings.flatRate;
  } else {
    cost = params.legacyBaseCost + params.legacyPerKgCost * weightKg;
  }

  const zone = findZone(settings.zones, params.state, params.city);
  if (zone) {
    cost += zone.additionalCost;
  }

  if (settings.freeShippingThreshold !== null && subtotal >= settings.freeShippingThreshold) {
    cost = 0;
  }

  return round3(Math.max(0, cost));
}

function findZone(zones: ShippingZone[], state?: string, city?: string) {
  if (!zones.length) return null;
  const haystack = `${state || ''} ${city || ''}`.toLowerCase();
  if (!haystack.trim()) return null;

  return (
    zones.find((zone) => zone.enabled && haystack.includes(zone.code.toLowerCase())) ||
    zones.find((zone) => zone.enabled && haystack.includes(zone.nameAr.toLowerCase())) ||
    zones.find((zone) => zone.enabled && haystack.includes(zone.nameEn.toLowerCase())) ||
    null
  );
}

function toStrategy(value: unknown): ShippingStrategy {
  if (value === 'flat' || value === 'weight_tier' || value === 'legacy') return value;
  return 'legacy';
}

function toNullableNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return round3(n);
}

function toNumber(value: unknown, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toBool(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback;
}

function isObj(value: unknown): value is Record<string, any> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function round3(v: number) {
  return Math.round(v * 1000) / 1000;
}
