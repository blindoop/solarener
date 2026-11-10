export type RegionId = 'toshkent' | 'samarqand' | 'buxoro' | 'fargona';

export interface RegionSpec {
  id: RegionId;
  name: string;
  sunnyDays: number;
  peakSunHours: number;
  gridTariffSom: number;
}

export const UZBEK_REGIONS: Record<RegionId, RegionSpec> = {
  toshkent: {
    id: 'toshkent',
    name: 'Toshkent va Toshkent viloyati',
    sunnyDays: 305,
    peakSunHours: 5.4,
    gridTariffSom: 900,
  },
  samarqand: {
    id: 'samarqand',
    name: 'Samarqand viloyati',
    sunnyDays: 315,
    peakSunHours: 5.7,
    gridTariffSom: 900,
  },
  buxoro: {
    id: 'buxoro',
    name: 'Buxoro va Navoiy',
    sunnyDays: 330,
    peakSunHours: 6.1,
    gridTariffSom: 900,
  },
  fargona: {
    id: 'fargona',
    name: 'Farg‘ona vodiysi',
    sunnyDays: 300,
    peakSunHours: 5.3,
    gridTariffSom: 900,
  },
};

export interface SolarPlanResult {
  panelCount: number;
  systemKw: number;
  dailyKwh: number;
  monthlyKwh: number;
  annualSavingsSom: number;
  sevenYearSavingsSom: number;
  batteryKwh: number;
  selfSufficiencyPct: number;
}

export function calculateFamilySolarPlan(params: {
  regionId: RegionId;
  roofAreaSqm: number;
  monthlyUsageKwh: number;
  familyMembers: number;
}): SolarPlanResult {
  const region = UZBEK_REGIONS[params.regionId] ?? UZBEK_REGIONS.toshkent;
  const usableArea = Math.max(20, Math.min(240, params.roofAreaSqm));
  // Each 550W monocrystalline N-type panel uses ~2.4 m²
  const panelCount = Math.max(6, Math.floor(usableArea / 2.4));
  const systemKw = Number((panelCount * 0.55).toFixed(1));
  const dailyKwh = Number((systemKw * region.peakSunHours * 0.86).toFixed(1));
  const monthlyKwh = Math.round(dailyKwh * 30);

  // Effective tariff accounting for progressive social norm tiers for Uzbek households
  const effectiveTariff =
    params.monthlyUsageKwh > 500
      ? region.gridTariffSom * 1.35
      : region.gridTariffSom;
  const coveredKwh = Math.min(
    Math.max(params.monthlyUsageKwh, monthlyKwh),
    monthlyKwh * 1.15
  );
  const annualSavingsSom = Math.round(coveredKwh * 12 * effectiveTariff);
  const sevenYearSavingsSom = annualSavingsSom * 7;

  const batteryKwh = Math.max(10, Math.round((params.familyMembers * 2.5 + systemKw * 0.8) / 5) * 5);
  const selfSufficiencyPct = Math.min(
    100,
    Math.round((monthlyKwh / Math.max(150, params.monthlyUsageKwh)) * 100)
  );

  return {
    panelCount,
    systemKw,
    dailyKwh,
    monthlyKwh,
    annualSavingsSom,
    sevenYearSavingsSom,
    batteryKwh,
    selfSufficiencyPct,
  };
}

export interface SunTelemetry {
  solarGenerationKw: number;
  homeConsumptionKw: number;
  batteryChargePct: number;
  flowDirection: 'charging' | 'discharging' | 'balanced';
  sunElevationDeg: number;
}

export function computeSunTelemetry(
  hourOfDay: number,
  systemKw = 11.0
): SunTelemetry {
  const clampedHour = Math.max(0, Math.min(24, hourOfDay));
  // Sun rises ~06:00 and sets ~19:30 in Uzbekistan
  const dayWindow = (clampedHour - 6) / 13.5;
  const isDay = dayWindow > 0 && dayWindow < 1;
  const sunArc = isDay ? Math.sin(dayWindow * Math.PI) : 0;
  const sunElevationDeg = Math.round(sunArc * 72);

  const solarGenerationKw = Number((systemKw * Math.pow(sunArc, 1.15) * 0.92).toFixed(1));

  // Morning & evening family peak load
  const morningPeak = Math.exp(-Math.pow((clampedHour - 8.0) / 1.8, 2)) * 2.4;
  const eveningPeak = Math.exp(-Math.pow((clampedHour - 20.0) / 2.2, 2)) * 3.6;
  const homeConsumptionKw = Number((1.1 + morningPeak + eveningPeak).toFixed(1));

  // Battery SOC curve across 24h
  const batteryChargePct = Math.round(
    Math.max(
      24,
      Math.min(
        100,
        42 + Math.sin(((clampedHour - 9) / 24) * Math.PI * 2) * 46 + (isDay ? 12 : 0)
      )
    )
  );

  const net = solarGenerationKw - homeConsumptionKw;
  const flowDirection =
    net > 0.3 ? 'charging' : net < -0.3 ? 'discharging' : 'balanced';

  return {
    solarGenerationKw,
    homeConsumptionKw,
    batteryChargePct,
    flowDirection,
    sunElevationDeg,
  };
}

export interface QuoteFormInput {
  fullName: string;
  phone: string;
  regionId: RegionId;
  addressNote: string;
}

export interface QuoteValidationResult {
  valid: boolean;
  errors: {
    fullName?: string;
    phone?: string;
  };
}

export function validateUzbekQuoteForm(
  input: QuoteFormInput
): QuoteValidationResult {
  const errors: QuoteValidationResult['errors'] = {};
  const trimmedName = input.fullName.trim();
  if (trimmedName.length < 3) {
    errors.fullName = 'Iltimos, ism va familiyangizni to‘liq kiriting (kamida 3 ta harf).';
  }

  const digits = input.phone.replace(/\D/g, '');
  // Accept +998XXXXXXXXX (12 digits) or 9-digit local Uzbek number (e.g. 901234567)
  const isValidUzPhone =
    (digits.length === 12 && digits.startsWith('998')) || digits.length === 9;

  if (!isValidUzPhone) {
    errors.phone =
      'Iltimos, to‘g‘ri O‘zbekiston telefon raqamini kiriting (masalan: +998 90 123 45 67).';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function formatSom(amount: number): string {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' so‘m';
}
