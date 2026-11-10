import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateFamilySolarPlan,
  computeSunTelemetry,
  validateUzbekQuoteForm,
  formatSom,
} from './solarPlanner';

test('calculateFamilySolarPlan computes higher output in sunnier Bukhara than Tashkent', () => {
  const tashkentPlan = calculateFamilySolarPlan({
    regionId: 'toshkent',
    roofAreaSqm: 60,
    monthlyUsageKwh: 850,
    familyMembers: 6,
  });
  const bukharaPlan = calculateFamilySolarPlan({
    regionId: 'buxoro',
    roofAreaSqm: 60,
    monthlyUsageKwh: 850,
    familyMembers: 6,
  });

  assert.equal(tashkentPlan.panelCount, 25);
  assert.ok(bukharaPlan.dailyKwh > tashkentPlan.dailyKwh);
  assert.ok(tashkentPlan.sevenYearSavingsSom > 50_000_000);
  assert.equal(tashkentPlan.selfSufficiencyPct, 100);
});

test('computeSunTelemetry reflects midday solar generation and night battery discharge', () => {
  const noon = computeSunTelemetry(13, 11.0);
  const midnight = computeSunTelemetry(23, 11.0);

  assert.ok(noon.solarGenerationKw > 8.0);
  assert.equal(noon.flowDirection, 'charging');
  assert.equal(midnight.solarGenerationKw, 0);
  assert.equal(midnight.flowDirection, 'discharging');
});

test('validateUzbekQuoteForm validates Uzbek names and +998 phone numbers', () => {
  const invalid = validateUzbekQuoteForm({
    fullName: 'A',
    phone: '12345',
    regionId: 'toshkent',
    addressNote: '',
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.fullName);
  assert.ok(invalid.errors.phone);

  const valid = validateUzbekQuoteForm({
    fullName: 'Rustam Karimov',
    phone: '+998 90 123 45 67',
    regionId: 'samarqand',
    addressNote: 'Registon ko‘chasi',
  });
  assert.equal(valid.valid, true);
  assert.equal(Object.keys(valid.errors).length, 0);
});

test('formatSom formats large Uzbek som values with space separators', () => {
  assert.equal(formatSom(84500000), '84 500 000 so‘m');
});
