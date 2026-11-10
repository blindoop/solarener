import React, { useState } from 'react';
import {
  calculateFamilySolarPlan,
  formatSom,
  RegionId,
  UZBEK_REGIONS,
  validateUzbekQuoteForm,
} from '../utils/solarPlanner';

export default function QuoteCalculatorPage() {
  const [regionId, setRegionId] = useState<RegionId>('toshkent');
  const [roofAreaSqm, setRoofAreaSqm] = useState<number>(65);
  const [monthlyUsageKwh, setMonthlyUsageKwh] = useState<number>(750);
  const [familyMembers, setFamilyMembers] = useState<number>(5);

  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [addressNote, setAddressNote] = useState<string>('');
  const [errors, setErrors] = useState<{ fullName?: string; phone?: string }>(
    {}
  );
  const [submittedPlan, setSubmittedPlan] = useState<{
    fullName: string;
    phone: string;
    regionName: string;
    systemKw: number;
    sevenYearSavingsSom: number;
  } | null>(null);

  const plan = calculateFamilySolarPlan({
    regionId,
    roofAreaSqm,
    monthlyUsageKwh,
    familyMembers,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateUzbekQuoteForm({
      fullName,
      phone,
      regionId,
      addressNote,
    });
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    setErrors({});
    setSubmittedPlan({
      fullName: fullName.trim(),
      phone: phone.trim(),
      regionName: UZBEK_REGIONS[regionId].name,
      systemKw: plan.systemKw,
      sevenYearSavingsSom: plan.sevenYearSavingsSom,
    });
  };

  return (
    <section className="w-full bg-[#0b1426] text-white py-14 sm:py-20 px-4 sm:px-6 md:px-12 border-t border-white/10">
      <div className="max-w-6xl mx-auto">
        <div className="pb-5 sm:pb-8 border-b border-white/10">
          <p className="text-xs font-medium text-[#d8ee8e]">
            04. Oilaviy 3D Kalkulyator va Bepul O‘lchov Arizasi
          </p>
          <h2 className="mt-1.5 sm:mt-2 text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight">
            Xonadoningiz uchun 7 yillik 0 so‘m rejasini hisoblang
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-2xl">
            Hududingiz va tom maydonini belgilang — tizim real vaqtda 3D
            panellar joylashuvini va oilaviy tejamkorlikni hisoblaydi.
          </p>
        </div>

        <div className="mt-6 sm:mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          {/* Left Column: Sliders & Live 3D Isometric Roof Preview */}
          <div className="lg:col-span-7 space-y-5 sm:space-y-6 rounded-2xl bg-[#111c33] border border-white/10 p-4 sm:p-6 md:p-8">
            {/* Region Selector */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Hududingizni tanlang
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(Object.keys(UZBEK_REGIONS) as RegionId[]).map((rKey) => {
                  const active = regionId === rKey;
                  return (
                    <button
                      key={rKey}
                      type="button"
                      onClick={() => setRegionId(rKey)}
                      className={`
                        min-h-[42px] px-3 py-2 rounded-xl text-xs font-medium transition-colors
                        whitespace-nowrap truncate
                        ${
                          active
                            ? 'bg-[#d8ee8e] text-[#0d1626] font-semibold'
                            : 'bg-[#0b1426] text-slate-300 border border-white/10 hover:border-white/25'
                        }
                      `}
                    >
                      {rKey === 'toshkent' && 'Toshkent'}
                      {rKey === 'samarqand' && 'Samarqand'}
                      {rKey === 'buxoro' && 'Buxoro'}
                      {rKey === 'fargona' && 'Farg‘ona'}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-slate-400 tabular-nums">
                {UZBEK_REGIONS[regionId].name} · Yiliga{' '}
                {UZBEK_REGIONS[regionId].sunnyDays} quyoshli kun · Kunlik pik:{' '}
                {UZBEK_REGIONS[regionId].peakSunHours} soat
              </p>
            </div>

            {/* Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 pt-1">
              <div>
                <div className="flex justify-between text-xs mb-1.5 tabular-nums">
                  <label htmlFor="roof-area-range" className="text-slate-300">
                    Tom maydoni
                  </label>
                  <strong className="text-[#d8ee8e]">{roofAreaSqm} m²</strong>
                </div>
                <input
                  id="roof-area-range"
                  type="range"
                  min={24}
                  max={160}
                  step={4}
                  value={roofAreaSqm}
                  onChange={(e) => setRoofAreaSqm(Number(e.target.value))}
                  className="w-full h-6 accent-[#d8ee8e] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5 tabular-nums">
                  <label htmlFor="usage-range" className="text-slate-300">
                    Oylik elektr sarfi
                  </label>
                  <strong className="text-[#d8ee8e]">
                    {monthlyUsageKwh} kVt·s
                  </strong>
                </div>
                <input
                  id="usage-range"
                  type="range"
                  min={250}
                  max={2000}
                  step={50}
                  value={monthlyUsageKwh}
                  onChange={(e) => setMonthlyUsageKwh(Number(e.target.value))}
                  className="w-full h-6 accent-[#d8ee8e] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5 tabular-nums">
                  <label htmlFor="family-range" className="text-slate-300">
                    Oila a’zolari
                  </label>
                  <strong className="text-[#d8ee8e]">
                    {familyMembers} kishi
                  </strong>
                </div>
                <input
                  id="family-range"
                  type="range"
                  min={2}
                  max={12}
                  step={1}
                  value={familyMembers}
                  onChange={(e) => setFamilyMembers(Number(e.target.value))}
                  className="w-full h-6 accent-[#d8ee8e] cursor-pointer"
                />
              </div>
            </div>

            {/* Live 3D Isometric Solar Roof Preview */}
            <div
              className="relative h-52 rounded-xl bg-[#0b1426] border border-white/10 overflow-hidden flex items-center justify-center pb-8 sm:pb-0"
              style={{ perspective: '800px' }}
            >
              <div
                style={{
                  transform: 'rotateX(52deg) rotateZ(-18deg)',
                  transformStyle: 'preserve-3d',
                }}
                className="grid grid-cols-6 gap-1.5 p-3 rounded-lg bg-[#162238] border border-white/20 shadow-2xl scale-90 sm:scale-100"
              >
                {Array.from({ length: Math.min(24, plan.panelCount) }).map(
                  (_, idx) => (
                    <div
                      key={idx}
                      className="w-8 h-5 rounded-sm bg-gradient-to-br from-[#1d4ed8] to-[#0f172a] border border-[#93c5fd]/40"
                    />
                  )
                )}
              </div>
              <div className="absolute bottom-2.5 left-3 right-3 flex flex-col sm:flex-row sm:items-center justify-between gap-0.5 text-[11px] sm:text-xs text-slate-300 tabular-nums">
                <span>
                  3D Tom massivi: <strong>{plan.panelCount} ta panel</strong>
                </span>
                <span className="text-[#d8ee8e] font-semibold">
                  Quvvat: {plan.systemKw} kVt · Zaxira: {plan.batteryKwh} kVt·soat
                </span>
              </div>
            </div>

            {/* Calculated 7-Year Savings Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-1 tabular-nums">
              <div className="p-3.5 sm:p-4 rounded-xl bg-[#0b1426] border border-white/10 flex sm:block items-center justify-between">
                <span className="block text-xs text-slate-400">
                  Oylik ishlab chiqarish
                </span>
                <span className="sm:mt-1 block text-base sm:text-xl font-semibold text-white">
                  {plan.monthlyKwh} kVt·soat
                </span>
              </div>
              <div className="p-3.5 sm:p-4 rounded-xl bg-[#0b1426] border border-white/10 flex sm:block items-center justify-between">
                <span className="block text-xs text-slate-400">
                  Yillik tejamkorlik
                </span>
                <span className="sm:mt-1 block text-base sm:text-xl font-semibold text-white">
                  {formatSom(plan.annualSavingsSom)}
                </span>
              </div>
              <div className="p-3.5 sm:p-4 rounded-xl bg-[#0b1426] border border-[#d8ee8e]/40 flex sm:block items-center justify-between">
                <span className="block text-xs text-[#d8ee8e]">
                  7 yillik foyda
                </span>
                <span className="sm:mt-1 block text-base sm:text-xl font-semibold text-[#d8ee8e]">
                  {formatSom(plan.sevenYearSavingsSom)}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Validated Uzbek Lead Capture Form */}
          <div className="lg:col-span-5 rounded-2xl bg-[#111c33] border border-white/15 p-5 sm:p-6 md:p-8">
            {submittedPlan ? (
              <div
                data-testid="quote-confirmation"
                className="space-y-4 py-4"
              >
                <p className="text-xs font-semibold text-[#d8ee8e]">
                  Arizangiz muvaffaqiyatli qabul qilindi
                </p>
                <h3 className="text-2xl font-semibold text-white">
                  Rahmat, {submittedPlan.fullName}!
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Muhandisimiz <strong>{submittedPlan.phone}</strong> raqami
                  orqali siz bilan bog‘lanib,{' '}
                  <strong>{submittedPlan.regionName}</strong> hududidagi
                  xonadoningiz uchun bepul 3D dron o‘lchov vaqtini belgilaydi.
                </p>
                <div className="p-4 rounded-xl bg-[#0b1426] border border-white/10 text-xs space-y-1.5 tabular-nums">
                  <div>
                    Tanlangan tizim quvvati:{' '}
                    <strong className="text-white">
                      {submittedPlan.systemKw} kVt
                    </strong>
                  </div>
                  <div>
                    7 yillik hisoblangan tejamkorlik:{' '}
                    <strong className="text-[#d8ee8e]">
                      {formatSom(submittedPlan.sevenYearSavingsSom)}
                    </strong>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSubmittedPlan(null);
                    setFullName('');
                    setPhone('');
                    setAddressNote('');
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/20 text-white"
                >
                  Yangi hisob-kitob qilish
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <h3 className="text-xl font-semibold text-white">
                  Bepul 3D o‘lchov va shartnoma uchun ariza
                </h3>
                <p className="text-xs text-slate-400">
                  Mutaxassisimiz xonadoningizga bepul tashrif buyurib, aniq 3D
                  loyiha tayyorlab beradi.
                </p>

                <div>
                  <label
                    htmlFor="quote-fullname"
                    className="block text-xs font-medium text-slate-200 mb-1.5"
                  >
                    Ism va familiyangiz
                  </label>
                  <input
                    id="quote-fullname"
                    type="text"
                    placeholder="Masalan: Rustam Karimov"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b1426] border border-white/15 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#d8ee8e]"
                  />
                  {errors.fullName && (
                    <p
                      role="alert"
                      className="mt-1.5 text-xs text-amber-300"
                    >
                      {errors.fullName}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="quote-phone"
                    className="block text-xs font-medium text-slate-200 mb-1.5"
                  >
                    Telefon raqamingiz
                  </label>
                  <input
                    id="quote-phone"
                    type="tel"
                    placeholder="+998 90 123 45 67"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b1426] border border-white/15 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#d8ee8e]"
                  />
                  {errors.phone && (
                    <p
                      role="alert"
                      className="mt-1.5 text-xs text-amber-300"
                    >
                      {errors.phone}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="quote-address"
                    className="block text-xs font-medium text-slate-200 mb-1.5"
                  >
                    Tuman yoki mahalla (ixtiyoriy)
                  </label>
                  <input
                    id="quote-address"
                    type="text"
                    placeholder="Masalan: Qibray tumani, Chinobod MFY"
                    value={addressNote}
                    onChange={(e) => setAddressNote(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b1426] border border-white/15 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#d8ee8e]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl text-sm font-semibold bg-[#d8ee8e] text-[#0d1626] hover:bg-[#e5f6a8] transition-colors"
                >
                  Bepul 3D loyiha buyurtma qilish
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
