import { useState } from 'react';

export type InfoTab = 'about' | 'careers' | 'resources';

interface AboutCareersResourcesPageProps {
  activeTab: InfoTab;
  onTabChange: (tab: InfoTab) => void;
  onNavigateQuote: () => void;
}

const OPEN_ROLES = [
  {
    id: 'solar-architect-tashkent',
    title: 'Katta 3D Quyosh Tomi Muhandisi',
    location: 'Toshkent shahri · To‘liq stavka',
    department: 'Muhandislik va 3D loyihalash',
    summary:
      'Xonadon tomlarini 3D skanerlash, soyalanish tahlili va yuqori samarali monokristall massivlarni loyihalash.',
  },
  {
    id: 'installer-lead-samarkand',
    title: 'Montaj Guruhi Rahbari (Samarqand va Buxoro)',
    location: 'Samarqand shahri · Hududiy',
    department: 'O‘rnatish va xavfsizlik',
    summary:
      'Oilaviy kottejlar va hovlilarda 2 kun ichida xavfsiz, estetik quyosh tomlari hamda LFP batareyalarini o‘rnatish.',
  },
  {
    id: 'smart-grid-engineer',
    title: 'Aqlli Kontroller Dasturchisi (Embedded / IoT)',
    location: 'Toshkent / Masofaviy · To‘liq stavka',
    department: 'Lumen Smart Controller R&D',
    summary:
      'O‘zbekiston elektr tarmog‘i va ob-havo prognozlariga moslashuvchi sun’iy intellekt algoritmlarini takomillashtirish.',
  },
];

const RESOURCE_GUIDES = [
  {
    id: 'guide-7-year-zero',
    kicker: 'Huquqiy va texnik qo‘llanma · 2026',
    title: '7 yillik “0 so‘m elektr to‘lovi” kafolati qanday ishlaydi?',
    detail:
      'Lumen Smart Controller kunduzi ishlab chiqarilgan ortiqcha kilovattlarni hududiy elektr tarmog‘iga sotadi va tungi sarfni LFP zaxira batareyasidan qoplaydi. Agar yillik balansda farq yuzaga kelsa, kompaniyamiz shartnoma bo‘yicha uni to‘liq qoplaydi.',
  },
  {
    id: 'guide-winter-fog',
    kicker: 'Iqlim sinovi · Qish va tuman mavsumi',
    title: 'Qishki bulutli va tumanli kunlarda xonadon elektrsiz qolmaydimi?',
    detail:
      'Ikki tomonlama (Bifacial N-Type) kremniy hujayralar tarqoq kunduzgi yorug‘likdan ham energiya oladi. Aqlli kontroller ob-havo ma’lumotlarini 48 soat oldin tahlil qilib, batareya zaxirasini avtomatik ravishda 100% da ushlab turadi.',
  },
  {
    id: 'guide-uzbek-subsidy',
    kicker: 'Davlat imtiyozlari · Yashil energiya',
    title: 'O‘zbekistonda quyosh paneli o‘rnatgan oilalar uchun soliq imtiyozlari',
    detail:
      'Qayta tiklanuvchi energiya manbalarini o‘rnatgan jismoniy shaxslar mol-mulk va yer solig‘idan belgilangan muddatga imtiyoz oladilar hamda ortiqcha elektrni davlatga sotish huquqiga ega bo‘ladilar.',
  },
];

export default function AboutCareersResourcesPage({
  activeTab,
  onTabChange,
  onNavigateQuote,
}: AboutCareersResourcesPageProps) {
  const [explodedLayer, setExplodedLayer] = useState<number>(1);
  const [appliedRole, setAppliedRole] = useState<string | null>(null);
  const [openGuideId, setOpenGuideId] = useState<string>(RESOURCE_GUIDES[0].id);

  return (
    <section className="w-full bg-[#0b1426] text-white py-14 sm:py-20 px-4 sm:px-6 md:px-12 border-t border-white/10">
      <div className="max-w-6xl mx-auto">
        {/* Sub-Navigation Switcher */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 sm:gap-6 pb-5 sm:pb-8 border-b border-white/10">
          <div>
            <p className="text-xs font-medium text-[#d8ee8e]">
              03. Lumen Roof O‘zbekiston · Muhandislik va jamoa
            </p>
            <h2 className="mt-1.5 sm:mt-2 text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight">
              {activeTab === 'about' &&
                'Yiliga 310+ quyoshli kunga ega diyorimiz uchun yaratilgan'}
              {activeTab === 'careers' &&
                'O‘zbekistonning yashil energiya kelajagini birga quramiz'}
              {activeTab === 'resources' &&
                'Oilalar uchun texnik qo‘llanmalar va shaffof hisob-kitob'}
            </h2>
          </div>

          <div
            role="tablist"
            aria-label="Bo‘limlar"
            className="grid grid-cols-3 sm:flex items-center gap-1 p-1 rounded-xl bg-[#132038] border border-white/10 w-full sm:w-auto shrink-0"
          >
            {[
              { id: 'about', label: 'Biz haqimizda' },
              { id: 'careers', label: 'Karyera' },
              { id: 'resources', label: 'Manbalar' },
            ].map((t) => {
              const isOn = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={isOn}
                  type="button"
                  onClick={() => onTabChange(t.id as InfoTab)}
                  className={`
                    min-h-[38px] px-2 sm:px-4 py-2 rounded-lg text-xs font-medium transition-colors
                    whitespace-nowrap truncate text-center
                    ${
                      isOn
                        ? 'bg-[#d8ee8e] text-[#0d1626] font-semibold'
                        : 'text-slate-300 hover:text-white'
                    }
                  `}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* TAB 1: ABOUT US (with Interactive 3D Isometric Layer Stack) */}
        {activeTab === 'about' && (
          <div className="mt-6 sm:mt-10 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-between space-y-5 sm:space-y-6">
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-lg sm:text-2xl font-semibold text-white">
                  Oddiy panel emas — to‘liq integratsiyalashgan aqlli quyosh tomi
                </h3>
                <p className="text-xs sm:text-sm md:text-base text-slate-300 leading-relaxed">
                  Lumen Roof 2022-yilda Toshkentda muhandislar va energetika
                  mutaxassislari tomonidan tashkil etilgan. Maqsadimiz —
                  o‘zbek xonadonlarini tarif oshishlari va tarmoqdagi
                  uzilishlardan 100% mustaqil qilish.
                </p>
                <p className="text-xs sm:text-sm md:text-base text-slate-300 leading-relaxed">
                  Har bir panelimiz Yevropa va O‘zbekiston iqlim standartlariga
                  mos ravishda +55°C jazirama issiqda ham, qishki qirovda ham
                  yuqori Foydali Ish Koeffitsiyentini (23.4%) saqlab qoladi.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-5 sm:pt-6 border-t border-white/10 tabular-nums">
                <div>
                  <span className="block text-lg sm:text-2xl md:text-3xl font-semibold text-[#d8ee8e]">
                    1 420+
                  </span>
                  <span className="text-[11px] sm:text-xs text-slate-400 leading-tight block mt-0.5">
                    Oilaviy xonadonlar
                  </span>
                </div>
                <div>
                  <span className="block text-lg sm:text-2xl md:text-3xl font-semibold text-white">
                    18.6 MVt
                  </span>
                  <span className="text-[11px] sm:text-xs text-slate-400 leading-tight block mt-0.5">
                    Ishga tushgan quvvat
                  </span>
                </div>
                <div>
                  <span className="block text-lg sm:text-2xl md:text-3xl font-semibold text-[#d8ee8e]">
                    7 yil
                  </span>
                  <span className="text-[11px] sm:text-xs text-slate-400 leading-tight block mt-0.5">
                    0 so‘m to‘lov kafolati
                  </span>
                </div>
              </div>
            </div>

            {/* Interactive 3D Isometric Layer Stack Visualizer + Clear Mobile Legend */}
            <div className="lg:col-span-6 rounded-2xl bg-[#111c33] border border-white/10 p-4 sm:p-6 flex flex-col justify-between overflow-hidden">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs text-[#d8ee8e]">
                    Interaktiv 3D Kesma
                  </span>
                  <h4 className="text-sm sm:text-lg font-semibold text-white">
                    Lumen Roof 4-qatlamli himoya arxitekturasi
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setExplodedLayer((prev) => (prev === 1 ? 1.85 : 1))
                  }
                  className="min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/20 text-white whitespace-nowrap shrink-0"
                >
                  {explodedLayer > 1 ? 'Yig‘ish' : '3D Yoyish'}
                </button>
              </div>

              <div
                className="relative h-44 sm:h-52 my-2 flex items-center justify-center scale-[0.74] sm:scale-95"
                style={{ perspective: '900px' }}
              >
                {[
                  {
                    idx: 3,
                    badge: '01 · Kvarts oyna (3.2 mm)',
                    color: 'rgba(138, 196, 255, 0.35)',
                    border: '#8ac4ff',
                  },
                  {
                    idx: 2,
                    badge: '02 · N-Type Kremniy (23.4%)',
                    color: 'rgba(30, 64, 128, 0.82)',
                    border: '#d8ee8e',
                  },
                  {
                    idx: 1,
                    badge: '03 · Gidroizolyatsiya qatlami',
                    color: 'rgba(42, 56, 78, 0.9)',
                    border: '#64748b',
                  },
                  {
                    idx: 0,
                    badge: '04 · Po‘lat tayanch karkas',
                    color: 'rgba(20, 28, 42, 0.96)',
                    border: '#475569',
                  },
                ].map((layer) => {
                  const zOffset = (layer.idx - 1.5) * 32 * explodedLayer;
                  return (
                    <div
                      key={layer.idx}
                      style={{
                        transform: `rotateX(56deg) rotateZ(-28deg) translateZ(${zOffset}px)`,
                        backgroundColor: layer.color,
                        borderColor: layer.border,
                        transition:
                          'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                      className="absolute w-60 sm:w-68 h-32 rounded-xl border-2 flex items-end p-3 shadow-xl"
                    >
                      <span className="text-xs font-semibold text-white drop-shadow">
                        {layer.badge}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Un-skewed, 100% legible layer list for phone & tablet screens */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-white/10 text-xs text-slate-200">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#8ac4ff] shrink-0" />
                  <span>1. Toblangan anti-reflektiv kvarts oyna</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#d8ee8e] shrink-0" />
                  <span>2. N-Type monokristall hujayralar (23.4%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                  <span>3. Issiqlik qaytaruvchi gidroizolyatsiya</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-slate-600 shrink-0" />
                  <span>4. Anodlangan qora po‘lat tom karkasi</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CAREERS */}
        {activeTab === 'careers' && (
          <div className="mt-8 space-y-4">
            {OPEN_ROLES.map((role) => {
              const isApplied = appliedRole === role.id;
              return (
                <div
                  key={role.id}
                  className="rounded-2xl bg-[#111c33] border border-white/10 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex items-center gap-2 text-xs text-[#d8ee8e]">
                      <span>{role.department}</span>
                      <span aria-hidden="true">·</span>
                      <span>{role.location}</span>
                    </div>
                    <h3 className="text-xl font-semibold text-white">
                      {role.title}
                    </h3>
                    <p className="text-sm text-slate-300">{role.summary}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setAppliedRole(role.id)}
                    className={`
                      px-5 py-2.5 rounded-xl text-xs font-semibold transition-colors
                      whitespace-nowrap shrink-0
                      ${
                        isApplied
                          ? 'bg-emerald-500/20 text-[#d8ee8e] border border-[#d8ee8e]/40'
                          : 'bg-[#d8ee8e] text-[#0d1626] hover:bg-[#e5f6a8]'
                      }
                    `}
                  >
                    {isApplied
                      ? 'Rezyume qabul qilindi (HR bog‘lanadi)'
                      : 'Vakansiyaga ariza topshirish'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 3: RESOURCES */}
        {activeTab === 'resources' && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-4">
              {RESOURCE_GUIDES.map((g) => {
                const isOpen = openGuideId === g.id;
                return (
                  <div
                    key={g.id}
                    className="rounded-2xl bg-[#111c33] border border-white/10 p-6"
                  >
                    <p className="text-xs text-[#d8ee8e]">{g.kicker}</p>
                    <button
                      type="button"
                      onClick={() => setOpenGuideId(g.id)}
                      className="mt-1 w-full text-left flex items-center justify-between gap-4"
                    >
                      <h3 className="text-lg font-semibold text-white">
                        {g.title}
                      </h3>
                      <span className="text-xs text-slate-400 shrink-0">
                        {isOpen ? 'Yopish' : 'O‘qish'}
                      </span>
                    </button>
                    {isOpen && (
                      <p className="mt-3 pt-3 border-t border-white/10 text-sm text-slate-300 leading-relaxed">
                        {g.detail}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="lg:col-span-5 rounded-2xl bg-[#111c33] border border-white/15 p-6 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <p className="text-xs text-[#d8ee8e]">
                  Shaxsiy xonadon hisob-kitobi
                </p>
                <h3 className="text-2xl font-semibold text-white">
                  Xonadoningiz tomi qancha elektr ishlab chiqarishini bilmoqchimisiz?
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Hududingiz va oylik elektr sarfingizni kiriting — 30 soniyada
                  kerakli panellar soni va 7 yillik tejash summasini hisoblab
                  beramiz.
                </p>
              </div>
              <button
                type="button"
                onClick={onNavigateQuote}
                className="w-full py-3 rounded-xl text-sm font-semibold bg-[#d8ee8e] text-[#0d1626] hover:bg-[#e5f6a8] transition-colors"
              >
                Kalkulyatorga o‘tish
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
