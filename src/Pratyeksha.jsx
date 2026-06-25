import { useEffect, useRef, useState } from "react";
import logoImg from './assets/logos.png';

const BASE_URL = "https://pratyeksha-backend.onrender.com/api";

/* ─── tiny SVG wrapper ─── */
const S = ({s=20,sw=1.5,children,...rest}) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" {...rest}>{children}</svg>
);

/* ─── icons ─── */
const IcoStarF  = ({s=13}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="#b8975a" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const IcoLogo   = () => <S s={15}><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></S>;
const IcoLayers = ({size=20}) => <S s={size}><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></S>;
const IcoMon    = ({size=20}) => <S s={size}><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></S>;
const IcoFile   = ({size=20}) => <S s={size}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></S>;
const IcoBox    = ({size=20}) => <S s={size}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></S>;
const IcoBar    = ({size=20}) => <S s={size}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></S>;
const IcoUsers  = ({size=20}) => <S s={size}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></S>;
const IcoChk    = ({size=10}) => <S s={size} sw={2.5}><polyline points="20 6 9 17 4 12"/></S>;
const IcoChkBig = () => <S s={26}><polyline points="20 6 9 17 4 12"/></S>;
const IcoShield = ({size=16}) => <S s={size}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></S>;
const IcoClock  = ({size=16}) => <S s={size}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></S>;
const IcoDollar = ({size=16}) => <S s={size}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></S>;
const IcoPhone  = ({size=16}) => <S s={size}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.36 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.11 2h3a2 2 0 0 1 2 1.72c.18.96.46 1.9.82 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l1.27-1.27a2 2 0 0 1 2.11-.45c.91.36 1.85.64 2.81.82A2 2 0 0 1 22 16.92z"/></S>;
const IcoMail   = ({size=14}) => <S s={size}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></S>;
const IcoPin    = ({size=15}) => <S s={size}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></S>;
const IcoUser   = ({size=52}) => <S s={size} sw={1}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></S>;
const IcoTrend  = ({size=16}) => <S s={size}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></S>;
const IcoBell   = ({size=16}) => <S s={size}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></S>;
const IcoMic    = ({size=16}) => <S s={size}><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></S>;
const IcoGlobe  = ({size=16}) => <S s={size}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></S>;
const IcoZap    = ({size=16}) => <S s={size}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></S>;
const IcoTarget = ({size=16}) => <S s={size}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></S>;
const IcoPackage= ({size=16}) => <S s={size}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></S>;
const IcoRepeat = ({size=16}) => <S s={size}><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></S>;
const IcoGrid   = ({size=16}) => <S s={size}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></S>;
const IcoPieChart = ({size=16}) => <S s={size}><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></S>;
const IcoAward  = ({size=16}) => <S s={size}><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></S>;
const IcoActivity=({size=16}) => <S s={size}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></S>;

/* ─── helpers ─── */
const Stars5 = () => <div style={{display:'flex',gap:2,marginBottom:14}}>{[0,1,2,3,4].map(i=><IcoStarF key={i}/>)}</div>;
const ChkItem = ({children}) => (
  <li style={{display:'flex',alignItems:'flex-start',gap:10,fontSize:'.78rem',color:'var(--text2)',lineHeight:1.6}}>
    <span style={{width:22,height:22,minWidth:22,borderRadius:5,background:'var(--ink2)',border:'1px solid rgba(184,151,90,.14)',display:'flex',alignItems:'center',justifyContent:'center',marginTop:1,color:'var(--gold)',flexShrink:0}}>
      <IcoChk/>
    </span>
    {children}
  </li>
);
const ModPH = ({icon,label,sublabel,tag}) => (
  <div className="mod-img">
    <span className="sc-tl"/><span className="sc-tr"/><span className="sc-bl"/><span className="sc-br"/>
    <div className="ph">
      <div className="ph-icon">{icon}</div>
      <div className="ph-lbl">{label}<br/><span style={{fontSize:'.6rem',opacity:.5}}>{sublabel}</span></div>
    </div>
    <div className="ph-tag">{tag}</div>
  </div>
);

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=DM+Mono:wght@300;400&display=swap');

html,body{overflow-anchor:none;}
#root{min-height:100vh;overflow:visible;}
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
:root{
  --gold:#b8975a;--gold-light:#d4b88a;--gold-pale:#f0e6d3;
  --ink:#0c0b09;--ink2:#161410;--ink3:#1e1b14;
  --cream:#faf8f4;--cream2:#f3efe7;
  --text:#2a2519;--text2:#6b5f4e;--text3:#9e927f;
  --green:#3ec97a;--red:#e05252;
  --border:rgba(184,151,90,0.12);--border2:rgba(184,151,90,0.24);
  --r-sm:6px;--r-md:12px;--r-lg:18px;--r-xl:24px;
}
html{scroll-behavior:smooth;overflow-x:hidden;overflow-y:scroll;width:100%;height:auto;}
body{background:var(--cream);color:var(--text);font-family:'DM Sans',sans-serif;overflow-x:hidden;overflow-y:auto;line-height:1.65;cursor:none;width:100%;min-height:100vh;position:relative;}
@media(max-width:768px){body{cursor:auto;}}
img{max-width:100%;display:block;}

#cur-dot{position:fixed;width:7px;height:7px;background:var(--gold);border-radius:50%;pointer-events:none;z-index:99999;left:-40px;top:-40px;transform:translate(-50%,-50%);transition:width .15s,height .15s;}
#cur-ring{position:fixed;width:32px;height:32px;border:1px solid rgba(184,151,90,.4);border-radius:50%;pointer-events:none;z-index:99998;left:-40px;top:-40px;transform:translate(-50%,-50%);transition:width .25s,height .25s;}
body.ch #cur-dot{width:10px;height:10px;}
body.ch #cur-ring{width:48px;height:48px;border-color:var(--gold);}
@media(max-width:768px){#cur-dot,#cur-ring{display:none;}}

#loader{position:fixed;inset:0;z-index:9999;background:var(--ink);display:flex;align-items:center;justify-content:center;flex-direction:column;gap:20px;transition:opacity .6s ease;}
#loader.out{opacity:0;pointer-events:none;visibility:hidden;}
.l-logo{font-family:'DM Serif Display',serif;font-size:2.4rem;color:var(--gold);letter-spacing:3px;}
.l-sub{font-size:.6rem;letter-spacing:5px;text-transform:uppercase;color:rgba(184,151,90,.4);}
.l-bar{width:140px;height:1px;background:rgba(184,151,90,.1);overflow:hidden;}
.l-fill{height:100%;width:0;background:var(--gold);animation:lf 2.4s ease forwards;}
@keyframes lf{to{width:100%;}}

nav{position:fixed;top:0;left:0;right:0;z-index:200;display:flex;align-items:center;justify-content:space-between;padding:22px 72px;transition:all .35s;}
nav.s{background:rgba(250,248,244,.97);backdrop-filter:blur(20px);border-bottom:1px solid var(--border);padding:14px 72px;box-shadow:0 2px 24px rgba(0,0,0,.05);}
.nav-logo{display:flex;align-items:center;gap:10px;text-decoration:none;cursor:pointer;}
.nav-icon{width:34px;height:34px;border-radius:9px;background:var(--ink2);border:1px solid var(--border2);display:flex;align-items:center;justify-content:center;color:var(--gold);}
.nav-name{font-family:'DM Serif Display',serif;font-size:1.25rem;color:var(--ink);letter-spacing:.3px;}
.nav-links{display:flex;align-items:center;gap:32px;}
.nav-links a{color:var(--text2);text-decoration:none;font-size:.78rem;font-weight:400;letter-spacing:.2px;transition:color .2s;position:relative;cursor:pointer;}
.nav-links a::after{content:'';position:absolute;bottom:-2px;left:0;right:0;height:1px;background:var(--gold);transform:scaleX(0);transform-origin:center;transition:transform .2s;}
.nav-links a:hover{color:var(--gold);}
.nav-links a:hover::after{transform:scaleX(1);}
.nav-cta{background:var(--ink)!important;color:var(--gold-light)!important;padding:9px 22px;border-radius:var(--r-sm);font-size:.75rem;font-weight:500;transition:all .2s;border:none!important;}
.nav-cta:hover{background:var(--gold)!important;color:var(--ink)!important;}
.nav-cta::after{display:none!important;}
.nav-ham{display:none;flex-direction:column;gap:4px;background:none;border:none;cursor:pointer;padding:4px;}
.nav-ham span{width:20px;height:1.5px;background:var(--ink);display:block;transition:all .3s;}

#mmenu{display:none;position:fixed;inset:0;background:var(--cream);z-index:199;flex-direction:column;align-items:center;justify-content:center;gap:32px;}
#mmenu.open{display:flex;}
#mmenu a{font-family:'DM Serif Display',serif;font-size:1.8rem;color:var(--ink);text-decoration:none;cursor:pointer;}
#mmenu a:hover{color:var(--gold);}
.mm-close{position:absolute;top:24px;right:24px;background:none;border:none;font-size:1.4rem;cursor:pointer;color:var(--text2);}

.hero{min-height:100vh;width:100%;display:grid;grid-template-columns:1fr 1fr;position:relative;overflow:hidden;}
.hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 60% 70% at 30% 60%,rgba(184,151,90,.04),transparent);pointer-events:none;}
.hero-l{display:flex;flex-direction:column;justify-content:center;padding:140px 64px 80px 80px;position:relative;z-index:2;}
.hero-r{background:var(--ink2);position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;}
.hero-r-bg{position:absolute;inset:0;background:radial-gradient(ellipse 55% 65% at 55% 45%,rgba(184,151,90,.06),transparent 65%),repeating-linear-gradient(0deg,transparent,transparent 27px,rgba(184,151,90,.025) 28px),repeating-linear-gradient(90deg,transparent,transparent 27px,rgba(184,151,90,.025) 28px);}
.hero-eye{display:inline-flex;align-items:center;gap:10px;font-size:.62rem;letter-spacing:3.5px;text-transform:uppercase;color:var(--gold);margin-bottom:22px;font-weight:500;}
.eye-line{width:28px;height:1px;background:var(--gold);}
.hero-h1{font-family:'DM Serif Display',serif;font-size:4rem;font-weight:400;line-height:1.1;letter-spacing:-.5px;color:var(--ink);margin-bottom:22px;}
.hero-h1 em{font-style:italic;color:var(--gold);}
.hero-sub{font-size:.9rem;color:var(--text2);font-weight:300;max-width:400px;line-height:1.85;margin-bottom:40px;}
.hero-btns{display:flex;gap:12px;margin-bottom:48px;flex-wrap:wrap;}
.btn-p{background:var(--ink);color:var(--gold-light);padding:13px 28px;border-radius:var(--r-sm);border:none;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:.78rem;font-weight:500;letter-spacing:.3px;transition:all .22s;display:inline-flex;align-items:center;gap:7px;}
.btn-p:hover{background:var(--gold);color:var(--ink);transform:translateY(-1px);}
.btn-o{background:transparent;color:var(--text2);padding:13px 28px;border-radius:var(--r-sm);border:1px solid rgba(0,0,0,.1);cursor:pointer;font-family:'DM Sans',sans-serif;font-size:.78rem;font-weight:400;transition:all .22s;display:inline-flex;align-items:center;gap:7px;}
.btn-o:hover{border-color:var(--gold);color:var(--gold);}
.hero-kpis{display:flex;gap:28px;align-items:stretch;flex-wrap:wrap;}
.kpi{display:flex;flex-direction:column;}
.kpi-v{font-family:'DM Serif Display',serif;font-size:1.8rem;color:var(--ink);line-height:1;}
.kpi-l{font-size:.6rem;color:var(--text3);text-transform:uppercase;letter-spacing:2px;margin-top:4px;}
.kpi-s{width:1px;background:var(--border);align-self:stretch;}

.hero-dash{background:var(--ink3);border:1px solid rgba(184,151,90,.12);border-radius:var(--r-xl);overflow:hidden;width:320px;box-shadow:0 32px 80px rgba(0,0,0,.6);animation:dashF 8s ease-in-out infinite;}
@keyframes dashF{0%,100%{transform:rotate(-2deg) translateY(0);}50%{transform:rotate(-2deg) translateY(-18px);}}
.dh{padding:14px 18px;border-bottom:1px solid rgba(184,151,90,.08);display:flex;justify-content:space-between;align-items:center;}
.dh-t{font-size:.55rem;letter-spacing:2px;text-transform:uppercase;color:var(--gold);font-weight:500;}
.dh-l{display:flex;align-items:center;gap:5px;font-size:.55rem;color:var(--green);font-weight:500;}
.ldot{width:5px;height:5px;border-radius:50%;background:var(--green);box-shadow:0 0 6px var(--green);animation:bk 2s infinite;}
@keyframes bk{0%,100%{opacity:1;}50%{opacity:.3;}}
.ds{display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid rgba(184,151,90,.06);}
.dc{padding:14px 18px;}
.dc:first-child{border-right:1px solid rgba(184,151,90,.06);}
.dn{font-family:'DM Mono',monospace;font-size:1.2rem;color:var(--gold);}
.dl{font-size:.5rem;color:rgba(184,151,90,.35);text-transform:uppercase;letter-spacing:1px;margin-top:2px;}
.dr{display:flex;justify-content:space-between;align-items:center;padding:10px 18px;border-bottom:1px solid rgba(184,151,90,.04);}
.dr:last-child{border:none;}
.dtbl{font-size:.65rem;color:rgba(255,255,255,.38);font-family:'DM Mono',monospace;}
.dbg{font-size:.53rem;font-weight:600;padding:2px 9px;border-radius:4px;letter-spacing:.4px;}
.occ{background:rgba(184,151,90,.12);color:var(--gold);}
.chk{background:rgba(62,201,122,.1);color:var(--green);}
.emp{background:rgba(255,255,255,.04);color:rgba(255,255,255,.18);}

.trust{background:var(--ink);padding:18px 72px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(184,151,90,.07);flex-wrap:wrap;gap:12px;width:100%;}
.trust-lbl{font-size:.56rem;letter-spacing:2.5px;text-transform:uppercase;color:rgba(255,255,255,.22);}
.trust-pills{display:flex;gap:24px;flex-wrap:wrap;}
.tp{display:flex;align-items:center;gap:7px;font-size:.74rem;color:rgba(255,255,255,.4);}
.tp-dot{width:4px;height:4px;border-radius:50%;background:rgba(184,151,90,.4);}
.integ{padding:20px 72px;background:var(--cream2);border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px;width:100%;}
.integ-lbl{font-size:.58rem;letter-spacing:2.5px;text-transform:uppercase;color:var(--text3);}
.integ-pills{display:flex;gap:22px;flex-wrap:wrap;}
.ip{display:flex;align-items:center;gap:7px;font-size:.76rem;color:var(--text2);}
.idot{width:6px;height:6px;border-radius:50%;}

section{padding:96px 72px;width:100%;}
.eye{font-size:.6rem;letter-spacing:3px;text-transform:uppercase;color:var(--gold);margin-bottom:12px;font-weight:500;}
.sh2{font-family:'DM Serif Display',serif;font-size:2.9rem;font-weight:400;line-height:1.12;margin-bottom:16px;color:var(--ink);}
.sh2 em{font-style:italic;color:var(--gold);}
.sdesc{font-size:.88rem;color:var(--text2);line-height:1.85;max-width:500px;}
.center{text-align:center;}
.center .sdesc{margin:0 auto;}

/* ── OUTCOMES STRIP ── */
.outcomes-strip{background:var(--ink2);width:100%;padding:72px 72px;}
.outcomes-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:rgba(184,151,90,.08);border:1px solid rgba(184,151,90,.08);border-radius:var(--r-lg);overflow:hidden;margin-top:48px;}
.oc{background:var(--ink3);padding:32px 28px;transition:background .3s;}
.oc:hover{background:rgba(184,151,90,.04);}
.oc-icon{width:40px;height:40px;border-radius:10px;background:rgba(184,151,90,.07);border:1px solid rgba(184,151,90,.14);display:flex;align-items:center;justify-content:center;margin-bottom:14px;color:var(--gold);}
.oc-v{font-family:'DM Serif Display',serif;font-size:1.9rem;color:var(--gold);line-height:1;margin-bottom:5px;}
.oc-t{font-size:.8rem;font-weight:600;color:#fff;margin-bottom:4px;}
.oc-d{font-size:.7rem;color:rgba(255,255,255,.28);line-height:1.6;}

#about{background:var(--ink2);padding:100px 72px;width:100%;}
.about-grid{display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center;margin-bottom:80px;}
.about-img-wrap{position:relative;}
.about-img-frame{border-radius:var(--r-xl);overflow:hidden;aspect-ratio:4/5;position:relative;border:1px solid rgba(184,151,90,.15);background:var(--ink3);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;}
.about-ph{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;width:100%;height:100%;color:rgba(184,151,90,.3);}
.about-ph span{font-size:.68rem;letter-spacing:2px;text-transform:uppercase;}
.about-badge{position:absolute;bottom:-18px;left:28px;background:var(--gold);border-radius:var(--r-md);padding:14px 20px;box-shadow:0 12px 32px rgba(184,151,90,.3);}
.about-badge-num{font-family:'DM Serif Display',serif;font-size:1.6rem;color:var(--ink);line-height:1;}
.about-badge-lbl{font-size:.62rem;color:rgba(8,7,5,.6);text-transform:uppercase;letter-spacing:1.5px;line-height:1.4;margin-top:3px;}
.about-h2{font-family:'DM Serif Display',serif;font-size:2.5rem;font-weight:400;line-height:1.15;color:#fff;margin-bottom:20px;}
.about-h2 em{font-style:italic;color:var(--gold);}
.about-lead{font-size:.9rem;color:rgba(255,255,255,.55);line-height:1.85;margin-bottom:28px;font-weight:300;}
.about-body{font-size:.82rem;color:rgba(255,255,255,.35);line-height:1.9;margin-bottom:36px;}
.about-values{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:36px;}
.av{background:rgba(184,151,90,.05);border:1px solid rgba(184,151,90,.1);border-radius:var(--r-md);padding:18px 20px;}
.av-icon{width:36px;height:36px;border-radius:9px;background:rgba(184,151,90,.08);border:1px solid rgba(184,151,90,.15);display:flex;align-items:center;justify-content:center;margin-bottom:10px;color:var(--gold);}
.av-t{font-size:.82rem;font-weight:600;color:#fff;margin-bottom:4px;}
.av-d{font-size:.72rem;color:rgba(255,255,255,.3);line-height:1.6;}
.about-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:0;background:rgba(184,151,90,.06);border:1px solid rgba(184,151,90,.1);border-radius:var(--r-lg);overflow:hidden;margin-bottom:80px;}
.as{padding:36px 28px;text-align:center;border-right:1px solid rgba(184,151,90,.08);}
.as:last-child{border:none;}
.as-v{font-family:'DM Serif Display',serif;font-size:2.4rem;color:var(--gold);line-height:1;}
.as-l{font-size:.6rem;letter-spacing:1.8px;text-transform:uppercase;color:rgba(255,255,255,.28);margin-top:7px;}
.as-s{font-size:.7rem;color:rgba(184,151,90,.35);margin-top:3px;}
.team-grid{display:grid;grid-template-columns:repeat(2,240px);gap:24px;justify-content:center;margin-bottom:80px;}
.team-card{background:rgba(184,151,90,.04);border:1px solid rgba(184,151,90,.1);border-radius:var(--r-lg);overflow:hidden;transition:all .3s;cursor:pointer;}
.team-card:hover{border-color:rgba(184,151,90,.25);transform:translateY(-4px);}
.team-photo{aspect-ratio:1;overflow:hidden;position:relative;background:var(--ink3);}
.team-ph{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-family:'DM Serif Display',serif;font-size:2.5rem;color:rgba(184,151,90,.3);}
.team-info{padding:18px 20px;}
.team-name{font-size:.9rem;font-weight:600;color:#fff;margin-bottom:3px;}
.team-role{font-size:.7rem;color:rgba(184,151,90,.5);letter-spacing:.5px;}

.feat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;margin-top:60px;background:var(--border);border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden;}
.feat{background:var(--cream);padding:40px 32px;transition:all .3s;position:relative;overflow:hidden;cursor:pointer;}
.feat::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(184,151,90,.04),transparent);opacity:0;transition:opacity .3s;}
.feat:hover{background:var(--cream2);}
.feat:hover::before{opacity:1;}
.feat-icon{width:48px;height:48px;border-radius:12px;background:var(--ink2);border:1px solid rgba(184,151,90,.14);display:flex;align-items:center;justify-content:center;margin-bottom:20px;transition:transform .3s;color:var(--gold);}
.feat:hover .feat-icon{transform:translateY(-3px);}
.feat-t{font-size:.92rem;font-weight:600;margin-bottom:8px;color:var(--ink);}
.feat-d{font-size:.78rem;color:var(--text2);line-height:1.75;}
.feat-lnk{display:inline-flex;align-items:center;gap:5px;font-size:.71rem;color:var(--gold);margin-top:14px;font-weight:500;transition:gap .2s;cursor:pointer;background:none;border:none;padding:0;font-family:inherit;}
.feat-lnk:hover{gap:9px;}
.nums{display:grid;grid-template-columns:repeat(4,1fr);background:var(--ink);border-radius:var(--r-lg);overflow:hidden;margin-top:72px;}
.nc{padding:40px 28px;text-align:center;border-right:1px solid rgba(184,151,90,.07);}
.nc:last-child{border:none;}
.nv{font-family:'DM Serif Display',serif;font-size:2.6rem;color:var(--gold);line-height:1;}
.nl{font-size:.6rem;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,.28);margin-top:8px;}
.ns{font-size:.68rem;color:rgba(184,151,90,.33);margin-top:3px;}

/* ── BENEFITS ── */
.benefits-sec{background:var(--cream);width:100%;padding:96px 72px;}
.benefits-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:20px;margin-top:56px;}
.ben-card{background:var(--cream2);border:1px solid var(--border);border-radius:var(--r-lg);padding:32px 28px;transition:all .3s;cursor:pointer;position:relative;overflow:hidden;}
.ben-card:hover{border-color:var(--border2);transform:translateY(-3px);box-shadow:0 16px 40px rgba(0,0,0,.06);}
.ben-card::after{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,var(--gold),transparent);opacity:0;transition:opacity .3s;}
.ben-card:hover::after{opacity:1;}
.ben-head{display:flex;align-items:center;gap:14px;margin-bottom:18px;}
.ben-icon{width:44px;height:44px;min-width:44px;border-radius:11px;background:var(--ink2);border:1px solid rgba(184,151,90,.14);display:flex;align-items:center;justify-content:center;color:var(--gold);}
.ben-title{font-size:.95rem;font-weight:600;color:var(--ink);}
.ben-sub{font-size:.72rem;color:var(--text3);letter-spacing:.3px;margin-top:1px;}
.ben-list{list-style:none;display:flex;flex-direction:column;gap:8px;padding:0;}
.ben-item{display:flex;align-items:flex-start;gap:9px;font-size:.76rem;color:var(--text2);line-height:1.6;}
.ben-dot{width:4px;height:4px;border-radius:50%;background:var(--gold);margin-top:7px;flex-shrink:0;}

.why-grid{display:grid;grid-template-columns:1fr 1fr;border:1px solid var(--border);border-radius:var(--r-xl);overflow:hidden;margin-top:60px;}
.why-l{background:var(--ink2);padding:60px 52px;display:flex;flex-direction:column;justify-content:center;position:relative;overflow:hidden;}
.why-l::before{content:'';position:absolute;top:-80px;right:-80px;width:320px;height:320px;border-radius:50%;background:radial-gradient(circle,rgba(184,151,90,.07),transparent 65%);pointer-events:none;}
.why-r{padding:60px 52px;display:flex;flex-direction:column;gap:28px;background:var(--cream);}
.why-h{font-family:'DM Serif Display',serif;font-size:2.3rem;color:#fff;line-height:1.15;margin-bottom:16px;}
.why-h em{font-style:italic;color:var(--gold);}
.why-b{font-size:.82rem;color:rgba(255,255,255,.35);line-height:1.85;margin-bottom:28px;}
.why-sts{display:flex;gap:28px;flex-wrap:wrap;}
.ws-v{font-family:'DM Serif Display',serif;font-size:2.1rem;color:var(--gold);line-height:1;}
.ws-l{font-size:.58rem;color:rgba(255,255,255,.26);text-transform:uppercase;letter-spacing:1.5px;margin-top:4px;}
.why-pt{display:flex;gap:14px;align-items:flex-start;}
.wpi{width:40px;height:40px;min-width:40px;border-radius:10px;background:var(--cream2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;color:var(--gold);}
.wp-t{font-size:.86rem;font-weight:600;color:var(--ink);margin-bottom:3px;}
.wp-d{font-size:.76rem;color:var(--text2);line-height:1.68;}

.modules-sec{background:var(--cream2);width:100%;}
.mod-row{display:grid;grid-template-columns:1fr 1fr;gap:72px;align-items:center;margin-bottom:96px;}
.mod-row:last-child{margin-bottom:0;}
.mbadge{display:inline-flex;align-items:center;gap:9px;background:var(--ink);border:1px solid rgba(184,151,90,.18);border-radius:var(--r-sm);padding:8px 14px;font-size:.64rem;color:var(--gold-light);font-weight:500;margin-bottom:16px;}
.mbadge svg{color:var(--gold);}
.meye{font-size:.58rem;letter-spacing:2.5px;text-transform:uppercase;color:var(--gold);margin-bottom:9px;font-weight:500;}
.mh3{font-family:'DM Serif Display',serif;font-size:2.2rem;font-weight:400;line-height:1.15;margin-bottom:12px;color:var(--ink);}
.mh3 em{font-style:italic;color:var(--gold);}
.mp{font-size:.82rem;color:var(--text2);line-height:1.85;margin-bottom:22px;}
.mul{list-style:none;display:flex;flex-direction:column;gap:10px;margin-bottom:24px;padding:0;}
.mod-img{border-radius:var(--r-xl);overflow:hidden;position:relative;border:1px solid rgba(184,151,90,.1);box-shadow:0 32px 80px rgba(0,0,0,.14);transition:transform .4s,box-shadow .4s;aspect-ratio:16/10;background:var(--ink2);}
.mod-img:hover{transform:translateY(-6px);box-shadow:0 48px 100px rgba(0,0,0,.2);}
.mod-img img{width:100%;height:100%;object-fit:cover;display:block;}
.ph{width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;position:relative;}
.ph::before{content:'';position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 27px,rgba(184,151,90,.025) 28px),repeating-linear-gradient(90deg,transparent,transparent 27px,rgba(184,151,90,.025) 28px);}
.ph-icon{width:52px;height:52px;border-radius:14px;background:rgba(184,151,90,.07);border:1px solid rgba(184,151,90,.18);display:flex;align-items:center;justify-content:center;position:relative;z-index:1;color:var(--gold);}
.ph-lbl{font-size:.72rem;color:rgba(255,255,255,.5);text-align:center;position:relative;z-index:1;}
.ph-tag{position:absolute;bottom:12px;right:12px;background:rgba(0,0,0,.7);border:1px solid rgba(184,151,90,.18);border-radius:5px;padding:4px 10px;font-size:.54rem;color:var(--gold);letter-spacing:1.5px;text-transform:uppercase;}
.sc-tl,.sc-tr,.sc-bl,.sc-br{position:absolute;width:18px;height:18px;}
.sc-tl{top:10px;left:10px;border-top:1px solid rgba(184,151,90,.2);border-left:1px solid rgba(184,151,90,.2);}
.sc-tr{top:10px;right:10px;border-top:1px solid rgba(184,151,90,.2);border-right:1px solid rgba(184,151,90,.2);}
.sc-bl{bottom:10px;left:10px;border-bottom:1px solid rgba(184,151,90,.2);border-left:1px solid rgba(184,151,90,.2);}
.sc-br{bottom:10px;right:10px;border-bottom:1px solid rgba(184,151,90,.2);border-right:1px solid rgba(184,151,90,.2);}

/* ── MODULE HIGHLIGHTS STRIP ── */
.mod-highlights{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:16px;}
.mh-pill{background:rgba(184,151,90,.05);border:1px solid rgba(184,151,90,.1);border-radius:var(--r-sm);padding:10px 14px;display:flex;align-items:center;gap:8px;font-size:.7rem;color:var(--text2);}
.mh-pill-icon{color:var(--gold);flex-shrink:0;}

.hiw{background:var(--ink2);width:100%;}
.steps{display:grid;grid-template-columns:repeat(4,1fr);gap:0;margin-top:60px;position:relative;}
.steps::before{content:'';position:absolute;top:25px;left:12.5%;right:12.5%;height:1px;background:linear-gradient(90deg,transparent,var(--border2),var(--gold),var(--border2),transparent);}
.step{text-align:center;padding:0 18px;}
.step-n{width:50px;height:50px;border-radius:50%;background:var(--ink3);border:1px solid rgba(184,151,90,.2);display:flex;align-items:center;justify-content:center;margin:0 auto 18px;font-family:'DM Serif Display',serif;font-size:1.2rem;color:var(--gold);position:relative;z-index:1;transition:all .3s;}
.step:hover .step-n{background:rgba(184,151,90,.07);box-shadow:0 0 24px rgba(184,151,90,.12);}
.step-t{font-size:.84rem;font-weight:600;margin-bottom:7px;color:#fff;}
.step-d{font-size:.72rem;color:rgba(255,255,255,.32);line-height:1.65;}

.cmp-wrap{background:var(--ink2);border-radius:var(--r-xl);overflow:hidden;border:1px solid rgba(184,151,90,.1);margin-top:48px;}
.cmp-hdr{display:grid;grid-template-columns:200px 1fr 1fr 1fr;border-bottom:1px solid rgba(184,151,90,.08);}
.cmp-hc{padding:24px 20px;}
.cmp-hc.fc{background:rgba(184,151,90,.04);border-left:1px solid rgba(184,151,90,.1);border-right:1px solid rgba(184,151,90,.1);}
.cmp-badge{display:inline-block;background:var(--gold);color:var(--ink);font-size:.52rem;font-weight:700;padding:2px 9px;border-radius:50px;letter-spacing:.5px;margin-bottom:6px;text-transform:uppercase;}
.cmp-hn{font-size:.88rem;font-weight:600;color:#fff;margin-bottom:2px;}
.cmp-hs{font-size:.66rem;color:rgba(255,255,255,.26);}
.cmp-row{display:grid;grid-template-columns:200px 1fr 1fr 1fr;border-bottom:1px solid rgba(255,255,255,.025);}
.cmp-row:last-child{border:none;}
.cmp-c{padding:12px 20px;font-size:.75rem;display:flex;align-items:center;gap:7px;}
.cmp-c.lbl{color:rgba(255,255,255,.38);font-size:.72rem;}
.cmp-c.fc{background:rgba(184,151,90,.025);border-left:1px solid rgba(184,151,90,.06);border-right:1px solid rgba(184,151,90,.06);}
.cy{color:var(--green);font-weight:700;}
.cn{color:rgba(255,255,255,.15);font-weight:700;}
.cp{color:var(--gold);font-weight:700;}

/* ── INTELLIGENCE SECTION ── */
.intel-sec{background:var(--ink);width:100%;padding:96px 72px;}
.intel-grid{display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:start;margin-top:56px;}
.intel-cats{display:flex;flex-direction:column;gap:12px;}
.intel-cat{background:rgba(184,151,90,.04);border:1px solid rgba(184,151,90,.08);border-radius:var(--r-md);padding:20px 22px;cursor:pointer;transition:all .3s;}
.intel-cat:hover,.intel-cat.active{background:rgba(184,151,90,.06);border-color:rgba(184,151,90,.2);}
.ic-head{display:flex;align-items:center;gap:11px;margin-bottom:6px;}
.ic-icon{width:32px;height:32px;border-radius:8px;background:rgba(184,151,90,.08);border:1px solid rgba(184,151,90,.14);display:flex;align-items:center;justify-content:center;color:var(--gold);}
.ic-title{font-size:.84rem;font-weight:600;color:#fff;}
.ic-desc{font-size:.72rem;color:rgba(255,255,255,.28);line-height:1.6;}
.intel-panel{background:rgba(184,151,90,.03);border:1px solid rgba(184,151,90,.1);border-radius:var(--r-lg);padding:28px;position:sticky;top:100px;}
.intel-panel-title{font-size:.58rem;letter-spacing:2px;text-transform:uppercase;color:rgba(184,151,90,.4);margin-bottom:16px;}
.intel-items{display:flex;flex-direction:column;gap:10px;}
.intel-item{display:flex;align-items:flex-start;gap:10px;font-size:.76rem;color:rgba(255,255,255,.4);line-height:1.6;padding:10px 12px;border-radius:8px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.03);}
.intel-item-dot{width:6px;height:6px;min-width:6px;border-radius:50%;background:var(--gold);margin-top:6px;opacity:.5;}

.t-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:52px;}
.t-card{background:var(--cream);border:1px solid var(--border);border-radius:var(--r-lg);padding:28px;transition:all .3s;position:relative;overflow:hidden;cursor:pointer;}
.t-card::before{content:'"';position:absolute;top:-8px;right:18px;font-family:'DM Serif Display',serif;font-size:7rem;font-weight:400;color:rgba(184,151,90,.05);line-height:1;pointer-events:none;}
.t-card:hover{transform:translateY(-4px);box-shadow:0 20px 50px rgba(0,0,0,.07);background:var(--cream2);}
.t-text{font-size:.81rem;color:var(--text2);line-height:1.8;margin-bottom:18px;font-style:italic;}
.t-author{display:flex;align-items:center;gap:10px;}
.t-av{width:38px;height:38px;border-radius:50%;background:var(--ink2);border:1px solid var(--border2);display:flex;align-items:center;justify-content:center;font-size:.68rem;font-weight:600;color:var(--gold-light);font-family:'DM Mono',monospace;}
.t-name{font-size:.8rem;font-weight:600;color:var(--ink);}
.t-role{font-size:.65rem;color:var(--text3);}

.demo-card{background:var(--ink2);border-radius:var(--r-xl);overflow:hidden;display:grid;grid-template-columns:1fr 1fr;border:1px solid rgba(184,151,90,.08);box-shadow:0 32px 80px rgba(0,0,0,.12);}
.demo-l{padding:60px 56px;}
.demo-r{padding:56px 56px 56px 0;}
.demo-eye{font-size:.58rem;letter-spacing:3px;text-transform:uppercase;color:var(--gold);margin-bottom:10px;font-weight:500;}
.demo-h{font-family:'DM Serif Display',serif;font-size:2.2rem;color:#fff;line-height:1.14;margin-bottom:12px;}
.demo-h em{font-style:italic;color:var(--gold);}
.demo-d{font-size:.8rem;color:rgba(255,255,255,.32);line-height:1.85;margin-bottom:28px;}
.demo-feats{display:flex;flex-direction:column;gap:18px;}
.df{display:flex;align-items:flex-start;gap:12px;}
.df-icon{width:36px;height:36px;min-width:36px;border-radius:8px;background:rgba(184,151,90,.06);border:1px solid rgba(184,151,90,.14);display:flex;align-items:center;justify-content:center;color:var(--gold);}
.df-t{font-size:.8rem;font-weight:600;color:#fff;margin-bottom:2px;}
.df-d{font-size:.7rem;color:rgba(255,255,255,.28);line-height:1.55;}
.cq{margin-top:24px;padding:18px 20px;background:rgba(184,151,90,.05);border:1px solid rgba(184,151,90,.1);border-radius:9px;}
.cq-lbl{font-size:.54rem;letter-spacing:2px;text-transform:uppercase;color:rgba(184,151,90,.4);margin-bottom:10px;}
.cq-item{display:flex;align-items:center;gap:9px;margin-bottom:7px;}
.cq-item:last-child{margin-bottom:0;}
.cq-icon{color:var(--gold);flex-shrink:0;display:flex;}
.cq-link{color:var(--gold-light);text-decoration:none;font-size:.77rem;font-weight:500;transition:color .2s;}
.cq-link:hover{color:var(--gold);}
.cq-sep{width:1px;height:13px;background:rgba(184,151,90,.2);}
.form-body{display:flex;flex-direction:column;gap:11px;}
.f2{display:grid;grid-template-columns:1fr 1fr;gap:11px;}
.fi{padding:12px 15px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.07);border-radius:var(--r-sm);color:#fff;font-family:'DM Sans',sans-serif;font-size:.79rem;outline:none;transition:border-color .2s;width:100%;}
.fi::placeholder{color:rgba(255,255,255,.2);}
.fi:focus{border-color:rgba(184,151,90,.38);}
.fsel{position:relative;}
.fsel::after{content:'↓';position:absolute;right:13px;top:50%;transform:translateY(-50%);color:rgba(255,255,255,.22);pointer-events:none;font-size:.7rem;}
select.fi{appearance:none;cursor:pointer;}
select.fi option{background:#161410;}
.fsub{padding:13px;background:var(--gold);color:var(--ink);border:none;border-radius:var(--r-sm);font-family:'DM Sans',sans-serif;font-size:.82rem;font-weight:600;cursor:pointer;transition:all .22s;width:100%;}
.fsub:hover{background:var(--gold-light);transform:translateY(-1px);}
.fsub:disabled{opacity:.6;cursor:not-allowed;transform:none;}
.fnote{font-size:.63rem;color:rgba(255,255,255,.18);text-align:center;}

footer{background:var(--ink);padding:60px 72px 0;display:grid;grid-template-columns:2.2fr 1fr 1fr 1fr;gap:52px;width:100%;}
.f-brand{font-family:'DM Serif Display',serif;font-size:1.55rem;color:var(--gold);margin-bottom:10px;}
.f-desc{font-size:.74rem;color:rgba(255,255,255,.24);line-height:1.75;max-width:210px;margin-bottom:14px;}
.f-tag{font-size:.55rem;letter-spacing:3px;text-transform:uppercase;color:rgba(184,151,90,.22);}
.f-col h5{font-size:.57rem;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,.22);margin-bottom:16px;font-weight:500;}
.f-col a{display:block;font-size:.74rem;color:rgba(255,255,255,.32);text-decoration:none;margin-bottom:8px;transition:color .2s;cursor:pointer;}
.f-col a:hover{color:var(--gold);}
.f-ci{display:flex;align-items:center;gap:8px;margin-bottom:7px;color:var(--gold);}
.f-ci a{color:rgba(255,255,255,.32);text-decoration:none;font-size:.74rem;margin-bottom:0;transition:color .2s;}
.f-ci a:hover{color:var(--gold);}
.f-btm{border-top:1px solid rgba(184,151,90,.07);margin-top:44px;padding:16px 0;display:flex;justify-content:space-between;align-items:center;grid-column:1/-1;flex-wrap:wrap;gap:10px;}
.f-btm-t{font-size:.67rem;color:rgba(255,255,255,.15);}
.f-btm-links{display:flex;gap:20px;}
.f-btm-links a{font-size:.67rem;color:rgba(255,255,255,.15);text-decoration:none;transition:color .2s;cursor:pointer;}
.f-btm-links a:hover{color:var(--gold);}

.thanks{position:fixed;inset:0;z-index:998;background:rgba(12,11,9,.97);backdrop-filter:blur(16px);display:none;align-items:center;justify-content:center;flex-direction:column;gap:16px;}
.thanks.show{display:flex;}
.thanks-icon{width:60px;height:60px;background:rgba(184,151,90,.08);border:1px solid rgba(184,151,90,.25);border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--gold);}
.thanks-title{font-family:'DM Serif Display',serif;font-size:2.2rem;color:var(--gold);}
.thanks-desc{font-size:.84rem;color:rgba(255,255,255,.32);max-width:280px;text-align:center;line-height:1.75;}
.thanks-contacts{display:flex;flex-direction:column;gap:7px;align-items:center;margin-top:4px;}
.thanks-contacts a{color:rgba(184,151,90,.6);text-decoration:none;font-size:.79rem;transition:color .2s;}
.thanks-contacts a:hover{color:var(--gold);}
.thanks-close{margin-top:10px;padding:11px 26px;background:var(--gold);color:var(--ink);border:none;border-radius:var(--r-sm);font-size:.8rem;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s;}
.thanks-close:hover{background:var(--gold-light);}

.reveal{opacity:0;transform:translateY(22px);transition:opacity .7s ease,transform .7s ease;}
.reveal.on{opacity:1;transform:none;}
.rd1{transition-delay:.06s;}.rd2{transition-delay:.14s;}.rd3{transition-delay:.22s;}.rd4{transition-delay:.30s;}
::-webkit-scrollbar{width:7px;}
::-webkit-scrollbar-track{background:var(--ink);border-left:1px solid rgba(184,151,90,.06);}
::-webkit-scrollbar-thumb{background:linear-gradient(180deg,rgba(184,151,90,.6),rgba(184,151,90,.25));border-radius:4px;border:1px solid rgba(184,151,90,.15);}
::-webkit-scrollbar-thumb:hover{background:linear-gradient(180deg,var(--gold),rgba(184,151,90,.5));}
::-webkit-scrollbar-corner{background:var(--ink);}
* { scrollbar-width:thin; scrollbar-color:rgba(184,151,90,.4) var(--ink); }

@media(max-width:1100px){
  nav,nav.s{padding:16px 28px;}
  section,#about,.outcomes-strip,.benefits-sec,.intel-sec,.modules-sec{padding-left:28px;padding-right:28px;}
  .trust,.integ{padding-left:28px;padding-right:28px;}
  footer{padding:52px 28px 0;gap:32px;}
  .about-grid{gap:48px;}
  .intel-grid{grid-template-columns:1fr;}
}
@media(max-width:900px){
  nav,nav.s{padding:13px 20px;}
  .nav-links{display:none;}
  .nav-ham{display:flex;}
  .hero{grid-template-columns:1fr;min-height:auto;}
  .hero-r{display:none;}
  .hero-l{padding:110px 20px 60px;}
  .hero-h1{font-size:2.6rem;}
  section,#about,.outcomes-strip,.benefits-sec,.intel-sec,.modules-sec{padding-top:60px;padding-bottom:60px;padding-left:20px;padding-right:20px;}
  .trust,.integ{padding-left:20px;padding-right:20px;}
  footer{grid-template-columns:1fr 1fr;padding:40px 20px 0;}
  .sh2{font-size:2.2rem;}
  .feat-grid{grid-template-columns:1fr;}
  .nums{grid-template-columns:1fr 1fr;}
  .nc{border-right:none;border-bottom:1px solid rgba(184,151,90,.07);}
  .nc:last-child{border:none;}
  .why-grid{grid-template-columns:1fr;}
  .why-l,.why-r{padding:40px 28px;}
  .about-grid{grid-template-columns:1fr;}
  .about-stats{grid-template-columns:1fr 1fr;}
  .as{border-right:none;border-bottom:1px solid rgba(184,151,90,.08);}
  .as:last-child{border:none;}
  .team-grid{grid-template-columns:repeat(2,1fr);max-width:100%;}
  .mod-row{grid-template-columns:1fr;gap:32px;}
  .steps{grid-template-columns:1fr 1fr;gap:28px;}
  .steps::before{display:none;}
  .cmp-hdr,.cmp-row{grid-template-columns:120px 1fr 1fr;}
  .cmp-hdr>div:last-child,.cmp-row>div:last-child{display:none;}
  .t-grid{grid-template-columns:1fr;}
  .demo-card{grid-template-columns:1fr;}
  .demo-l{padding:40px 24px 24px;}
  .demo-r{padding:0 24px 40px;}
  .f2{grid-template-columns:1fr;}
  .benefits-grid{grid-template-columns:1fr;}
  .outcomes-grid{grid-template-columns:1fr 1fr;}
  .mod-highlights{grid-template-columns:1fr 1fr;}
}
@media(max-width:480px){
  .hero-h1{font-size:2rem;}
  .hero-btns{flex-direction:column;}
  .hero-btns .btn-p,.hero-btns .btn-o{justify-content:center;}
  section,#about,.outcomes-strip,.benefits-sec,.intel-sec,.modules-sec{padding-top:48px;padding-bottom:48px;padding-left:16px;padding-right:16px;}
  .sh2{font-size:1.85rem;}
  .nums{grid-template-columns:1fr;}
  .steps{grid-template-columns:1fr;}
  footer{grid-template-columns:1fr;}
  .about-values{grid-template-columns:1fr;}
  .team-grid{grid-template-columns:1fr;}
  .trust,.integ{padding-left:16px;padding-right:16px;flex-direction:column;align-items:flex-start;}
  .outcomes-grid{grid-template-columns:1fr;}
  .mod-highlights{grid-template-columns:1fr;}
}
`;

export default function Pratyeksha() {
  const [loaderOut, setLoaderOut] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showThanks, setShowThanks] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState({tenantCount:47, ordersCount:15000, citiesCount:4});
  const [form, setForm] = useState({name:'',restaurant:'',phone:'',email:'',type:'',tables:'',city:''});
  const [activeIntel, setActiveIntel] = useState(0);
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(()=>{
    if (!document.getElementById('pratyeksha-css')) {
      const el = document.createElement('style');
      el.id = 'pratyeksha-css';
      el.textContent = CSS;
      document.head.appendChild(el);
    }
    if (!document.getElementById('pratyeksha-scroll-fix')) {
      const sf = document.createElement('style');
      sf.id = 'pratyeksha-scroll-fix';
      sf.textContent = `
        html { overflow-y: scroll !important; overflow-x: hidden !important; height: auto !important; }
        body { overflow-y: auto !important; overflow-x: hidden !important; height: auto !important; min-height: 100vh !important; }
        #root { overflow: visible !important; height: auto !important; min-height: 100vh !important; }
      `;
      document.head.appendChild(sf);
    }
    fetch(`${BASE_URL}/platform-stats`)
      .then(r=>r.json()).then(d=>{ if(d.success&&d.stats) setStats(d.stats); }).catch(()=>{});
    const t = setTimeout(()=>{ setLoaderOut(true); initReveal(); }, 2600);
    const onScroll = ()=> setNavScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, {passive:true});
    let cx=0, cy=0, rx=0, ry=0, raf;
    const onMove = e => { cx=e.clientX; cy=e.clientY;
      if(dotRef.current){ dotRef.current.style.left=cx+'px'; dotRef.current.style.top=cy+'px'; }
    };
    const tick = ()=>{
      rx+=(cx-rx)*0.14; ry+=(cy-ry)*0.14;
      if(ringRef.current){ ringRef.current.style.left=rx+'px'; ringRef.current.style.top=ry+'px'; }
      raf=requestAnimationFrame(tick);
    };
    raf=requestAnimationFrame(tick);
    document.addEventListener('mousemove', onMove, {passive:true});
    return () => {
      clearTimeout(t); cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('mousemove', onMove);
      document.getElementById('pratyeksha-css')?.remove();
      document.getElementById('pratyeksha-scroll-fix')?.remove();
    };
  },[]);

  const initReveal = ()=>{
    const obs = new IntersectionObserver(
      entries => entries.forEach(e=>{ if(e.isIntersecting){e.target.classList.add('on');obs.unobserve(e.target);} }),
      {threshold:0.06}
    );
    document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));
  };

  const addH = ()=>document.body.classList.add('ch');
  const remH = ()=>document.body.classList.remove('ch');
  const hp = {onMouseEnter:addH, onMouseLeave:remH};
  const go = id=>{ setMenuOpen(false); const el=document.getElementById(id); if(el) el.scrollIntoView({behavior:'smooth',block:'start'}); };
  const chg = e => setForm(p=>({...p,[e.target.id.replace('f-','')]:e.target.value}));
  const submit = async e=>{
    e.preventDefault(); setSubmitting(true);
    try{
      await fetch(`${BASE_URL}/demo-request`,{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({name:form.name,restaurant:form.restaurant,phone:form.phone,email:form.email,type:form.type,tables:form.tables,city:form.city})
      });
    }catch{}
    setShowThanks(true);
    setForm({name:'',restaurant:'',phone:'',email:'',type:'',tables:'',city:''});
    setSubmitting(false);
  };

  const intelCategories = [
    {
      icon:<IcoBar size={14}/>,title:'Menu Engineering',desc:'Dish profitability, Star/Plowhorse/Puzzle/Dog matrix, dead-item detection',
      items:['Re-price your Paneer Tikka — it has 8% margin, not 22%','3 dishes unsold in 14 days — candidates for menu removal','Your most-ordered item has a recipe coverage gap — link ingredients to get true cost','Combo opportunity: Masala Chai + Samosa ordered together 67% of the time']
    },
    {
      icon:<IcoActivity size={14}/>,title:'Operations Intelligence',desc:'Table performance, kitchen prep time, peak hours, dwell time analytics',
      items:['Table 3 averages 94-minute dwell — highest in the restaurant','Kitchen prep times spiked 40% on Friday evenings — consider pre-prep','Peak hour 7–9 PM generates 58% of daily revenue — staff accordingly','3 tables have below-average revenue per cover — investigate floor layout']
    },
    {
      icon:<IcoPackage size={14}/>,title:'Inventory Health',desc:'Stock alerts, WAC drift, procurement timing, capital tied up in ingredients',
      items:['Onions are 3 days from stockout based on 30-day usage','Tomato puree cost spiked 31% above WAC — switch vendor or adjust recipe costing','₹14,200 tied up in slow-moving dry goods — review par levels','Procurement predictor: order cream and butter by Thursday to avoid weekend gap']
    },
    {
      icon:<IcoUsers size={14}/>,title:'Staff & Payroll',desc:'Efficiency tracking, revenue per hour, scheduling optimization, payroll status',
      items:['Waiter Ramesh generates ₹2,100/hour — highest efficiency on floor','3 staff members clocked overtime this week — review scheduling','Payroll pending: ₹48,000 due by end of month for 6 staff','Understaffed on Tuesday lunch — only 1 waiter covering 8 tables']
    },
    {
      icon:<IcoDollar size={14}/>,title:'Financial Health',desc:'P&L, break-even tracker, GST compliance, aggregator performance',
      items:['You are 73% to this month\'s break-even — on track','GSTR-3B deadline in 8 days — ₹12,400 GST due','Zomato commission 22% vs Swiggy 18% — review platform mix','Food cost ratio at 34% — industry benchmark is 28-32%, action needed']
    },
    {
      icon:<IcoRepeat size={14}/>,title:'Customer Retention',desc:'Repeat rate, loyalty tracking, revenue source breakdown, waitlist conversion',
      items:['Repeat customer rate dropped from 42% to 31% — investigate','17 loyalty customers haven\'t visited in 30+ days — send a campaign','Waitlist-to-seated conversion at 61% — industry average is 74%','Online channel growing 18% MoM — consider expanding aggregator hours']
    },
  ];

  return (
    <>
      <div id="cur-dot" ref={dotRef}/>
      <div id="cur-ring" ref={ringRef}/>

      {/* Loader */}
      <div id="loader" className={loaderOut?'out':''}>
        <div className="l-logo">Pratyeksha</div>
        <div className="l-sub">Restaurant &amp; Cafe Platform</div>
        <div className="l-bar"><div className="l-fill"/></div>
      </div>

      {/* Thanks */}
      <div className={`thanks${showThanks?' show':''}`}>
        <div className="thanks-icon"><IcoChkBig/></div>
        <div className="thanks-title">Demo Requested!</div>
        <div className="thanks-desc">Our team will reach you within 4 business hours and walk you through every feature live.</div>
        <div className="thanks-contacts">
          <a href="tel:+918767622654">+91 87676 22654</a>
          <a href="tel:+918605015294">+91 86050 15294</a>
          <a href="mailto:hello.pratyeksha@gmail.com">hello.pratyeksha@gmail.com</a>
        </div>
        <button className="thanks-close" onClick={()=>setShowThanks(false)}>Close</button>
      </div>

      {/* Mobile menu */}
      <div id="mmenu" className={menuOpen?'open':''}>
        <button className="mm-close" onClick={()=>setMenuOpen(false)}>&#10005;</button>
        {[['about','About'],['features','Features'],['modules','Modules'],['benefits','Business Impact'],['compare','Compare'],['contact','Book Demo']].map(([id,label])=>(
          <a key={id} onClick={()=>go(id)}>{label}</a>
        ))}
      </div>

      {/* Nav */}
      <nav className={navScrolled?'s':''}>
        <a className="nav-logo" onClick={()=>go('home')} {...hp}>
          <div className="nav-icon"><IcoLogo/></div>
          <div className="nav-name">Pratyeksha</div>
        </a>
        <div className="nav-links">
          {[['about','About'],['features','Features'],['modules','Modules'],['benefits','Impact'],['compare','Compare'],['contact','Contact']].map(([id,label])=>(
            <a key={id} onClick={()=>go(id)} {...hp}>{label}</a>
          ))}
          <a className="nav-cta" onClick={()=>go('contact')} {...hp}>Book a Demo</a>
        </div>
        <button className="nav-ham" onClick={()=>setMenuOpen(v=>!v)}><span/><span/><span/></button>
      </nav>

      {/* ═══ HERO ═══ */}
      <section id="home" className="hero" style={{padding:0}}>
        <div className="hero-l">
          <div className="hero-eye"><span className="eye-line"/>Three Modules · One Complete Platform · Made in India</div>
          <h1 className="hero-h1">The Platform Built<br/>for <em>Modern Dining</em></h1>
          <p className="hero-sub">Pratyeksha unifies your Customer Menu, Kitchen Display, and Operator Portal — with AR menus, voice-controlled KDS, and 60 live business recommendations. Built for the way Indian restaurants actually operate.</p>
          <div className="hero-btns">
            <button className="btn-p" onClick={()=>go('contact')} {...hp}>Book Free Demo</button>
            <button className="btn-o" onClick={()=>go('modules')} {...hp}>See All Modules</button>
          </div>
          <div className="hero-kpis">
            <div className="kpi"><span className="kpi-v">3 min</span><span className="kpi-l">Setup Time</span></div>
            <div className="kpi-s"/>
            <div className="kpi"><span className="kpi-v">AR + 3D</span><span className="kpi-l">Menu First</span></div>
            <div className="kpi-s"/>
            <div className="kpi"><span className="kpi-v">60</span><span className="kpi-l">Live AI Insights</span></div>
            <div className="kpi-s"/>
            <div className="kpi"><span className="kpi-v">24/7</span><span className="kpi-l">Live Support</span></div>
          </div>
        </div>
        <div className="hero-r">
          <div className="hero-r-bg"/>
          <div className="hero-dash">
            <div className="dh"><span className="dh-t">Live Dashboard</span><span className="dh-l"><span className="ldot"/>Live</span></div>
            <div className="ds">
              <div className="dc"><div className="dn">&#8377;24,380</div><div className="dl">Today's Revenue</div></div>
              <div className="dc"><div className="dn">+18.4%</div><div className="dl">vs Yesterday</div></div>
            </div>
            {[['Table 1','OCCUPIED','occ'],['Table 4','CHECKOUT','chk'],['Table 7','OCCUPIED','occ'],['Table 9','EMPTY','emp']].map(([t,s,c])=>(
              <div className="dr" key={t}><span className="dtbl">{t}</span><span className={`dbg ${c}`}>{s}</span></div>
            ))}
          </div>
        </div>
      </section>

      <div className="trust">
        <span className="trust-lbl">Trusted across Maharashtra</span>
        <div className="trust-pills">
          {['Kolhapur','Pune','Mumbai','Sangli'].map(c=><div className="tp" key={c}><span className="tp-dot"/>{c}</div>)}
        </div>
      </div>

      <div className="integ">
        <span className="integ-lbl">Works seamlessly with</span>
        <div className="integ-pills">
          {[['Swiggy','#fc8019'],['Zomato','#cb202d'],['UPI / BHIM','#097939'],['Paytm','#002970'],['Razorpay','#2d60ed']].map(([n,c])=>(
            <div className="ip" key={n}><span className="idot" style={{background:c}}/>{n}</div>
          ))}
        </div>
      </div>

      {/* ═══ FEATURES ═══ */}
      <section id="features">
        <div className="center reveal">
          <div className="eye">Why Pratyeksha</div>
          <h2 className="sh2">Everything your establishment<br/><em>actually needs</em></h2>
          <p className="sdesc">One complete platform across three modules — Customer Menu, Kitchen Display, and Operator Portal. Every department connected in real-time, built for the way Indian cafes and restaurants actually operate.</p>
        </div>
        <div className="feat-grid">
          {[
            {icon:<IcoLayers/>,t:'AR + 3D Customer Menu',d:'Customers scan your QR and see every dish in full 3D on their own phone — no app required. Rotate, zoom, and virtually place dishes on the table before ordering. Chef narrates specials in Marathi and English.',lnk:'ar-module',lbl:'Explore AR Menu'},
            {icon:<IcoMon/>,t:'Voice-Controlled Kitchen Display',d:'Voice-activated KDS with FIFO speech queue, per-item cooking timers, and category-wise ticket routing. Say "complete table 7" with wet hands — done. Fully bilingual in English and Marathi.',lnk:'kds-module',lbl:'Explore KDS'},
            {icon:<IcoFile/>,t:'Smart Billing Hub',d:'One-tap settlement aggregates every order round into a single CGST/SGST-compliant invoice. Split across Cash, UPI, and Card in any ratio. IST-sequential bill numbers. Zero reconciliation.',lnk:'billing-module',lbl:'Explore Billing'},
            {icon:<IcoBox/>,t:'Inventory + Recipe Engine',d:'Link each dish to exact ingredients once. Every settlement automatically deducts precise amounts — down to the gram. Weighted Average Cost recalculates on every restock. Auto-procurement predictor.',lnk:'inventory-module',lbl:'Explore Inventory'},
            {icon:<IcoBar/>,t:'Business Intelligence Suite',d:'Peak-hour heatmaps, true dish profitability from real ingredient costs, Menu Engineering Matrix, GST compliance countdown, full P&L, and 60 live AI recommendations. One-click Excel export.',lnk:'insights-module',lbl:'Explore Insights'},
            {icon:<IcoUsers/>,t:'Staff, Attendance & Payroll',d:'Clock-in/clock-out with IST timestamps. Monthly attendance ledger feeds directly into payroll calculation. One-tap salary slip PDF with deductions. Live floor coverage density per shift.',lnk:'staff-module',lbl:'Explore Staff'},
          ].map(({icon,t,d,lnk,lbl},i)=>(
            <div className={`feat reveal rd${(i%3)+1}`} key={t} {...hp}>
              <div className="feat-icon">{icon}</div>
              <div className="feat-t">{t}</div>
              <div className="feat-d">{d}</div>
              <button className="feat-lnk" onClick={()=>go(lnk)}>{lbl} &rarr;</button>
            </div>
          ))}
        </div>
        <div className="nums reveal">
          {[[`${stats.tenantCount}+`,'Active Establishments','Cafes & Restaurants'],
            [`${stats.ordersCount}+`,'Orders Processed','Via Pratyeksha'],
            [`${stats.citiesCount}+`,'Cities Covered','Across Maharashtra'],
            ['4.9','Customer Rating',`From ${stats.tenantCount} reviews`]].map(([v,l,s])=>(
            <div className="nc" key={l}><div className="nv">{v}</div><div className="nl">{l}</div><div className="ns">{s}</div></div>
          ))}
        </div>
      </section>

      {/* ═══ OUTCOMES ═══ */}
      <div className="outcomes-strip reveal">
        <div className="center">
          <div className="eye" style={{color:'rgba(184,151,90,.6)'}}>Measured Impact</div>
          <h2 className="sh2" style={{color:'#fff'}}>What changes in <em>week one</em></h2>
          <p className="sdesc" style={{color:'rgba(255,255,255,.38)',margin:'0 auto'}}>Not promises — outcomes verified by restaurant owners currently on the platform across Maharashtra.</p>
        </div>
        <div className="outcomes-grid">
          {[
            {icon:<IcoDollar size={16}/>,v:'&#8377;20k–80k',t:'Margin Recovered Monthly',d:'By identifying dishes losing money via the recipe-based profitability matrix — a single pricing correction owners were unable to see without real cost data.'},
            {icon:<IcoZap size={16}/>,v:'40%',t:'Faster Kitchen Throughput',d:'Voice KDS eliminates screen-touching during service. FIFO speech queue and aggregate summary view cut per-ticket time significantly.'},
            {icon:<IcoClock size={16}/>,v:'Under 1hr',t:'Full Onboarding',d:'No hardware. No on-site visit. Menu digitized with 3D visuals, QR codes printed and sent, first live order running within hours.'},
            {icon:<IcoRepeat size={16}/>,v:'3x',t:'More Google Reviews',d:'The post-checkout Google Review prompt shown at the exact moment guests are most satisfied drives review volume without any extra staff effort.'},
            {icon:<IcoTarget size={16}/>,v:'Zero',t:'End-of-Day Reconciliation',d:'Automatic CGST/SGST, sequential invoice numbering, and settlement guards eliminate the traditional nightly billing cross-check entirely.'},
            {icon:<IcoPieChart size={16}/>,v:'60',t:'Live Business Recommendations',d:'A continuously updating AI engine covering menu engineering, inventory health, staff scheduling, GST deadlines, and aggregator performance.'},
            {icon:<IcoActivity size={16}/>,v:'Real-time',t:'Multi-Device Sync',d:'Socket.IO sync across every kitchen station, billing screen, and manager device. A kitchen mark propagates to billing in under a second.'},
            {icon:<IcoGlobe size={16}/>,v:'Bilingual',t:'English + Marathi Throughout',d:'Every customer-facing screen available in both languages. Voice commands understood in both. The platform respects how your staff and guests actually communicate.'},
          ].map(({icon,v,t,d})=>(
            <div className="oc reveal" key={t} {...hp}>
              <div className="oc-icon">{icon}</div>
              <div className="oc-v" dangerouslySetInnerHTML={{__html:v}}/>
              <div className="oc-t">{t}</div>
              <div className="oc-d">{d}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ WHY US ═══ */}
      <section style={{background:'var(--cream2)',paddingTop:0,paddingBottom:96}}>
        <div className="why-grid reveal">
          <div className="why-l">
            <div className="eye" style={{color:'var(--gold)'}}>The Pratyeksha Difference</div>
            <div className="why-h">Not just software.<br/><em>A dedicated partner</em> for your establishment.</div>
            <div className="why-b">Most restaurant software is built by engineers who've never worked a dinner rush. Pratyeksha was designed alongside real restaurant owners in Kolhapur, Pune, and Mumbai — people who know what it means when a table is waiting and the kitchen is three orders behind simultaneously.</div>
            <div className="why-sts">
              {[['Less than 1hr','Onboarding'],['Zero','Hardware Needed'],['Live','Support Always'],['60','AI Recommendations']].map(([v,l])=>(
                <div key={l}><div className="ws-v">{v}</div><div className="ws-l">{l}</div></div>
              ))}
            </div>
          </div>
          <div className="why-r">
            {[
              {icon:<IcoShield/>,t:'Built for Indian Regulations',d:'IST-anchored billing, GST-compliant invoices with CGST/SGST split, GSTIN and FSSAI number on every bill, Swiggy/Zomato order reconciliation, and GSTR-1/GSTR-3B filing-ready exports — all out of the box.'},
              {icon:<IcoClock/>,t:'Real-Time Across Every Device',d:'A menu change on the portal reflects on every customer phone within seconds. A kitchen ticket completed updates billing instantly. Socket.IO sync across every screen, every station, always.'},
              {icon:<IcoDollar/>,t:'Pays for Itself in Week One',d:'Owners tracking dish profitability through our recipe engine routinely find items losing margin. One pricing correction can recover ₹20,000–₹80,000 per month — that\'s years of platform cost recovered in days.'},
              {icon:<IcoPhone/>,t:'Human Support, Always',d:'Not a ticket system. Not a chatbot. When you call, our team answers — and we know your restaurant by name. Dedicated support that understands Indian kitchens, GST, and dinner rush realities.'},
            ].map(({icon,t,d})=>(
              <div className="why-pt" key={t}>
                <div className="wpi">{icon}</div>
                <div><div className="wp-t">{t}</div><div className="wp-d">{d}</div></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ MODULES ═══ */}
      <section id="modules" className="modules-sec" style={{paddingTop:96,paddingBottom:96}}>
        <div className="center reveal" style={{marginBottom:80}}>
          <div className="eye">Platform Modules</div>
          <h2 className="sh2">Three modules. <em>One system.</em></h2>
          <p className="sdesc">Customer Menu, Kitchen Display, and Operator Portal — deeply integrated modules communicating in real-time so your floor, kitchen, billing, and inventory are always in perfect sync.</p>
        </div>

        {/* MODULE 1 — CUSTOMER MENU */}
        <div id="ar-module" className="mod-row reveal">
          <div>
            <div className="mbadge"><IcoLayers size={13}/>Module 01 — Customer Menu &amp; Ordering App</div>
            <div className="meye">Customer Experience</div>
            <h3 className="mh3">The menu your guests will <em>talk about</em></h3>
            <p className="mp">India's first restaurant QR menu with AR dish visualization. Customers rotate, zoom, and virtually place dishes on their table before ordering — in Marathi and English with chef narration. No app install required. Works on any smartphone.</p>
            <ul className="mul">
              <ChkItem>AR food preview with "View in Your Space" — full 3D rotation on any phone</ChkItem>
              <ChkItem>Bilingual menu (English + Marathi) — instant toggle, no separate cards</ChkItem>
              <ChkItem>Auto Bestseller and Chef Pick badges calculated from real sales data</ChkItem>
              <ChkItem>Half/Full portion pricing with independent add-to-cart controls</ChkItem>
              <ChkItem>Live order status tracking — In the Kitchen, Ready, Served</ChkItem>
              <ChkItem>One-tap service requests (spoons, napkins, table cleaning) direct to staff</ChkItem>
              <ChkItem>QR-based digital waitlist — join, see live position, pre-order while waiting</ChkItem>
              <ChkItem>Instant GST-compliant digital invoice, downloadable as PDF</ChkItem>
            </ul>
            <div className="mod-highlights">
              {[{icon:<IcoGlobe size={12}/>,t:'No App Install'},{icon:<IcoMic size={12}/>,t:'Chef Narration'},{icon:<IcoBell size={12}/>,t:'Push Notifications'}].map(({icon,t})=>(
                <div className="mh-pill" key={t}><span className="mh-pill-icon">{icon}</span>{t}</div>
              ))}
            </div>
            <div style={{marginTop:24}}>
              <button className="btn-p" onClick={()=>go('contact')} {...hp}>Get This Module &rarr;</button>
            </div>
          </div>
          <ModPH icon={<IcoLayers size={24}/>} label="AR Menu Screenshot" sublabel="Replace: screenshots/ar-menu.jpg" tag="AR · 3D · Bilingual"/>
        </div>

        {/* MODULE 2 — KDS */}
        <div id="kds-module" className="mod-row reveal" style={{direction:'rtl'}}>
          <div style={{direction:'ltr'}}>
            <div className="mbadge"><IcoMon size={13}/>Module 02 — Kitchen Display System</div>
            <div className="meye">Kitchen Intelligence</div>
            <h3 className="mh3">A display that <em>thinks with you</em></h3>
            <p className="mp">Designed for real kitchen chaos — voice commands in English and Marathi, FIFO speech queue so new orders announce themselves, per-item cooking timers, and category-wise routing so each station only sees what's relevant.</p>
            <ul className="mul">
              <ChkItem>Voice control: "Complete table 7," "&#2335;&#2375;&#2348;&#2354; &#2340;&#2351;&#2366;&#2352;" — hands-free dispatch</ChkItem>
              <ChkItem>Per-item cooking timer with 5-minute SLOW flag — catch delays while still cooking</ChkItem>
              <ChkItem>Prep Queue marquee: top 5 most-needed dishes across all active tickets</ChkItem>
              <ChkItem>Aggregate Summary view — total of every dish across the kitchen for batch cooking</ChkItem>
              <ChkItem>86-kill toggle removes a sold-out dish from the live customer menu instantly</ChkItem>
              <ChkItem>Wastage logging with auto cost calculation and inventory deduction</ChkItem>
              <ChkItem>Recall system — bring back any of the last 10 completed tickets</ChkItem>
              <ChkItem>Swiggy/Zomato orders on the same screen with platform color-coding</ChkItem>
            </ul>
            <div className="mod-highlights">
              {[{icon:<IcoMic size={12}/>,t:'Bilingual Voice'},{icon:<IcoZap size={12}/>,t:'FIFO Queue'},{icon:<IcoTarget size={12}/>,t:'Per-Item Timers'}].map(({icon,t})=>(
                <div className="mh-pill" key={t}><span className="mh-pill-icon">{icon}</span>{t}</div>
              ))}
            </div>
            <div style={{marginTop:24}}>
              <button className="btn-p" onClick={()=>go('contact')} {...hp}>Get This Module &rarr;</button>
            </div>
          </div>
          <div style={{direction:'ltr'}}>
            <ModPH icon={<IcoMon size={24}/>} label="KDS Screenshot" sublabel="Replace: screenshots/kds.jpg" tag="Voice · FIFO · Real-time"/>
          </div>
        </div>

        {/* MODULE 3 — BILLING */}
        <div id="billing-module" className="mod-row reveal">
          <div>
            <div className="mbadge"><IcoFile size={13}/>Module 03 — Smart Billing Hub</div>
            <div className="meye">Billing &amp; Settlement</div>
            <h3 className="mh3">Settlement that's <em>always right</em></h3>
            <p className="mp">From live floor map to printed receipt — under 60 seconds. No reconciliation. No end-of-day surprises. CGST/SGST calculated automatically. Every bill audit-ready from the moment it's issued.</p>
            <ul className="mul">
              <ChkItem>Live floor map — occupied, checkout-requested, and empty tables at a glance</ChkItem>
              <ChkItem>Auto-aggregates every order round into a single consolidated invoice</ChkItem>
              <ChkItem>Split payments across Cash, UPI, and Card in any ratio with mismatch validation</ChkItem>
              <ChkItem>IST-sequential bill numbers with GSTIN, FSSAI, and GST breakdown on every bill</ChkItem>
              <ChkItem>Concurrent-settlement lock and duplicate-settlement guard</ChkItem>
              <ChkItem>Download all today's invoices as a single multi-page PDF in one click</ChkItem>
              <ChkItem>Daily Settlement HUD — Cash, UPI, Card totals with CGST/SGST collected</ChkItem>
              <ChkItem>Direct Takeaway and Online Ordering billing modes</ChkItem>
            </ul>
            <div className="mod-highlights">
              {[{icon:<IcoShield size={12}/>,t:'GST Compliant'},{icon:<IcoGrid size={12}/>,t:'Split Payment'},{icon:<IcoFile size={12}/>,t:'Audit-Ready'}].map(({icon,t})=>(
                <div className="mh-pill" key={t}><span className="mh-pill-icon">{icon}</span>{t}</div>
              ))}
            </div>
            <div style={{marginTop:24}}>
              <button className="btn-p" onClick={()=>go('contact')} {...hp}>Get This Module &rarr;</button>
            </div>
          </div>
          <ModPH icon={<IcoFile size={24}/>} label="Billing Screenshot" sublabel="Replace: screenshots/billing.jpg" tag="GST · Split · Real-time"/>
        </div>

        {/* MODULE 4 — INVENTORY */}
        <div id="inventory-module" className="mod-row reveal" style={{direction:'rtl'}}>
          <div style={{direction:'ltr'}}>
            <div className="mbadge"><IcoBox size={13}/>Module 04 — Inventory + Recipe Engine</div>
            <div className="meye">Inventory Intelligence</div>
            <h3 className="mh3">Stock that manages <em>itself</em></h3>
            <p className="mp">Link each dish to its exact ingredients once. Every settlement automatically deducts the precise amounts — no manual entry, no end-of-week guesswork. Weighted Average Cost recalculates on every restock purchase.</p>
            <ul className="mul">
              <ChkItem>Recipe engine — one-time setup, auto deduction at every settlement down to the gram</ChkItem>
              <ChkItem>Weighted Average Cost auto-recalculates on restock with 25% price-spike alert</ChkItem>
              <ChkItem>Procurement Predictor — days of stock remaining from rolling 30-day usage</ChkItem>
              <ChkItem>Real dish profitability from live ingredient costs, not estimates</ChkItem>
              <ChkItem>Full purchase history ledger with vendor name and batch ID capture</ChkItem>
              <ChkItem>Auto-hide menu items the instant a linked ingredient hits zero stock</ChkItem>
              <ChkItem>Monthly wastage reports — cost lost by ingredient, by reason, daily trend</ChkItem>
              <ChkItem>Export full inventory register as a styled Excel workbook in one click</ChkItem>
            </ul>
            <div className="mod-highlights">
              {[{icon:<IcoZap size={12}/>,t:'Auto-Deduct'},{icon:<IcoDollar size={12}/>,t:'WAC Costing'},{icon:<IcoTrend size={12}/>,t:'Procurement AI'}].map(({icon,t})=>(
                <div className="mh-pill" key={t}><span className="mh-pill-icon">{icon}</span>{t}</div>
              ))}
            </div>
            <div style={{marginTop:24}}>
              <button className="btn-p" onClick={()=>go('contact')} {...hp}>Get This Module &rarr;</button>
            </div>
          </div>
          <div style={{direction:'ltr'}}>
            <ModPH icon={<IcoBox size={24}/>} label="Inventory Screenshot" sublabel="Replace: screenshots/inventory.jpg" tag="Recipe-linked · Auto-deduct"/>
          </div>
        </div>

        {/* MODULE 5 — INSIGHTS */}
        <div id="insights-module" className="mod-row reveal">
          <div>
            <div className="mbadge"><IcoBar size={13}/>Module 05 — Business Intelligence Dashboard</div>
            <div className="meye">Analytics &amp; Insights</div>
            <h3 className="mh3">Data that drives <em>real decisions</em></h3>
            <p className="mp">Not vanity metrics. Real operational intelligence — which dishes are losing money, when your kitchen is overwhelmed, whether customers are actually returning. Month navigator with auto-generated smart digest, trend, and forecast.</p>
            <ul className="mul">
              <ChkItem>Menu Intelligence — Star/Plowhorse/Puzzle/Dog matrix, dead-item detection</ChkItem>
              <ChkItem>Peak-hour heatmap calendar — which hours and days actually drive revenue</ChkItem>
              <ChkItem>Table performance — revenue, turns, dwell time, and cost per cover</ChkItem>
              <ChkItem>Full P&L with break-even tracker and live progress bar</ChkItem>
              <ChkItem>GST compliance — CGST/SGST due, GSTR-1/GSTR-3B deadline countdowns</ChkItem>
              <ChkItem>Aggregator revenue — per-platform Swiggy/Zomato performance breakdown</ChkItem>
              <ChkItem>Customer retention — repeat rate, loyalty score, revenue source breakdown</ChkItem>
              <ChkItem>Excel export suite: 12 sheets including GST register and invoice register</ChkItem>
            </ul>
            <div className="mod-highlights">
              {[{icon:<IcoPieChart size={12}/>,t:'P&L Tracker'},{icon:<IcoAward size={12}/>,t:'Menu Matrix'},{icon:<IcoTrend size={12}/>,t:'Forecasting'}].map(({icon,t})=>(
                <div className="mh-pill" key={t}><span className="mh-pill-icon">{icon}</span>{t}</div>
              ))}
            </div>
            <div style={{marginTop:24}}>
              <button className="btn-p" onClick={()=>go('contact')} {...hp}>Get This Module &rarr;</button>
            </div>
          </div>
          <ModPH icon={<IcoBar size={24}/>} label="Analytics Screenshot" sublabel="Replace: screenshots/insights.jpg" tag="Real-time · Exportable"/>
        </div>

        {/* MODULE 6 — STAFF */}
        <div id="staff-module" className="mod-row reveal" style={{direction:'rtl'}}>
          <div style={{direction:'ltr'}}>
            <div className="mbadge"><IcoUsers size={13}/>Module 06 — Staff, Attendance &amp; Payroll</div>
            <div className="meye">Workforce Management</div>
            <h3 className="mh3">Your team, <em>fully accounted for</em></h3>
            <p className="mp">From daily clock-in to monthly salary slip — every piece of workforce data in one place. Live floor coverage shows which tables have active waitstaff before a problem reaches the customer.</p>
            <ul className="mul">
              <ChkItem>Clock-in/clock-out with IST timestamps and auto overtime flagging</ChkItem>
              <ChkItem>Monthly attendance ledger feeds directly into payroll calculation</ChkItem>
              <ChkItem>One-tap salary slip PDF with attendance-based deductions</ChkItem>
              <ChkItem>Pending payroll total auto-calculated — no manual addition</ChkItem>
              <ChkItem>Live floor coverage — which waiters are on shift, which tables are covered</ChkItem>
              <ChkItem>Revenue per hour tracked per team member, monthly</ChkItem>
              <ChkItem>Full staff roster with role, shift type, cuisine specialization, and tenure</ChkItem>
              <ChkItem>Table assignment map — assign specific tables to specific waitstaff</ChkItem>
            </ul>
            <div className="mod-highlights">
              {[{icon:<IcoClock size={12}/>,t:'Auto Payroll'},{icon:<IcoGrid size={12}/>,t:'Floor Map'},{icon:<IcoTrend size={12}/>,t:'Staff Efficiency'}].map(({icon,t})=>(
                <div className="mh-pill" key={t}><span className="mh-pill-icon">{icon}</span>{t}</div>
              ))}
            </div>
            <div style={{marginTop:24}}>
              <button className="btn-p" onClick={()=>go('contact')} {...hp}>Get This Module &rarr;</button>
            </div>
          </div>
          <div style={{direction:'ltr'}}>
            <ModPH icon={<IcoUsers size={24}/>} label="Staff Screenshot" sublabel="Replace: screenshots/staff.jpg" tag="Clock-in · Payroll · Live"/>
          </div>
        </div>
      </section>

      {/* ═══ BUSINESS BENEFITS ═══ */}
      <section id="benefits" className="benefits-sec">
        <div className="center reveal">
          <div className="eye">Business Impact</div>
          <h2 className="sh2">Ten ways Pratyeksha<br/><em>improves your bottom line</em></h2>
          <p className="sdesc">Organized by the real problems owners care about — not features, but outcomes.</p>
        </div>
        <div className="benefits-grid">
          {[
            {
              icon:<IcoDollar/>,title:'More Revenue',sub:'Without more work',
              items:['AR dish preview and Bestseller badges drive higher order confidence and larger baskets','Half/Full portion pricing captures customers who\'d otherwise skip a dish entirely','Extra items catalog turns idle counter stock into an active second revenue line','Menu Engineering Matrix shows precisely which dishes to promote, re-price, or drop','Aggregator integration opens a second sales channel without separate staff or tablets']
            },
            {
              icon:<IcoShield/>,title:'Less Money Lost',sub:'To waste, theft, and error',
              items:['Wastage logging converts vague waste into an exact rupee figure per item and reason','WAC price-spike alerts catch suppliers quietly raising prices before margins erode','Duplicate-settlement guard prevents tables from being accidentally billed twice','Auto inventory deduction means stock counts stay accurate without manual subtraction','Recipe-based profitability exposes dishes that look popular but lose money per plate']
            },
            {
              icon:<IcoZap/>,title:'Faster Service',sub:'Happier customers',
              items:['Live order timers with Fresh-Warm-Hot-Critical tiers make delayed tables visually impossible to miss','Per-item cooking timers flag slow dishes while still cooking, not after complaints','Aggregate Summary view lets kitchen batch-cook the same dish for multiple tables at once','One-tap service requests (spoons, napkins) eliminate the wait for a waiter to walk by','QR-based digital waitlist removes the awkward "how much longer?" conversation entirely']
            },
            {
              icon:<IcoTarget/>,title:'Zero Order Mix-Ups',sub:'Zero miscommunication',
              items:['Live order modification alerts — if a customer changes their order, the kitchen gets an instant flashing alert','Distinct sounds for dine-in vs takeaway vs Swiggy vs Zomato — chef knows order type before reading','Multi-screen real-time sync — one station marking an item done updates every other screen instantly','Recall system lets you undo a mistaken Complete without recreating the order from scratch','Aggregator accept/reject popup stops Swiggy/Zomato orders from silently flooding the kitchen']
            },
            {
              icon:<IcoFile/>,title:'GST Takes Care of Itself',sub:'Compliance without effort',
              items:['Automatic CGST/SGST on every bill — no manual tax math, no counter errors','Sequential invoice numbering with GSTIN and FSSAI printed automatically on every receipt','GST Invoice Register and Individual Invoice Register exports pre-formatted for GSTR-3B and GSTR-1','GSTR-1/GSTR-3B filing deadline countdowns visible inside the dashboard at all times','Download all today\'s invoices as one PDF — end-of-day reconciliation takes minutes, not hours']
            },
            {
              icon:<IcoUsers/>,title:'Staff Without Spreadsheets',sub:'Payroll in one tap',
              items:['Clock-in/clock-out with auto-calculated hours removes the need for a paper attendance register','Monthly attendance ledger feeds directly into payroll — no manual cross-check between systems','One-tap salary slip PDF turns a task that takes an evening into a single click per employee','Pending payroll total calculated automatically — instant answer to how much you owe staff','Live floor coverage catches understaffing in real time, not after a customer complains']
            },
            {
              icon:<IcoBar/>,title:'Smarter Decisions',sub:'Backed by real numbers',
              items:['60 AI-style business recommendations continuously surface what to act on — no digging required','Business health score gives one number to glance at before drilling into details','Month-over-month revenue trend and forecast lets you see a slowdown before month-end','Peak-hour intensity chart tells you exactly when to schedule more staff — and when you\'re overstaffed','Procurement Predictor stops you from over-ordering "just in case" or running out mid-service']
            },
            {
              icon:<IcoGlobe/>,title:'Stronger Online Presence',sub:'Without lifting a finger',
              items:['Google Review prompt shown at the exact moment guests are most satisfied — not three days later','Instagram follow prompt on the thank-you screen grows your social following with every visit','Custom broadcast/campaign tool lets you message past customers about new dishes or offers directly','Reservation pre-ordering means the kitchen preps ahead — table turns faster, next seating sooner','AR menu generates genuine word-of-mouth — customers screenshot and share, building reach for free']
            },
          ].map(({icon,title,sub,items})=>(
            <div className="ben-card reveal" key={title} {...hp}>
              <div className="ben-head">
                <div className="ben-icon">{icon}</div>
                <div><div className="ben-title">{title}</div><div className="ben-sub">{sub}</div></div>
              </div>
              <ul className="ben-list">
                {items.map((item,i)=>(
                  <li className="ben-item" key={i}><span className="ben-dot"/>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ INTELLIGENCE ENGINE ═══ */}
      <div className="intel-sec">
        <div className="center reveal">
          <div className="eye" style={{color:'rgba(184,151,90,.6)'}}>Intelligence Engine</div>
          <h2 className="sh2" style={{color:'#fff'}}>60 live recommendations.<br/><em>Always on.</em></h2>
          <p className="sdesc" style={{color:'rgba(255,255,255,.38)',margin:'0 auto'}}>A continuously updating recommendation engine covering every corner of your business — so you never have to dig through reports to know what needs attention right now.</p>
        </div>
        <div className="intel-grid reveal">
          <div className="intel-cats">
            {intelCategories.map((cat,i)=>(
              <div className={`intel-cat${activeIntel===i?' active':''}`} key={i} onClick={()=>setActiveIntel(i)} {...hp}>
                <div className="ic-head">
                  <div className="ic-icon">{cat.icon}</div>
                  <div className="ic-title">{cat.title}</div>
                </div>
                <div className="ic-desc">{cat.desc}</div>
              </div>
            ))}
          </div>
          <div className="intel-panel">
            <div className="intel-panel-title">Sample Recommendations — {intelCategories[activeIntel].title}</div>
            <div className="intel-items">
              {intelCategories[activeIntel].items.map((item,i)=>(
                <div className="intel-item" key={i}>
                  <span className="intel-item-dot"/>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="hiw">
        <div className="center reveal">
          <div className="eye" style={{color:'var(--gold)'}}>Getting Started</div>
          <h2 className="sh2" style={{color:'#fff'}}>Live in <em>under an hour</em></h2>
          <p className="sdesc" style={{color:'rgba(255,255,255,.32)',margin:'0 auto'}}>No hardware to buy. No on-site IT visit. No lengthy contracts. Your establishment goes digital in four steps — and we handle most of them ourselves.</p>
        </div>
        <div className="steps">
          {[
            ['1','Book a Demo','Talk to our team. We configure your account — menu, categories, tax settings, GSTIN — during the call itself.'],
            ['2','Upload Your Menu','Share your menu and we digitize it with 3D visuals, categories, prices, portions, and linked ingredients.'],
            ['3','Place QR Codes','We print and send your table QR codes. Guests scan, see AR dishes, and order — no app install needed.'],
            ['4','Start Operating','Every order, kitchen ticket, settlement, and insight flows live from day one. Your team adapts in minutes.'],
          ].map(([n,t,d],i)=>(
            <div className={`step reveal rd${i+1}`} key={n}>
              <div className="step-n">{n}</div>
              <div className="step-t">{t}</div>
              <div className="step-d">{d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ COMPARISON ═══ */}
      <section id="compare">
        <div className="center reveal">
          <div className="eye">Competitive Edge</div>
          <h2 className="sh2">Built differently, <em>by design</em></h2>
          <p className="sdesc">Features that legacy systems charge enterprise prices for — with an AR-first, voice-controlled experience no other system in India even offers.</p>
        </div>
        <div className="cmp-wrap reveal">
          <div className="cmp-hdr">
            <div className="cmp-hc"/>
            <div className="cmp-hc fc"><div className="cmp-badge">Our Platform</div><div className="cmp-hn">Pratyeksha</div><div className="cmp-hs">Cafes &amp; Restaurants</div></div>
            <div className="cmp-hc"><div className="cmp-hn" style={{color:'rgba(255,255,255,.38)'}}>Standard POS</div><div className="cmp-hs">&#8377;2k–5k / month</div></div>
            <div className="cmp-hc"><div className="cmp-hn" style={{color:'rgba(255,255,255,.38)'}}>Generic System</div><div className="cmp-hs">&#8377;1k–3k / month</div></div>
          </div>
          {[
            ['AR / 3D Menu',<><span className="cy">+</span> Full AR + Chef model</>,<><span className="cn">-</span><span style={{color:'rgba(255,255,255,.2)'}}> None</span></>,<><span className="cn">-</span><span style={{color:'rgba(255,255,255,.2)'}}> None</span></>],
            ['Voice-controlled KDS',<><span className="cy">+</span> FIFO speech queue</>,<><span className="cp">~</span><span style={{color:'rgba(255,255,255,.2)'}}> Basic KOT only</span></>,<><span className="cn">-</span><span style={{color:'rgba(255,255,255,.2)'}}> No KDS</span></>],
            ['Recipe-based profitability',<><span className="cy">+</span> Real ingredient costs</>,<><span className="cp">~</span><span style={{color:'rgba(255,255,255,.2)'}}> Limited</span></>,<><span className="cn">-</span><span style={{color:'rgba(255,255,255,.2)'}}> No</span></>],
            ['Auto inventory deduction',<><span className="cy">+</span> Every settlement</>,<><span className="cp">~</span><span style={{color:'rgba(255,255,255,.2)'}}> Manual tracking</span></>,<><span className="cn">-</span><span style={{color:'rgba(255,255,255,.2)'}}> No</span></>],
            ['60 AI recommendations',<><span className="cy">+</span> Live, always updating</>,<><span className="cn">-</span><span style={{color:'rgba(255,255,255,.2)'}}> None</span></>,<><span className="cn">-</span><span style={{color:'rgba(255,255,255,.2)'}}> None</span></>],
            ['Wastage cost tracking',<><span className="cy">+</span> Rupee-level accuracy</>,<><span className="cp">~</span><span style={{color:'rgba(255,255,255,.2)'}}> Quantity only</span></>,<><span className="cn">-</span><span style={{color:'rgba(255,255,255,.2)'}}> No</span></>],
            ['Swiggy + Zomato sync',<><span className="cy">+</span> Unified queue</>,<><span className="cy">+</span><span style={{color:'rgba(255,255,255,.2)'}}> Available</span></>,<><span className="cn">-</span><span style={{color:'rgba(255,255,255,.2)'}}> Manual import</span></>],
            ['Multilingual menu',<><span className="cy">+</span> English + Marathi</>,<><span className="cn">-</span><span style={{color:'rgba(255,255,255,.2)'}}> English only</span></>,<><span className="cn">-</span><span style={{color:'rgba(255,255,255,.2)'}}> English only</span></>],
            ['GSTR-ready exports',<><span className="cy">+</span> GSTR-1 &amp; GSTR-3B</>,<><span className="cp">~</span><span style={{color:'rgba(255,255,255,.2)'}}> Basic export</span></>,<><span className="cn">-</span><span style={{color:'rgba(255,255,255,.2)'}}> No</span></>],
            ['Setup time',<><span className="cy">+</span> Under 1 hour</>,<><span className="cn">-</span><span style={{color:'rgba(255,255,255,.2)'}}> Days of setup</span></>,<><span className="cp">~</span><span style={{color:'rgba(255,255,255,.2)'}}> Half day</span></>],
            ['Dedicated human support',<><span className="cy">+</span> Named support team</>,<><span className="cn">-</span><span style={{color:'rgba(255,255,255,.2)'}}> Ticket system</span></>,<><span className="cn">-</span><span style={{color:'rgba(255,255,255,.2)'}}> Self-service only</span></>],
          ].map(([lbl,c1,c2,c3])=>(
            <div className="cmp-row" key={lbl}>
              <div className="cmp-c lbl">{lbl}</div>
              <div className="cmp-c fc">{c1}</div>
              <div className="cmp-c">{c2}</div>
              <div className="cmp-c">{c3}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section style={{background:'var(--cream2)'}}>
        <div className="center reveal">
          <div className="eye">From Our Customers</div>
          <h2 className="sh2">Real results from <em>real kitchens</em></h2>
          <p className="sdesc" style={{margin:'0 auto'}}>Every establishment below was running manual processes before Pratyeksha. Here's what changed.</p>
        </div>
        <div className="t-grid">
          {[
            {av:'RS',text:'"The AR menu doubled our social media tags in one week. Two regulars specifically came back because they wanted to show their friends the experience. The Bestseller badges also visibly changed what tables were ordering."',name:'Raj S.',role:'Owner · Jay Ambe Fusion, Kolhapur',d:'rd1'},
            {av:'NK',text:'"Our kitchen is 40% faster since switching. Voice control means my chefs never touch the screen during a rush — orders announce themselves via the FIFO queue. The per-item timers catch slow dishes before guests notice."',name:'Nilesh K.',role:'Head Chef · Premium Cafe, Pune',d:'rd2'},
            {av:'PM',text:'"The profitability matrix revealed our most popular item had 12% margin. We adjusted pricing and recovered ₹40,000 in the first month. That single insight from the recipe engine paid for the platform for years."',name:'Pratik M.',role:'Owner · Cloud Kitchen, Mumbai',d:'rd3'},
          ].map(({av,text,name,role,d})=>(
            <div className={`t-card reveal ${d}`} key={av} {...hp}>
              <Stars5/>
              <div className="t-text">{text}</div>
              <div className="t-author">
                <div className="t-av">{av}</div>
                <div><div className="t-name">{name}</div><div className="t-role">{role}</div></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ ABOUT ═══ */}
      <section id="about">
        <div className="center reveal" style={{marginBottom:72}}>
          <div className="eye" style={{color:'rgba(184,151,90,.6)'}}>Our Story</div>
          <h2 className="sh2" style={{color:'#fff'}}>We help restaurants <em>grow</em><br/>and guests <em>remember</em></h2>
          <p className="sdesc" style={{color:'rgba(255,255,255,.38)'}}>From a simple idea in Kolhapur to a platform serving {stats.tenantCount}+ establishments across Maharashtra — built by people who understand the dinner rush firsthand.</p>
        </div>
        <div className="about-grid reveal">
          <div className="about-img-wrap">
            <div className="about-img-frame">
              <img src={logoImg} alt="Pratyeksha" style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}}/>
              <div className="about-ph"><IcoUser/><span>Founder Photo</span></div>
            </div>
            <div className="about-badge">
              <div className="about-badge-num">{stats.tenantCount}+</div>
              <div className="about-badge-lbl">Active<br/>Clients</div>
            </div>
          </div>
          <div className="about-text">
            <div className="eye" style={{color:'rgba(184,151,90,.6)'}}>Who We Are</div>
            <h2 className="about-h2">Not just software —<br/><em>a partner</em> for your kitchen</h2>
            <p className="about-lead">Pratyeksha was born from a simple observation: most restaurants were struggling not because of their food, but because of the systems — or lack thereof — running their operations.</p>
            <p className="about-body">We saw talented chefs and dedicated restaurant owners in Kolhapur, Pune, and Mumbai lose margin to bad billing, scramble through paper orders during rush hour, and have no way of knowing which dishes were actually profitable. We decided to fix that — with technology that respects how Indian restaurants actually work, not how Western software imagines they do.</p>
            <div className="about-values">
              {[
                {icon:<IcoLayers size={16}/>,t:'Innovation First',d:"Constant research drives features your competitors haven't shipped yet — AR menus, voice KDS, and 60 live AI recommendations."},
                {icon:<IcoClock size={16}/>,t:'Simplicity',d:"Designed for owners and staff who don't have time for instruction manuals — live in under an hour, no hardware required."},
                {icon:<IcoPhone size={16}/>,t:'Human Support',d:"Real people who know your restaurant by name. Not a ticket system — a dedicated team that understands Indian kitchens."},
                {icon:<IcoDollar size={16}/>,t:'Fair Pricing',d:"Transparent pricing designed for SMBs — the platform pays for itself in week one through margin recovery alone."},
              ].map(({icon,t,d})=>(
                <div className="av" key={t}>
                  <div className="av-icon">{icon}</div>
                  <div className="av-t">{t}</div>
                  <div className="av-d">{d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="about-stats reveal">
          {[[`${stats.tenantCount}+`,'Active Clients','Cafes & Restaurants'],
            [`${stats.ordersCount}+`,'Orders Processed','Via Pratyeksha'],
            [`${stats.citiesCount}+`,'Cities Covered','Across Maharashtra'],
            ['4.9','Customer Rating',`From ${stats.tenantCount} reviews`]].map(([v,l,s])=>(
            <div className="as" key={l}><div className="as-v">{v}</div><div className="as-l">{l}</div><div className="as-s">{s}</div></div>
          ))}
        </div>
        <div className="center reveal" style={{margin:'72px 0 32px'}}>
          <div className="eye" style={{color:'rgba(184,151,90,.6)'}}>The Team</div>
          <h2 className="sh2" style={{color:'#fff'}}>People behind <em>Pratyeksha</em></h2>
        </div>
        <div className="team-grid reveal">
          {[['P','Co-founder & CEO','Strategy, Product & Customer Success'],['T','Co-founder & CTO','Engineering, Platform & Infrastructure']].map(([letter,name,role])=>(
            <div className="team-card" key={letter} {...hp}>
              <div className="team-photo">
                <div className="team-ph">{letter}</div>
              </div>
              <div className="team-info"><div className="team-name">{name}</div><div className="team-role">{role}</div></div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ CONTACT ═══ */}
      <section id="contact">
        <div className="demo-card reveal">
          <div className="demo-l">
            <div className="demo-eye">Book a Demo</div>
            <h3 className="demo-h">See Pratyeksha in<br/><em>your establishment</em></h3>
            <p className="demo-d">Our team walks you through every module live — tailored to your restaurant type, team size, and current operational challenges. Account configured during the call itself. No pressure, no commitment.</p>
            <div className="demo-feats">
              {[
                {icon:<IcoClock size={15}/>,t:'30-minute personalized walkthrough',d:'Focused on your specific restaurant type, not a generic product tour — we ask about your challenges first'},
                {icon:<IcoFile size={15}/>,t:'Account configured during the call',d:'Menu, categories, pricing, tax settings, GSTIN, and FSSAI number loaded while we talk'},
                {icon:<IcoPin/>,t:'Local expertise, Indian context',d:'Built for Kolhapur, Pune, and Mumbai — we understand GST, UPI, Swiggy, and Indian kitchens intimately'},
              ].map(({icon,t,d})=>(
                <div className="df" key={t}>
                  <div className="df-icon">{icon}</div>
                  <div><div className="df-t">{t}</div><div className="df-d">{d}</div></div>
                </div>
              ))}
            </div>
            <div className="cq">
              <div className="cq-lbl">Reach us directly</div>
              <div className="cq-item">
                <span className="cq-icon"><IcoPhone size={14}/></span>
                <a className="cq-link" href="tel:+918767622654">+91 87676 22654</a>
                <span className="cq-sep"/>
                <a className="cq-link" href="tel:+918605015294">+91 86050 15294</a>
              </div>
              <div className="cq-item">
                <span className="cq-icon"><IcoMail/></span>
                <a className="cq-link" href="mailto:hello.pratyeksha@gmail.com">hello.pratyeksha@gmail.com</a>
              </div>
            </div>
          </div>
          <div className="demo-r">
            <form className="form-body" onSubmit={submit}>
              <div className="f2">
                <input className="fi" id="f-name" placeholder="Your Name *" required value={form.name} onChange={chg}/>
                <input className="fi" id="f-restaurant" placeholder="Restaurant / Cafe Name *" required value={form.restaurant} onChange={e=>setForm(p=>({...p,restaurant:e.target.value}))}/>
              </div>
              <div className="f2">
                <input className="fi" id="f-phone" type="tel" placeholder="Mobile Number *" required value={form.phone} onChange={chg}/>
                <input className="fi" id="f-email" type="email" placeholder="Email Address" value={form.email} onChange={chg}/>
              </div>
              <div className="fsel">
                <select className="fi" id="f-type" value={form.type} onChange={chg}>
                  <option value="" disabled>Establishment Type</option>
                  {['Fine Dining Restaurant','Cafe / Bistro','QSR / Fast Food','Cloud Kitchen','Dhaba / Street Food','Hotel F&B','Multi-outlet Chain'].map(o=><option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="fsel">
                <select className="fi" id="f-tables" value={form.tables} onChange={chg}>
                  <option value="" disabled>Number of Tables / Counters</option>
                  {['1–10','10–25','25–50','50+ / Cloud Kitchen'].map(o=><option key={o}>{o}</option>)}
                </select>
              </div>
              <input className="fi" id="f-city" placeholder="City (e.g. Kolhapur, Pune, Mumbai)" value={form.city} onChange={chg}/>
              <button type="submit" className="fsub" disabled={submitting} {...hp}>
                {submitting?'Sending...':'Request Free Demo'}
              </button>
              <p className="fnote">We will reach you within 4 hours during business hours. No spam, ever.</p>
            </form>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer>
        <div>
          <div className="f-brand">Pratyeksha</div>
          <div className="f-desc">India's most complete restaurant and cafe management platform — with the world's first AR-first digital menu built for dine-in, takeaway, and delivery.</div>
          <div className="f-tag">Visualize &middot; Order &middot; Relish</div>
        </div>
        <div className="f-col">
          <h5>Platform</h5>
          {[['ar-module','AR Customer Menu'],['kds-module','Kitchen Display System'],['billing-module','Billing Hub'],['insights-module','Insights Dashboard'],['inventory-module','Inventory Engine'],['staff-module','Staff Management']].map(([id,label])=>(
            <a key={id} onClick={()=>go(id)}>{label}</a>
          ))}
        </div>
        <div className="f-col">
          <h5>Company</h5>
          {[['about','About Us'],['benefits','Business Impact'],['contact','Book a Demo'],['compare','Compare']].map(([id,label],i)=>(
            <a key={i} onClick={()=>go(id)}>{label}</a>
          ))}
          <h5 style={{marginTop:18}}>Integrations</h5>
          {['Swiggy','Zomato','Razorpay','UPI / BHIM'].map(n=><a key={n} href="#">{n}</a>)}
        </div>
        <div className="f-col">
          <h5>Contact Us</h5>
          <div className="f-ci"><IcoPhone size={12}/><a href="tel:+918767622654">+91 87676 22654</a></div>
          <div className="f-ci"><IcoPhone size={12}/><a href="tel:+918605015294">+91 86050 15294</a></div>
          <div className="f-ci"><IcoMail size={12}/><a href="mailto:hello.pratyeksha@gmail.com">hello.pratyeksha@gmail.com</a></div>
          <h5 style={{marginTop:18}}>Location</h5>
          <div style={{fontSize:'.72rem',color:'rgba(255,255,255,.28)',lineHeight:1.65}}>Kolhapur, Maharashtra<br/>India</div>
        </div>
        <div className="f-btm">
          <div className="f-btm-t">&#169; 2026 Pratyeksha. All rights reserved. Built in India.</div>
          <div className="f-btm-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Refund Policy</a>
          </div>
        </div>
      </footer>
    </>
  );
}