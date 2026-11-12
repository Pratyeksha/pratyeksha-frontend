import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, FileText, UserX, X, Download, Check, Lock } from 'lucide-react';
import API_BASE_URL from './apiBase.js';

/* ───────────────────────────────────────────────────────────
   Guest-facing privacy layer (DPDP Act, 2023)
   – consent capture, Privacy Notice, Terms, access (download) and erasure.
   Shared by the ordering app and anywhere else a guest's name/mobile is collected.
─────────────────────────────────────────────────────────── */

export const GUEST_CONSENT_VERSION = '2026-10-11';
const GOLD = '#d3bfa2';
const CONTACT_EMAIL = 'hello.pratyeksha@gmail.com';
const base = String(API_BASE_URL || '').replace(/\/$/, '');
const apiUrl = (p) => `${base}${p}`;

const k = (name, tenantId) => `pratyeksha_${name}_${tenantId}`;

export const getGuestConsent = (tenantId) => {
  try { const v = JSON.parse(localStorage.getItem(k('consent', tenantId)) || 'null'); return v && v.version ? v : null; } catch { return null; }
};
export const setGuestConsent = (tenantId) => {
  try { localStorage.setItem(k('consent', tenantId), JSON.stringify({ version: GUEST_CONSENT_VERSION, at: new Date().toISOString() })); } catch {}
};
export const getGuestToken = (tenantId, phone) => {
  try { const v = JSON.parse(localStorage.getItem(k('token', tenantId)) || 'null'); return v && v.phone === phone ? v.token : ''; } catch { return ''; }
};
export const setGuestToken = (tenantId, phone, token) => {
  if (!token) return;
  try { localStorage.setItem(k('token', tenantId), JSON.stringify({ phone, token })); } catch {}
};
/** Remove everything this browser remembers about the guest for one restaurant. */
export const clearGuestLocalData = (tenantId) => {
  try {
    ['customer_history', 'phone', 'consent', 'token', 'visit'].forEach(n => localStorage.removeItem(k(n, tenantId)));
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(`pratyeksha_cart_${tenantId}_`) || key.startsWith(`pratyeksha_placed_${tenantId}_`)) localStorage.removeItem(key);
    });
  } catch {}
};

const T = (language, en, mr) => (language === 'mr' ? mr : en);

/* ── Consent checkbox shown wherever name / mobile are collected ── */
export function ConsentCheck({ checked, onChange, onOpen, language = 'en', tenantName = 'this restaurant', compact = false }) {
  return (
    <label style={{ display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer', padding: compact ? '10px 12px' : '14px 16px', borderRadius: 16, background: 'linear-gradient(160deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015))', border: `1px solid ${checked ? 'rgba(211,191,162,0.4)' : 'rgba(211,191,162,0.16)'}`, transition: 'border-color .2s' }}>
      <span style={{ position: 'relative', flexShrink: 0, width: 22, height: 22, marginTop: 1 }}>
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ position: 'absolute', inset: 0, opacity: 0, margin: 0, cursor: 'pointer' }} aria-label="Consent" />
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: 7, background: checked ? 'linear-gradient(135deg,#e6d6b8,#b99f78)' : 'transparent', border: `1.5px solid ${checked ? 'transparent' : 'rgba(211,191,162,0.45)'}`, transition: 'all .18s' }}>
          {checked && <Check size={14} color="#14110c" strokeWidth={3} />}
        </span>
      </span>
      <span style={{ fontSize: '0.68rem', lineHeight: 1.6, color: 'rgba(247,243,235,0.66)', fontWeight: 500 }}>
        {T(language,
          <>I agree that <b style={{ color: GOLD }}>{tenantName}</b> may use my name and mobile number for my order, bill and visit updates. I have read the{' '}</>,
          <>माझे नाव व मोबाईल नंबर माझी ऑर्डर, बिल आणि भेटीच्या अपडेट्ससाठी <b style={{ color: GOLD }}>{tenantName}</b> ने वापरण्यास माझी संमती आहे. मी वाचले आहे:{' '}</>)}
        <button type="button" onClick={(e) => { e.preventDefault(); onOpen && onOpen('privacy'); }} style={linkBtn}>{T(language, 'Privacy Notice', 'गोपनीयता सूचना')}</button>
        {' '}{T(language, 'and', 'व')}{' '}
        <button type="button" onClick={(e) => { e.preventDefault(); onOpen && onOpen('terms'); }} style={linkBtn}>{T(language, 'Terms', 'अटी')}</button>.
      </span>
    </label>
  );
}

const linkBtn = { background: 'none', border: 0, padding: 0, color: GOLD, textDecoration: 'underline', cursor: 'pointer', font: 'inherit', fontWeight: 700 };

/* ── Content ── */
function PrivacyBody({ language, name }) {
  const blocks = language === 'mr' ? [
    ['आम्ही कोणती माहिती घेतो', `तुमचे नाव, १० अंकी मोबाईल नंबर, ऑर्डर/बिलाचा तपशील, भेटींची संख्या आणि (असल्यास) तुम्ही दिलेला अभिप्राय. परवानगी दिल्यास सूचना (notifications) साठी तुमच्या ब्राउझरचा सब्सक्रिप्शन डेटा.`],
    ['कशासाठी वापरतो', `तुमची ऑर्डर/टेबल/बुकिंग पूर्ण करणे, बिल व इनव्हॉइस देणे, ऑर्डर तयार झाल्याची सूचना देणे, तुमची मागील ऑर्डर आठवणे. ${name} तुमचा नंबर या हेतूंपलीकडे वापरणार नाही.`],
    ['कोणाशी शेअर होते', `${name} आणि Pratyeksha (सॉफ्टवेअर पुरवठादार) यांच्याशीच. आम्ही तुमची माहिती विकत नाही. कायद्याने आवश्यक असल्यास किंवा होस्टिंग/डेटाबेस पुरवठादारांकडे सुरक्षितपणे साठवली जाते.`],
    ['किती काळ ठेवतो', `तुम्ही हटवण्याची विनंती करेपर्यंत प्रोफाइल ठेवले जाते. कर नोंदींसाठी आवश्यक असलेली बिले कायद्यानुसार ठेवली जातात, परंतु त्यातून तुमचे नाव व नंबर काढून टाकले जातात.`],
    ['तुमचे अधिकार', `माहिती पाहणे/डाउनलोड करणे, दुरुस्त करणे, संमती मागे घेणे आणि माहिती हटवणे. खालील "माझा डेटा" टॅबमधून हे लगेच करता येते. तक्रार: ${CONTACT_EMAIL}.`],
    ['मुले', `हे अॅप मुलांसाठी नाही. १८ वर्षांखालील व्यक्तींनी पालकांच्या संमतीने वापरावे.`],
  ] : [
    ['What we collect', `Your name, 10-digit mobile number, order and bill details, how often you visit, and any feedback you give. If you allow notifications, your browser's push subscription.`],
    ['Why we use it', `To complete your order, table or booking, issue your bill and invoice, tell you when your order is ready, and remember your last order. ${name} will not use your number for anything beyond this without asking you.`],
    ['Who sees it', `Only ${name} and Pratyeksha (the software provider acting for them). We never sell your data. It is stored with hosting and database providers under safeguards, and disclosed only where the law requires.`],
    ['How long we keep it', `Your guest profile stays until you ask us to delete it. Bills that tax law requires the restaurant to keep are retained, but your name and number are removed from them when you delete your data.`],
    ['Your rights', `See or download your data, correct it, withdraw consent, and have it erased. You can do all of this instantly from the "My data" tab. Grievances: ${CONTACT_EMAIL}.`],
    ['Children', `This app is not meant for children. If you are under 18, please use it with a parent or guardian's consent.`],
  ];
  return blocks.map(([h, p], i) => (
    <section key={i} style={{ marginBottom: 18 }}>
      <h4 style={{ margin: '0 0 6px', fontSize: '0.78rem', color: GOLD, fontWeight: 800, letterSpacing: '.02em', textAlign: 'left' }}>{String(i + 1).padStart(2, '0')} · {h}</h4>
      <p style={{ margin: 0, fontSize: '0.74rem', lineHeight: 1.75, color: 'rgba(247,243,235,0.66)', textAlign: 'left' }}>{p}</p>
    </section>
  ));
}

function TermsBody({ language, name }) {
  const blocks = language === 'mr' ? [
    ['वापर', `हे अॅप ${name} मध्ये मेनू पाहणे, ऑर्डर देणे, वेटलिस्ट/बुकिंग आणि बिल पाहण्यासाठी आहे.`],
    ['ऑर्डर व किंमती', `किंमती मेनूमध्ये दाखवल्याप्रमाणे असतात आणि कर वेगळे लागू होऊ शकतात. वस्तू उपलब्ध नसल्यास रेस्टॉरंट ऑर्डर बदलू किंवा रद्द करू शकते.`],
    ['अचूक माहिती', `कृपया योग्य नाव व मोबाईल नंबर द्या. चुकीच्या माहितीमुळे सूचना किंवा बिल मिळू शकणार नाही.`],
    ['योग्य वापर', `अॅपचा गैरवापर, खोट्या ऑर्डर किंवा सेवेत अडथळा आणणे प्रतिबंधित आहे.`],
    ['उपलब्धता', `इंटरनेट किंवा तांत्रिक कारणांमुळे सेवा तात्पुरती बंद असू शकते.`],
    ['कायदा', `हे भारतीय कायद्यांनुसार चालते. प्रश्नांसाठी ${CONTACT_EMAIL}.`],
  ] : [
    ['Using the app', `This app lets you browse ${name}'s menu, place orders, join the waitlist or book a table, and view your bill.`],
    ['Orders & prices', `Prices are as shown on the menu and applicable taxes are added at billing. The restaurant may change or cancel an order if an item becomes unavailable.`],
    ['Accurate details', `Please give a correct name and mobile number. Wrong details can mean you don't receive updates or your bill.`],
    ['Fair use', `Misusing the app, placing fake orders or interfering with the service is not allowed.`],
    ['Availability', `The service may occasionally pause because of network or technical reasons.`],
    ['Law', `These terms follow Indian law. Questions: ${CONTACT_EMAIL}.`],
  ];
  return blocks.map(([h, p], i) => (
    <section key={i} style={{ marginBottom: 18 }}>
      <h4 style={{ margin: '0 0 6px', fontSize: '0.78rem', color: GOLD, fontWeight: 800, textAlign: 'left' }}>{String(i + 1).padStart(2, '0')} · {h}</h4>
      <p style={{ margin: 0, fontSize: '0.74rem', lineHeight: 1.75, color: 'rgba(247,243,235,0.66)', textAlign: 'left' }}>{p}</p>
    </section>
  ));
}

/* ── My data: download + erase ── */
function MyData({ language, tenantId, tenantName, phone, name, onErased }) {
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [phoneInput, setPhoneInput] = useState(phone || '');
  const cleanPhone = String(phoneInput || '').replace(/\D/g, '').slice(0, 10);
  const token = getGuestToken(tenantId, cleanPhone);

  const download = async () => {
    setBusy('dl'); setMsg(null);
    try {
      const r = await axios.post(apiUrl('/customers/my-data'), { tenantId, phone: cleanPhone, token });
      const blob = new Blob([JSON.stringify(r.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `my-data-${tenantId}.json`; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      setMsg({ ok: true, text: T(language, 'Your data file has been downloaded.', 'तुमचा डेटा फाइल डाउनलोड झाली.') });
    } catch (e) {
      setMsg({ ok: false, text: e?.response?.data?.error || T(language, 'Could not prepare your data right now.', 'आत्ता डेटा तयार करता आला नाही.') });
    } finally { setBusy(''); }
  };

  const erase = async () => {
    setBusy('del'); setMsg(null);
    try {
      const r = await axios.post(apiUrl('/customers/erase'), { tenantId, phone: cleanPhone, token, name });
      if (r.data?.erased) {
        clearGuestLocalData(tenantId);
        setMsg({ ok: true, text: T(language, 'Done — your details have been deleted.', 'झाले — तुमचा तपशील हटवला आहे.') });
        onErased && onErased();
      } else {
        setMsg({ ok: true, text: T(language, `Request received. ${tenantName} will verify and delete your data.`, `विनंती मिळाली. ${tenantName} पडताळणी करून तुमचा डेटा हटवेल.`) });
        try { localStorage.removeItem(k('customer_history', tenantId)); localStorage.removeItem(k('phone', tenantId)); localStorage.removeItem(k('consent', tenantId)); } catch {}
        onErased && onErased({ queued: true });
      }
      setConfirming(false);
    } catch (e) {
      setMsg({ ok: false, text: e?.response?.data?.error || T(language, 'Something went wrong. Please try again.', 'काहीतरी चुकले. पुन्हा प्रयत्न करा.') });
    } finally { setBusy(''); }
  };

  const card = { padding: 16, borderRadius: 18, background: 'linear-gradient(160deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015))', border: '1px solid rgba(211,191,162,0.14)', marginBottom: 12, textAlign: 'left' };
  return (
    <div>
      {!phone && (
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: '0.54rem', letterSpacing: 2, fontWeight: 800, color: 'rgba(211,191,162,0.7)', marginBottom: 8, textTransform: 'uppercase', textAlign: 'left' }}>{T(language, 'Your mobile number', 'तुमचा मोबाईल नंबर')}</label>
          <input type="tel" inputMode="numeric" maxLength={10} value={phoneInput} onChange={e => setPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="9876543210"
            style={{ width: '100%', boxSizing: 'border-box', padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(211,191,162,0.2)', color: '#f7f3eb', fontSize: '1rem', letterSpacing: 1.5, outline: 'none', fontFamily: 'Poppins, sans-serif' }} />
        </div>
      )}

      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <Download size={16} color={GOLD} />
          <b style={{ fontSize: '0.8rem', color: '#f7f3eb' }}>{T(language, 'Download my data', 'माझा डेटा डाउनलोड करा')}</b>
        </div>
        <p style={{ margin: '0 0 12px', fontSize: '0.7rem', lineHeight: 1.6, color: 'rgba(247,243,235,0.55)' }}>
          {T(language, 'A copy of your profile, visits and orders with this restaurant.', 'या रेस्टॉरंटमधील तुमचे प्रोफाइल, भेटी आणि ऑर्डर्सची प्रत.')}
        </p>
        <button type="button" disabled={cleanPhone.length !== 10 || !!busy} onClick={download} style={{ ...ghostBtn, opacity: cleanPhone.length === 10 ? 1 : 0.45 }}>
          {busy === 'dl' ? T(language, 'Preparing…', 'तयार होत आहे…') : T(language, 'Download (.json)', 'डाउनलोड (.json)')}
        </button>
      </div>

      <div style={{ ...card, borderColor: 'rgba(211,191,162,0.26)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <UserX size={16} color={GOLD} />
          <b style={{ fontSize: '0.8rem', color: '#f7f3eb' }}>{T(language, 'Delete my data & withdraw consent', 'माझा डेटा हटवा व संमती मागे घ्या')}</b>
        </div>
        <p style={{ margin: '0 0 12px', fontSize: '0.7rem', lineHeight: 1.6, color: 'rgba(247,243,235,0.55)' }}>
          {T(language, 'Removes your name, number, order history and notification settings. Bills the restaurant must legally keep stay, without your personal details.', 'तुमचे नाव, नंबर, ऑर्डर इतिहास आणि सूचना सेटिंग्ज काढले जातात. कायद्याने ठेवाव्या लागणाऱ्या बिलांमधून तुमचा वैयक्तिक तपशील काढला जातो.')}
        </p>
        {!confirming ? (
          <button type="button" disabled={cleanPhone.length !== 10 || !!busy} onClick={() => setConfirming(true)} style={{ ...ghostBtn, opacity: cleanPhone.length === 10 ? 1 : 0.45 }}>
            {T(language, 'Delete my data', 'माझा डेटा हटवा')}
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" disabled={!!busy} onClick={erase} style={{ flex: 1, padding: '13px 10px', borderRadius: 14, border: 0, cursor: 'pointer', fontWeight: 800, fontSize: '0.74rem', background: 'linear-gradient(135deg,#e6d6b8,#b99f78)', color: '#14110c', fontFamily: 'Poppins, sans-serif' }}>
              {busy === 'del' ? T(language, 'Deleting…', 'हटवत आहे…') : T(language, 'Yes, delete permanently', 'होय, कायमचे हटवा')}
            </button>
            <button type="button" disabled={!!busy} onClick={() => setConfirming(false)} style={{ ...ghostBtn, flex: 1 }}>{T(language, 'Keep my data', 'ठेवा')}</button>
          </div>
        )}
      </div>

      {msg && (
        <div role="status" style={{ padding: '12px 14px', borderRadius: 14, fontSize: '0.72rem', lineHeight: 1.6, textAlign: 'left', background: 'rgba(211,191,162,0.08)', border: '1px solid rgba(211,191,162,0.25)', color: msg.ok ? GOLD : '#e8b87a' }}>{msg.text}</div>
      )}
      <p style={{ margin: '14px 0 0', fontSize: '0.64rem', lineHeight: 1.6, color: 'rgba(247,243,235,0.42)', textAlign: 'left', display: 'flex', gap: 8 }}>
        <Lock size={12} style={{ flexShrink: 0, marginTop: 2 }} />
        {T(language, `If this device can't prove the number is yours, we pass the request to ${tenantName} to verify before deleting.`, `हा नंबर तुमचा आहे हे या डिव्हाइसवरून सिद्ध न झाल्यास, हटवण्यापूर्वी पडताळणीसाठी विनंती ${tenantName} कडे जाते.`)}
      </p>
    </div>
  );
}

const ghostBtn = { padding: '13px 16px', borderRadius: 14, border: '1px solid rgba(211,191,162,0.3)', background: 'rgba(211,191,162,0.07)', color: GOLD, fontWeight: 800, fontSize: '0.74rem', cursor: 'pointer', fontFamily: 'Poppins, sans-serif', width: '100%' };

/* ── The sheet ── */
export function GuestLegalSheet({ open, tab = 'privacy', onTab, onClose, language = 'en', tenantId, tenantName = 'the restaurant', phone = '', name = '', onErased }) {
  const tabs = [
    { id: 'privacy', icon: ShieldCheck, label: T(language, 'Privacy', 'गोपनीयता') },
    { id: 'terms', icon: FileText, label: T(language, 'Terms', 'अटी') },
    { id: 'data', icon: UserX, label: T(language, 'My data', 'माझा डेटा') },
  ];
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
          style={{ position: 'fixed', inset: 0, zIndex: 12000, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: 'Poppins, sans-serif' }}>
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 480, maxHeight: '88vh', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg, #17140f 0%, #0b0b0c 40%)', border: '1px solid rgba(211,191,162,0.18)', borderBottom: 0, borderRadius: '28px 28px 0 0', boxShadow: '0 -24px 60px rgba(0,0,0,0.6)', overflow: 'hidden' }}>
            <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, rgba(211,191,162,0.8), transparent)' }} />
            <div style={{ padding: '18px 20px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.5rem', letterSpacing: 3, fontWeight: 800, color: 'rgba(211,191,162,0.6)', textTransform: 'uppercase' }}>{tenantName}</div>
                <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.25rem', fontWeight: 700, color: '#f7f3eb', marginTop: 2 }}>{T(language, 'Your privacy', 'तुमची गोपनीयता')}</div>
              </div>
              <button type="button" onClick={onClose} aria-label="Close" style={{ width: 36, height: 36, borderRadius: 12, border: '1px solid rgba(211,191,162,0.18)', background: 'rgba(255,255,255,0.04)', color: GOLD, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
            </div>
            <div style={{ display: 'flex', gap: 6, padding: '4px 20px 12px' }}>
              {tabs.map(t => {
                const on = tab === t.id; const Icon = t.icon;
                return (
                  <button key={t.id} type="button" onClick={() => onTab && onTab(t.id)} style={{ flex: 1, padding: '10px 6px', borderRadius: 14, border: `1px solid ${on ? 'rgba(211,191,162,0.4)' : 'rgba(211,191,162,0.1)'}`, background: on ? 'linear-gradient(135deg,#e6d6b8,#b99f78)' : 'rgba(255,255,255,0.03)', color: on ? '#14110c' : 'rgba(247,243,235,0.6)', fontWeight: 800, fontSize: '0.66rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'Poppins, sans-serif' }}>
                    <Icon size={13} />{t.label}
                  </button>
                );
              })}
            </div>
            <div style={{ overflowY: 'auto', padding: '6px 20px 28px' }} className="no-scrollbar">
              {tab === 'privacy' && <PrivacyBody language={language} name={tenantName} />}
              {tab === 'terms' && <TermsBody language={language} name={tenantName} />}
              {tab === 'data' && <MyData language={language} tenantId={tenantId} tenantName={tenantName} phone={phone} name={name} onErased={onErased} />}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
