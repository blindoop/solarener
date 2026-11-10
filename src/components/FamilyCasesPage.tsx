import React, { useState } from 'react';
import { formatSom, RegionId } from '../utils/solarPlanner';

export interface FamilyCaseStudy {
  id: string;
  familyTitle: string;
  headOfFamily: string;
  roleAndDistrict: string;
  regionId: RegionId;
  regionLabel: string;
  installedDate: string;
  systemKw: number;
  panelCount: number;
  batteryKwh: number;
  beforeMonthlySom: number;
  afterMonthlySom: number;
  sevenYearSavedSom: number;
  quote: string;
  imageUrl: string;
}

const FAMILY_CASES: FamilyCaseStudy[] = [
  {
    id: 'qibray-karimovlar',
    familyTitle: 'Karimovlar oilaviy hovlisi',
    headOfFamily: 'Rustam va Dilnoza Karimovlar',
    roleAndDistrict: 'Ikki qavatli kottej · Qibray tumani, Toshkent viloyati',
    regionId: 'toshkent',
    regionLabel: 'Toshkent',
    installedDate: '2026-yil mart',
    systemKw: 13.2,
    panelCount: 24,
    batteryKwh: 20,
    beforeMonthlySom: 1450000,
    afterMonthlySom: 0,
    sevenYearSavedSom: 121800000,
    quote:
      'Avval yozda uchta konditsioner va hovli nasosi ishlaganda oyiga 1,4 million so‘mdan ortiq to‘lardik. Lumen Roof o‘rnatilgach, 7 oydan beri hisobimiz 0 so‘m, hatto mahallada chiroq o‘chsa ham uyimiz yorug‘.',
    imageUrl:
      'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261102_040259_1be34093-835e-4de4-b3a8-f875e6a74591.png&w=1600&q=80',
  },
  {
    id: 'samarqand-usmonovlar',
    familyTitle: 'Usmonovlar xonadoni',
    headOfFamily: 'Alisher Usmonov (3 avlod oilasi)',
    roleAndDistrict: '8 xonali hovli · Toyloq tumani, Samarqand',
    regionId: 'samarqand',
    regionLabel: 'Samarqand',
    installedDate: '2026-yil yanvar',
    systemKw: 16.5,
    panelCount: 30,
    batteryKwh: 25,
    beforeMonthlySom: 1820000,
    afterMonthlySom: 0,
    sevenYearSavedSom: 152880000,
    quote:
      'Katta oilada elektromobil quvvatlash va issiq pol tizimi ko‘p elektr olardi. Aqlli kontroller kunduzgi ortiqcha energiyani tarmoqqa uzatib, kechasi batareyadan xonadonni to‘liq ta’minlayapti.',
    imageUrl:
      'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261102_040211_c8fd4865-285e-4c1f-8a37-4bfe0771357b.png&w=1600&q=80',
  },
  {
    id: 'buxoro-rahimovlar',
    familyTitle: 'Rahimovlar zamonaviy uyi',
    headOfFamily: 'Nodirbek va Gulchehra Rahimovlar',
    roleAndDistrict: 'Yangi mahalla · Kogon tumani, Buxoro',
    regionId: 'buxoro',
    regionLabel: 'Buxoro',
    installedDate: '2026-yil aprel',
    systemKw: 11.0,
    panelCount: 20,
    batteryKwh: 15,
    beforeMonthlySom: 1180000,
    afterMonthlySom: 0,
    sevenYearSavedSom: 99120000,
    quote:
      'Buxoroning jazirama yozida quyosh panellarimiz kuniga 62 kVt·soatgacha energiya bermoqda. 7 yillik 0 so‘m kafolat shartnomasi oilaviy byudjetimiz uchun eng to‘g‘ri qaror bo‘ldi.',
    imageUrl:
      'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261102_040259_1be34093-835e-4de4-b3a8-f875e6a74591.png&w=1600&q=80',
  },
  {
    id: 'fargona-Ergashevlar',
    familyTitle: 'Ergashevlar bog‘li xonadoni',
    headOfFamily: 'Farhod Ergashev',
    roleAndDistrict: 'Bog‘-hovli · Marg‘ilon shahri, Farg‘ona vodiysi',
    regionId: 'fargona',
    regionLabel: 'Farg‘ona',
    installedDate: '2026-yil may',
    systemKw: 9.9,
    panelCount: 18,
    batteryKwh: 15,
    beforeMonthlySom: 960000,
    afterMonthlySom: 0,
    sevenYearSavedSom: 80640000,
    quote:
      'Tomimiz ko‘rinishi zamonaviy qora metall bilan birlashib ketdi. Qishki tumanli kunlarda ham aqlli kontroller zaxirani oldindan to‘ldirib, uzluksiz elektr bermoqda.',
    imageUrl:
      'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261102_040211_c8fd4865-285e-4c1f-8a37-4bfe0771357b.png&w=1600&q=80',
  },
];

interface TiltCardProps {
  item: FamilyCaseStudy;
  isSelected: boolean;
  onSelect: () => void;
}

function Interactive3DTiltCard({ item, isSelected, onSelect }: TiltCardProps) {
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, gx: 50, gy: 50 });

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const ry = (x - 0.5) * 14;
    const rx = (0.5 - y) * 12;
    setTilt({ rx, ry, gx: Math.round(x * 100), gy: Math.round(y * 100) });
  };

  const handlePointerLeave = () => {
    setTilt({ rx: 0, ry: 0, gx: 50, gy: 50 });
  };

  return (
    <div
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{ perspective: '1100px' }}
      className="h-full"
    >
      <article
        style={{
          transform:
            tilt.rx === 0 && tilt.ry === 0
              ? 'none'
              : `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
          transition:
            tilt.rx === 0 && tilt.ry === 0
              ? 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)'
              : 'transform 0.08s linear',
        }}
        className={`
          relative h-full flex flex-col justify-between rounded-2xl p-4 sm:p-6
          bg-[#111c33] border transition-colors
          ${
            isSelected
              ? 'border-[#d8ee8e]'
              : 'border-white/10 hover:border-white/25'
          }
        `}
      >
        {/* Dynamic 3D Specular Sheen */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-30"
          style={{
            background: `radial-gradient(circle at ${tilt.gx}% ${tilt.gy}%, rgba(216, 238, 142, 0.22), transparent 60%)`,
          }}
        />

        <div>
          {/* 3D Lifted Image Thumbnail */}
          <div className="relative h-44 sm:h-48 w-full rounded-xl overflow-hidden mb-4 sm:mb-5 bg-[#0b1426]">
            <img
              src={item.imageUrl}
              alt={item.familyTitle}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
            <div className="absolute bottom-2.5 left-3 right-3 flex flex-wrap items-center justify-between gap-1 text-xs text-slate-200 tabular-nums">
              <span>
                {item.regionLabel} · {item.installedDate}
              </span>
              <span className="font-semibold text-[#d8ee8e]">
                {item.systemKw} kVt ({item.panelCount} ta panel)
              </span>
            </div>
          </div>

          {/* Unboxed Metadata Line */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">
            <span>{item.headOfFamily}</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#d8ee8e]/90">{item.batteryKwh} kVt·soat zaxira</span>
          </div>

          <h3 className="mt-1.5 text-lg sm:text-xl font-semibold text-white">
            {item.familyTitle}
          </h3>
          <p className="mt-0.5 text-xs text-slate-400">{item.roleAndDistrict}</p>

          <blockquote className="mt-3 sm:mt-4 text-xs sm:text-sm text-slate-200 leading-relaxed">
            “{item.quote}”
          </blockquote>
        </div>

        {/* Quantitative Before / After Strip */}
        <div className="mt-5 sm:mt-6 pt-4 border-t border-white/10">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs tabular-nums">
            <div>
              <span className="block text-slate-400">Avvalgi to‘lov</span>
              <span className="font-medium text-slate-300 line-through">
                {formatSom(item.beforeMonthlySom)}
              </span>
            </div>
            <div>
              <span className="block text-slate-400">Hozirgi to‘lov</span>
              <span className="font-semibold text-[#d8ee8e]">0 so‘m / oy</span>
            </div>
            <div className="col-span-2 sm:col-span-1 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-white/5">
              <span className="block text-slate-400">7 yillik tejash</span>
              <span className="font-semibold text-white">
                {formatSom(item.sevenYearSavedSom)}
              </span>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={onSelect}
              className="
                min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-medium
                bg-white/10 text-white hover:bg-white/20
                transition-colors whitespace-nowrap shrink-0
              "
            >
              {isSelected ? '3D pasport ochiq' : '3D texnik pasportni ko‘rish'}
            </button>
          </div>
        </div>
      </article>
    </div>
  );
}

interface FamilyCasesPageProps {
  initialFocus?: 'cases' | 'reviews';
  onNavigateQuote: () => void;
}

export default function FamilyCasesPage({
  initialFocus = 'cases',
  onNavigateQuote,
}: FamilyCasesPageProps) {
  const [regionFilter, setRegionFilter] = useState<'all' | RegionId>('all');
  const [selectedId, setSelectedId] = useState<string>(FAMILY_CASES[0].id);

  const filteredCases =
    regionFilter === 'all'
      ? FAMILY_CASES
      : FAMILY_CASES.filter((c) => c.regionId === regionFilter);

  const activeCase =
    FAMILY_CASES.find((c) => c.id === selectedId) ?? FAMILY_CASES[0];

  return (
    <section className="w-full bg-[#0b1426] text-white py-14 sm:py-20 px-4 sm:px-6 md:px-12 border-t border-white/10">
      <div className="max-w-6xl mx-auto">
        {/* Header & Region Filter Controls */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 sm:gap-6 pb-6 sm:pb-8 border-b border-white/10">
          <div>
            <p className="text-xs font-medium text-[#d8ee8e]">
              {initialFocus === 'reviews'
                ? '02. Oilalar fikri va real natijalar'
                : '02. O‘zbekiston bo‘ylab o‘rnatilgan xonadonlar'}
            </p>
            <h2 className="mt-1.5 sm:mt-2 text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-balance">
              1 420+ o‘zbek oilasi elektr to‘lovidan butunlay xalos bo‘ldi
            </h2>
            <p className="mt-2 text-sm md:text-base text-slate-300 max-w-2xl">
              Toshkentdan Buxorogacha bo‘lgan xonadonlarda 7 yillik rasmiy
              kafolat bilan ishlayotgan quyosh tomlari va oila boshliqlarining
              fikrlari.
            </p>
          </div>

          {/* Interactive Filter Controls */}
          <div
            role="group"
            aria-label="Hudud bo‘yicha saralash"
            className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-[#132038] border border-white/10 w-full lg:w-auto shrink-0"
          >
            {[
              { id: 'all', label: 'Barcha hududlar' },
              { id: 'toshkent', label: 'Toshkent' },
              { id: 'samarqand', label: 'Samarqand' },
              { id: 'buxoro', label: 'Buxoro' },
              { id: 'fargona', label: 'Farg‘ona' },
            ].map((tab) => {
              const active = regionFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setRegionFilter(tab.id as 'all' | RegionId)}
                  className={`
                    min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                    whitespace-nowrap shrink-0
                    ${
                      active
                        ? 'bg-[#d8ee8e] text-[#0d1626]'
                        : 'text-slate-300 hover:text-white'
                    }
                  `}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3D Perspective Tilt Cards Grid */}
        <div className="mt-6 sm:mt-8 grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {filteredCases.map((item) => (
            <Interactive3DTiltCard
              key={item.id}
              item={item}
              isSelected={activeCase.id === item.id}
              onSelect={() => setSelectedId(item.id)}
            />
          ))}
        </div>

        {/* Selected Family 3D Technical Passport & Call to Action */}
        <div className="mt-10 rounded-2xl bg-[#111c33] border border-white/15 p-6 md:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-xs text-[#d8ee8e] tabular-nums">
              <span>Tanlangan xonadon pasporti</span>
              <span aria-hidden="true">·</span>
              <span>{activeCase.familyTitle}</span>
              <span aria-hidden="true">·</span>
              <span>{activeCase.installedDate}</span>
            </div>
            <h3 className="text-xl md:text-2xl font-semibold text-white">
              {activeCase.panelCount} ta N-type monokristall panel +{' '}
              {activeCase.batteryKwh} kVt·soat LFP zaxira tizimi
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Ushbu xonadon 7 yil ichida jami{' '}
              <strong className="text-white tabular-nums">
                {formatSom(activeCase.sevenYearSavedSom)}
              </strong>{' '}
              mablag‘ni oila byudjetida saqlab qoladi. Har bir tizim 25 yillik
              panel quvvati kafolati bilan himoyalangan.
            </p>
          </div>

          <button
            type="button"
            onClick={onNavigateQuote}
            className="
              px-6 py-3 rounded-full text-sm font-semibold
              bg-[#d8ee8e] text-[#0d1626] hover:bg-[#e4f7a3]
              transition-transform hover:-translate-y-0.5 whitespace-nowrap shrink-0
            "
          >
            Shu xonadondek hisoblatish
          </button>
        </div>
      </div>
    </section>
  );
}
