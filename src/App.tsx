/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  createInitialClockState,
  beginTransition,
  stepFrame,
} from './utils/fogClock';
import Solar3DStudioPage from './components/Solar3DStudioPage';
import FamilyCasesPage from './components/FamilyCasesPage';
import AboutCareersResourcesPage, {
  InfoTab,
} from './components/AboutCareersResourcesPage';
import QuoteCalculatorPage from './components/QuoteCalculatorPage';

const RAY_ANGLES = [30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

export type ActivePage =
  | 'hero'
  | 'how-it-works'
  | 'cases'
  | 'reviews'
  | 'about'
  | 'careers'
  | 'resources'
  | 'quote';

export default function App() {
  const [activePage, setActivePage] = useState<ActivePage>('hero');
  const [infoTab, setInfoTab] = useState<InfoTab>('about');
  const [casesFocus, setCasesFocus] = useState<'cases' | 'reviews'>('cases');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [scrolledPastHero, setScrolledPastHero] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const setMRef = useRef<HTMLDivElement | null>(null);
  const setNRef = useRef<HTMLDivElement | null>(null);
  const bmRef = useRef<HTMLButtonElement | null>(null);
  const bnRef = useRef<HTMLButtonElement | null>(null);

  const stateRef = useRef(createInitialClockState());
  const clockRef = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      setScrolledPastHero(window.scrollY > window.innerHeight * 0.72);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navigate = (page: ActivePage, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setActivePage(page);
    setMobileMenuOpen(false);

    if (page === 'about' || page === 'careers' || page === 'resources') {
      setInfoTab(page);
    }
    if (page === 'cases' || page === 'reviews') {
      setCasesFocus(page);
    }

    const sectionMap: Record<ActivePage, string> = {
      hero: 'top',
      'how-it-works': 'qanday-ishlaydi',
      cases: 'xonadonlarimiz',
      reviews: 'xonadonlarimiz',
      about: 'biz-haqimizda',
      careers: 'biz-haqimizda',
      resources: 'biz-haqimizda',
      quote: 'bepul-hisoblatish',
    };

    const el = document.getElementById(sectionMap[page]);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (page === 'hero') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const show = (n: number) => {
    setMRef.current?.classList.toggle('is-on', !n);
    setNRef.current?.classList.toggle('is-on', !!n);
  };

  const pick = (n: number) => {
    const st = stateRef.current;
    if (n === st.target && st.queued === null) return;
    bmRef.current?.setAttribute('aria-pressed', String(!n));
    bnRef.current?.setAttribute('aria-pressed', String(!!n));

    const calm = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
    if (calm) {
      st.target = st.night = n;
      st.k = n;
      show(n);
      const root = document.documentElement.style;
      root.setProperty('--sink', '0.0px');
      root.setProperty('--k', st.k.toFixed(3));
      root.setProperty('--k2', st.k.toFixed(3));
      root.setProperty('--dip', '0.000');
      return;
    }
    if (st.animating) {
      st.queued = n;
    } else {
      beginTransition(st, n, clockRef.current);
    }
  };

  useEffect(() => {
    const root = document.documentElement.style;
    const cv = canvasRef.current;
    if (!cv) return;

    const gl = cv.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
    });

    const U: Record<string, WebGLUniformLocation | null> = {};

    if (gl) {
      const vs = `#version 300 es
      void main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(p*2.-1.,0,1);}`;
      const fs = `#version 300 es
      precision highp float;
      uniform vec2 R;uniform float T,S,K;out vec4 O;
      float h(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
      float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
        return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
      float fbm(vec2 p){float a=.5,s=0.;mat2 m=mat2(1.6,1.2,-1.2,1.6);p=mat2(.8,.6,-.6,.8)*p+5.3;for(int i=0;i<5;i++){s+=a*n(p);p=m*p;a*=.5;}return s;}
      void main(){
        vec2 uv=gl_FragCoord.xy/R;uv.y=1.-uv.y;
        float asp=R.x/R.y;vec2 p=vec2(uv.x*asp,uv.y);
        float t=T*.05;
        vec2 w=vec2(fbm(p*1.3+vec2(t,-t*.6)),fbm(p*1.3+vec2(-t*.8,t)+7.));
        float d=fbm(p*1.9+w*1.7+vec2(t*1.6,-t*1.1+S*.5));
        float e=fbm(p*.9-w+vec2(-t,t*.5)+3.);
        float low=smooth2(.70,1.04,uv.y+(d-.5)*.34);
        float side=smooth2(.2,.0,uv.x+(e-.5)*.28)+smooth2(.8,1.,uv.x+(e-.5)*.28);
        side*=smooth2(.25,.6,uv.y)*.2;
        float wisps=smooth2(.5,.78,d)*smooth2(.22,.5,uv.y)*smooth2(.86,.6,uv.y)*.18;
        float rest=clamp(low+side+wisps,0.,1.);
        float front=1.02-S*.68;
        float rise=smooth2(front-.02,front+.26,uv.y+(d-.5)*.5);
        float haze=S*(.3+.46*d);
        float a=clamp(max(rest,max(rise*.97,haze)),0.,1.);
        vec3 dayA=vec3(.97,.93,.84),dayB=vec3(.79,.78,.71);
        vec3 nitA=vec3(.40,.45,.57),nitB=vec3(.15,.19,.29);
        vec3 c=mix(mix(dayB,dayA,d*1.15),mix(nitB,nitA,d*1.1),K);
        float porch=exp(-dot((uv-vec2(.72,.74))*vec2(1.7,2.6),(uv-vec2(.72,.74))*vec2(1.7,2.6))*3.2);
        c=mix(c,vec3(.86,.55,.27),K*porch*.42*(1.-S));
        O=vec4(c*a,a);
      }`.replace(/smooth2/g, 'smoothstep');

      const sh = (t: number, s: string) => {
        const o = gl.createShader(t)!;
        gl.shaderSource(o, s);
        gl.compileShader(o);
        if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) {
          console.error(gl.getShaderInfoLog(o));
        }
        return o;
      };

      const pr = gl.createProgram()!;
      gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs));
      gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs));
      gl.linkProgram(pr);
      gl.useProgram(pr);
      for (const u of ['R', 'T', 'S', 'K']) {
        U[u] = gl.getUniformLocation(pr, u);
      }
    }

    const size = () => {
      if (!gl) return;
      const w = Math.round(Math.min(window.innerWidth, 960));
      const h = Math.round((w * window.innerHeight) / window.innerWidth);
      if (cv.width !== w || cv.height !== h) {
        cv.width = w;
        cv.height = h;
        gl.viewport(0, 0, w, h);
      }
    };

    window.addEventListener('resize', size);
    size();

    let rafId = 0;
    const frame = (now: number) => {
      clockRef.current = now;
      if (window.scrollY < window.innerHeight * 1.15 || stateRef.current.animating) {
        const out = stepFrame(stateRef.current, now);
        if (out.didSwap) {
          show(out.swapTarget);
        }
        root.setProperty(
          '--sink',
          (out.y * window.innerHeight).toFixed(1) + 'px'
        );
        root.setProperty('--k', out.k.toFixed(3));
        root.setProperty('--k2', out.k2.toFixed(3));
        root.setProperty('--dip', out.dip.toFixed(3));

        if (gl) {
          gl.uniform2f(U.R, cv.width, cv.height);
          gl.uniform1f(U.T, now / 1000);
          gl.uniform1f(U.S, out.s);
          gl.uniform1f(U.K, out.k);
          gl.drawArrays(gl.TRIANGLES, 0, 3);
        }
      }
    };

    const loop = (t: number) => {
      frame(t);
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', size);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="w-full min-h-screen bg-[#0b1426]">
      {/* SECTION 0: EXACT 100SVH MORNING / NIGHT FOG HERO */}
      <main className="hero" id="top">
        <div className="layer sky">
          <img
            id="skyM"
            alt=""
            src="https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261102_040343_a73684b4-3f71-4613-a843-c8be80fb1211.png&w=1600&q=80"
          />
          <img
            id="skyN"
            alt=""
            src="https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261102_040308_f31964ab-ed8e-4ea4-90eb-3226c0859936.png&w=1600&q=80"
          />
        </div>
        <div className="layer home">
          <div className="set" id="setM" ref={setMRef}>
            <div className="layer ground">
              <img
                alt=""
                src="https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261102_040259_1be34093-835e-4de4-b3a8-f875e6a74591.png&w=2560&q=85"
              />
            </div>
            <img
              className="cut"
              alt="Yumshoq tong yorug‘ligida quyosh panelli zamonaviy oilaviy xonadon"
              src="https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261102_040416_e3b05fa4-cc80-4a43-afde-8a0a053933e9.png&w=2560&q=85"
            />
          </div>
          <div className="set is-on" id="setN" ref={setNRef}>
            <div className="layer ground">
              <img
                alt=""
                src="https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261102_040211_c8fd4865-285e-4c1f-8a37-4bfe0771357b.png&w=2560&q=85"
              />
            </div>
            <img
              className="cut"
              alt="Oqshom chog‘ida derazalari iliq porlab turgan oilaviy xonadon"
              src="https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261102_040415_2ab95096-8c39-449f-b36c-17c2813815a4.png&w=2560&q=85"
            />
          </div>
        </div>
        <div className="tilt"></div>
        <canvas id="fog" ref={canvasRef} aria-hidden="true"></canvas>

        {/* HERO FOREGROUND UI */}
        <div className="ui">
          <header className="bar">
            <a
              className="logo"
              href="#top"
              aria-label="Lumen Roof"
              onClick={(e) => navigate('hero', e)}
            >
              <svg viewBox="0 0 40 40" aria-hidden="true">
                <g fill="color-mix(in srgb,#6d8f2a calc((1 - var(--k))*100%),#d8ee8e)">
                  <circle cx="20" cy="20" r="0" />
                  <path id="ray" d="M18.3 3.5h3.4l.9 8.4h-5.2Z" />
                  {RAY_ANGLES.map((deg) => (
                    <use
                      key={deg}
                      href="#ray"
                      transform={`rotate(${deg} 20 20)`}
                    />
                  ))}
                </g>
              </svg>
              Lumen Roof
            </a>
            <ul className="links">
              <li>
                <a
                  href="#qanday-ishlaydi"
                  onClick={(e) => navigate('how-it-works', e)}
                >
                  Qanday ishlaydi
                </a>
              </li>
              <li>
                <a
                  href="#xonadonlarimiz"
                  onClick={(e) => navigate('cases', e)}
                >
                  Xonadonlarimiz
                </a>
              </li>
              <li>
                <a
                  href="#biz-haqimizda"
                  onClick={(e) => navigate('about', e)}
                >
                  Biz haqimizda
                </a>
              </li>
              <li>
                <a
                  href="#karyera"
                  onClick={(e) => navigate('careers', e)}
                >
                  Karyera
                </a>
              </li>
              <li>
                <a
                  href="#manbalar"
                  onClick={(e) => navigate('resources', e)}
                >
                  Manbalar
                </a>
              </li>
            </ul>
            <div className="side">
              <a
                href="#oilalar-fikri"
                onClick={(e) => navigate('reviews', e)}
              >
                Oilalar fikri
              </a>
              <button
                type="button"
                aria-label="Sahifalar menyusi"
                aria-expanded={mobileMenuOpen}
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="mobile-menu-btn"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  {mobileMenuOpen ? (
                    <path
                      d="M3.5 3.5L12.5 12.5M12.5 3.5L3.5 12.5"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  ) : (
                    <path
                      d="M2.5 4.5H13.5M2.5 8H13.5M2.5 11.5H13.5"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  )}
                </svg>
                <span>{mobileMenuOpen ? 'Yopish' : 'Bo‘limlar'}</span>
              </button>
              <a
                className="cta"
                href="#bepul-hisoblatish"
                onClick={(e) => navigate('quote', e)}
              >
                Bepul hisoblatish
              </a>
            </div>
          </header>

          <h1 className="hero-h1">
            <span className="l1">0 so‘m elektr to‘lovi</span>
            <span>
              <i>keyingi</i> <span className="y">7 yilga</span>
            </span>
          </h1>

          <div className="dock">
            <div className="toggle" role="group" aria-label="Kun vaqti">
              <button
                id="bm"
                ref={bmRef}
                type="button"
                aria-pressed="false"
                onClick={() => pick(0)}
              >
                <b>Tong</b>
                <small>Elektr uchun 0 so‘m</small>
              </button>
              <button
                id="bn"
                ref={bnRef}
                type="button"
                aria-pressed="true"
                onClick={() => pick(1)}
              >
                <b>Tun</b>
                <small>Elektr uchun 0 so‘m</small>
              </button>
            </div>
            <p className="cap">
              Elektr tariflari, ob-havo injiqliklari va fasllarni unuting.
              Aqlli <br />
              kontrollerimiz xonadoningizga yetti yil bepul elektrni
              kafolatlaydi.
            </p>
          </div>
        </div>
      </main>

      {/* FLOATING STICKY TOP BAR WHEN SCROLLED PAST HERO */}
      {scrolledPastHero && (
        <header className="fixed top-0 left-0 right-0 z-40 bg-[#0b1426]/95 backdrop-blur-md border-b border-white/10 px-4 sm:px-8 py-2.5 flex items-center justify-between gap-3 text-white shadow-xl">
          <a
            href="#top"
            onClick={(e) => navigate('hero', e)}
            className="flex items-center gap-2 font-medium text-base text-white whitespace-nowrap"
          >
            <svg width="22" height="22" viewBox="0 0 40 40" aria-hidden="true">
              <g fill="#d8ee8e">
                <path id="ray-sticky" d="M18.3 3.5h3.4l.9 8.4h-5.2Z" />
                {RAY_ANGLES.map((deg) => (
                  <use
                    key={deg}
                    href="#ray-sticky"
                    transform={`rotate(${deg} 20 20)`}
                  />
                ))}
              </g>
            </svg>
            <span>Lumen Roof</span>
          </a>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="min-h-[34px] px-3 py-1 rounded-full text-xs font-medium bg-white/10 border border-white/20 text-white"
            >
              {mobileMenuOpen ? '✕ Yopish' : '☰ Bo‘limlar'}
            </button>
            <button
              type="button"
              onClick={() => navigate('quote')}
              className="min-h-[34px] px-3.5 py-1 rounded-full text-xs font-semibold bg-[#d8ee8e] text-[#0d1626]"
            >
              Hisoblatish
            </button>
          </div>
        </header>
      )}

      {/* FIXED MODAL MOBILE & TABLET NAVIGATION DRAWER */}
      {mobileMenuOpen && (
        <>
          <div
            aria-hidden="true"
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 z-40 bg-black/65 backdrop-blur-xs"
          />
          <nav
            aria-label="Mobil navigatsiya"
            className="fixed top-[58px] left-3 right-3 z-50 max-w-md mx-auto"
          >
            <div className="rounded-2xl bg-[#0d1626] border border-white/20 p-3 shadow-2xl grid grid-cols-2 gap-2 text-white">
              {[
                { id: 'hero', label: 'Asosiy sahifa', sub: 'Tong va Tun rejimi' },
                { id: 'how-it-works', label: 'Qanday ishlaydi', sub: '3D Quyosh tizimi' },
                { id: 'cases', label: 'Xonadonlarimiz', sub: '1 420+ o‘zbek oilasi' },
                { id: 'reviews', label: 'Oilalar fikri', sub: 'Real natijalar' },
                { id: 'about', label: 'Biz haqimizda', sub: '4-qatlamli 3D tom' },
                { id: 'careers', label: 'Karyera', sub: 'Bo‘sh ish o‘rinlari' },
                { id: 'resources', label: 'Manbalar', sub: '7 yillik kafolat' },
                { id: 'quote', label: '3D Kalkulyator', sub: 'Bepul hisoblatish' },
              ].map((item) => {
                const active = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigate(item.id as ActivePage)}
                    className={`
                      min-h-[48px] px-3 py-2 rounded-xl text-left
                      transition-colors flex flex-col justify-center
                      ${
                        active
                          ? 'bg-[#d8ee8e] text-[#0d1626]'
                          : 'bg-white/6 text-slate-100 hover:bg-white/15'
                      }
                    `}
                  >
                    <span className="text-xs font-semibold leading-tight">
                      {item.label}
                    </span>
                    <span
                      className={`text-[10px] leading-tight mt-0.5 ${
                        active ? 'text-[#1c2b12]' : 'text-slate-400'
                      }`}
                    >
                      {item.sub}
                    </span>
                  </button>
                );
              })}
            </div>
          </nav>
        </>
      )}

      {/* SECTION 1: INTERACTIVE 3D SMART SOLAR SYSTEM STUDIO */}
      <div id="qanday-ishlaydi" className="scroll-mt-14">
        <Solar3DStudioPage onNavigateQuote={() => navigate('quote')} />
      </div>

      {/* SECTION 2: INSTALLED FAMILY HOMES & REVIEWS */}
      <div id="xonadonlarimiz" className="scroll-mt-14">
        <FamilyCasesPage
          initialFocus={casesFocus}
          onNavigateQuote={() => navigate('quote')}
        />
      </div>

      {/* SECTION 3: ABOUT US, 3D LAYER ARCHITECTURE, CAREERS & RESOURCES */}
      <div id="biz-haqimizda" className="scroll-mt-14">
        <AboutCareersResourcesPage
          activeTab={infoTab}
          onTabChange={(tab) => setInfoTab(tab)}
          onNavigateQuote={() => navigate('quote')}
        />
      </div>

      {/* SECTION 4: 3D SOLAR ROOF CALCULATOR & QUOTE FORM */}
      <div id="bepul-hisoblatish" className="scroll-mt-14">
        <QuoteCalculatorPage />
      </div>
    </div>
  );
}



