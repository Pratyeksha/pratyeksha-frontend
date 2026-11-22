import React, { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useReducedMotion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

/* Motion-driven chrome for the multi-page landing site: page heroes, the footer and the demo form.
   `I` is the landing icon component; all copy describes current Pratyeksha features only. */

const EASE = [0.22, 1, 0.36, 1];

/* Word-by-word headline reveal. */
function Words({ text, className = "", delay = 0 }) {
  const reduce = useReducedMotion();
  return (
    <span className={className}>
      {String(text).split(" ").map((w, i) => (
        <span className="sc-wmask" key={i} aria-hidden="true">
          <motion.span className="sc-w" initial={reduce ? false : { y: "110%", rotate: 4 }} animate={{ y: 0, rotate: 0 }} transition={{ duration: 0.9, ease: EASE, delay: delay + i * 0.07 }}>{w}&nbsp;</motion.span>
        </span>
      ))}
    </span>
  );
}

/* Floating UI chips that sit beside each page's headline; they drift and parallax on scroll. */
const CHIPS = {
  "EVERY FEATURE": [["qr", "Table QR", "Scan, order, pay"], ["kitchen", "Kitchen display", "Live tickets"], ["chart", "Owner insights", "Revenue and P&L"], ["layers", "Operator portal", "One list, every queue"]],
  "WHAT CHANGES": [["check", "Fewer missed orders", "Same order, same moment"], ["chart", "Clearer margins", "Cost beside sales"], ["phone", "Guests return", "Remembered dishes"], ["spark", "Easier GST days", "CGST and SGST per bill"]],
  "ABOUT PRATYEKSHA": [["map", "Made in Maharashtra", "For Indian cafés"], ["layers", "Five screens", "One system"], ["check", "GST + UPI", "Built in, not bolted on"], ["phone", "English + Marathi", "Guest-ready"]],
  "PRIVATE DEMONSTRATION": [["spark", "Your workflow", "Mapped first"], ["check", "No generic tour", "Your priorities"], ["phone", "About a minute", "To get started"]],
};

export function PageHero({ I, eyebrow, title, em, lead, go, cta = true, children }) {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const scale = useTransform(scrollY, [0, 520], [1, reduce ? 1 : 0.92]);
  const y = useTransform(scrollY, [0, 520], [0, reduce ? 0 : 70]);
  const fade = useTransform(scrollY, [0, 460], [1, 0.1]);
  const meta = CHIPS[eyebrow] || [];
  return (
    <section className="sc-hero">
      <motion.div className="nx-wrap sc-hero-in" style={{ scale, y, opacity: fade }}>
        <motion.span className="sc-eyebrow" initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE }}>{eyebrow}</motion.span>
        <h1 aria-label={`${title} ${em}`}>
          <Words text={title} delay={0.1} />
          <Words text={em} className="sc-em" delay={0.1 + String(title).split(" ").length * 0.07} />
        </h1>
        <motion.p initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE, delay: 0.5 }}>{lead}</motion.p>
        {cta && go && (
          <motion.div className="sc-actions" initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE, delay: 0.62 }}>
            <MagneticButton onClick={() => go("/landing/demo")}>Book a private demo <I name="arrow" size={16} /></MagneticButton>
          </motion.div>
        )}
        {children}
      </motion.div>
      {meta.length > 0 && (
        <motion.ul className="nx-wrap sc-meta" initial={reduce ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE, delay: 0.75 }}>
          {meta.map(([, t, d], i) => (<li key={t}><b>{String(i + 1).padStart(2, "0")}</b><strong>{t}</strong><span>{d}</span></li>))}
        </motion.ul>
      )}
    </section>
  );
}

/* Primary button: plain hover states, no pointer tracking. */
export function MagneticButton({ children, onClick, className = "", type = "button" }) {
  return (
    <button type={type} className={`sc-btn ${className}`} onClick={onClick}>
      <span className="sc-btn-in">{children}</span>
    </button>
  );
}

/* ───────── Footer ───────── */
export function SiteFooter({ I, Logo, go, scrollTo, contact, openLegal, onPrivacySettings }) {
  const reduce = useReducedMotion();
  const year = new Date().getFullYear();
  const links = [["Home", "/landing"], ["Features", "/landing/features"], ["Benefits", "/landing/benefits"], ["About", "/landing/about"], ["Book a demo", "/landing/demo"]];
  const rise = (d = 0) => (reduce ? {} : { initial: { opacity: 0, y: 28 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-60px" }, transition: { duration: 0.9, ease: EASE, delay: d } });
  return (
    <footer className="sc-foot">
      <div className="nx-wrap">
        <motion.div className="sc-cta" {...rise()}>
          <span className="sc-eyebrow">Ready when you are</span>
          <h2>See your restaurant, <em>connected.</em></h2>
          <MagneticButton onClick={() => go("/landing/demo")}>Book a private demo <I name="arrow" size={17} /></MagneticButton>
        </motion.div>
        <div className="sc-cols">
          <motion.div className="sc-brand" {...rise(0.05)}>
            <button type="button" onClick={() => scrollTo("home")} aria-label="Back to top">{Logo}</button>
            <p>The digital layer behind better café and restaurant experiences.</p>
          </motion.div>
          <motion.nav className="sc-col" aria-label="Explore" {...rise(0.1)}>
            <h4>Explore</h4>
            {links.map(([t, p]) => (<button type="button" key={p} className="sc-link" onClick={() => go(p)}>{t}</button>))}
          </motion.nav>
          <motion.div className="sc-col" {...rise(0.15)}>
            <h4>Talk to us</h4>
            {contact.map(([href, label]) => (<a key={href} className="sc-link" href={href}>{label}</a>))}
            <span className="sc-loc">Maharashtra, India</span>
          </motion.div>
        </div>
      </div>
      <div className="sc-word" aria-hidden="true">
        {"PRATYEKSHA".split("").map((ch, i) => (
          <motion.span key={i} initial={reduce ? false : { y: "60%", opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 1.1, ease: EASE, delay: i * 0.05 }}>{ch}</motion.span>
        ))}
      </div>
      <div className="nx-wrap sc-bot">
        <span>© {year} Pratyeksha. All rights reserved.</span>
        <div>
          <button type="button" onClick={() => openLegal("privacy")}>Privacy Policy</button>
          <button type="button" onClick={() => openLegal("terms")}>Terms of Use</button>
          <button type="button" onClick={onPrivacySettings}>Privacy Settings</button>
          <button type="button" className="sc-top" onClick={() => scrollTo("home")} aria-label="Back to top"><I name="arrow" size={14} /></button>
        </div>
      </div>
    </footer>
  );
}

/* ───────── Demo form: two steps, same fields and submit logic as before ───────── */
const TYPES = ["Café / Coffee Shop", "Restaurant", "QSR / Fast Food", "Bakery / Bistro", "Cloud Kitchen", "Multi-outlet Business"];
const FOCUS = ["Order handoffs", "Stock visibility", "Billing and GST", "Bringing guests back", "Staff and payroll", "Waitlist and bookings"];

function Field({ label, name, error, children }) {
  return (
    <label className={`sc-f${error ? " has-error" : ""}`}>
      {children}
      <span className="sc-fl">{label}</span>
      <span className="sc-fline" aria-hidden="true" />
      <AnimatePresence>{error && <motion.em className="sc-ferr" id={`${name}-error`} role="alert" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{error}</motion.em>}</AnimatePresence>
    </label>
  );
}

export function DemoForm({ I, form, updateForm, fieldErrors, formError, sending, onSubmit, sent, onAgain, openLegal }) {
  const [step, setStep] = useState(1);
  const reduce = useReducedMotion();
  const formRef = useRef(null);
  const fire = useRef(false);
  const set = (name, value) => updateForm({ target: { name, value, type: "text" } });

  useEffect(() => {
    if (!sent || fire.current || reduce) return;
    fire.current = true;
    const end = Date.now() + 700;
    const fr = () => {
      confetti({ particleCount: 5, angle: 60, spread: 60, origin: { x: 0, y: 0.75 }, colors: ["#dfc18d", "#c7a269", "#f4ecdc"], disableForReducedMotion: true });
      confetti({ particleCount: 5, angle: 120, spread: 60, origin: { x: 1, y: 0.75 }, colors: ["#dfc18d", "#c7a269", "#f4ecdc"], disableForReducedMotion: true });
      if (Date.now() < end) requestAnimationFrame(fr);
    };
    fr();
  }, [sent, reduce]);
  useEffect(() => { if (!sent) fire.current = false; }, [sent]);
  // a validation error on a step-1 field sends the guest back to it
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (fieldErrors.name || fieldErrors.business || fieldErrors.phone || fieldErrors.email) setStep(1); }, [fieldErrors]);

  const next = () => {
    const f = formRef.current; if (!f) return;
    const names = ["name", "business", "phone", "email"];
    for (const n of names) { const el = f.elements[n]; if (el && !el.checkValidity()) { el.reportValidity(); return; } }
    setStep(2);
  };
  const toggleFocus = (t) => {
    const cur = form.message.split("\n")[0].startsWith("Focus: ") ? form.message.split("\n")[0].slice(7).split(", ").filter(Boolean) : [];
    const nextList = cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t];
    const rest = form.message.startsWith("Focus: ") ? form.message.split("\n").slice(1).join("\n") : form.message;
    set("message", (nextList.length ? `Focus: ${nextList.join(", ")}\n` : "") + rest);
  };
  const focusOn = form.message.startsWith("Focus: ") ? form.message.split("\n")[0].slice(7).split(", ") : [];

  if (sent) {
    return (
      <motion.div className="sc-done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, ease: EASE }}>
        <svg viewBox="0 0 80 80" className="sc-tick" aria-hidden="true"><motion.circle cx="40" cy="40" r="34" fill="none" strokeWidth="3" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8, ease: EASE }} /><motion.path d="M25 41l11 11 20-24" fill="none" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, delay: 0.5, ease: EASE }} /></svg>
        <small>REQUEST RECEIVED</small>
        <h3>We'll be in touch.</h3>
        <p>Your demo request has been received. Our team will contact you shortly.</p>
        <button type="button" className="sc-ghost" onClick={onAgain}>Send another request</button>
      </motion.div>
    );
  }

  return (
    <form ref={formRef} className="sc-form" onSubmit={onSubmit} aria-busy={sending} noValidate={false}>
      <div className="sc-fhead">
        <span className="sc-fmark"><I name="spark" size={18} /></span>
        <div><small>YOUR PRIVATE WALKTHROUGH</small><strong>Let’s make it relevant.</strong></div>
        <span className="sc-fstep">0{step}<i />02</span>
      </div>
      <div className="sc-bar" aria-hidden="true"><motion.i animate={{ width: step === 1 ? "50%" : "100%" }} transition={{ duration: 0.6, ease: EASE }} /></div>

      <div className="hp-field" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" value={form.website} onChange={updateForm} />
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {step === 1 ? (
          <motion.div key="s1" className="sc-step" initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.35, ease: EASE }}>
            <p className="sc-q">First, who are we talking to?</p>
            <div className="sc-fgrid">
              <Field label="Your name *" name="name" error={fieldErrors.name}><input name="name" required autoComplete="name" maxLength={80} value={form.name} onChange={updateForm} placeholder=" " aria-invalid={Boolean(fieldErrors.name)} /></Field>
              <Field label="Café / restaurant *" name="business" error={fieldErrors.business}><input name="business" required autoComplete="organization" maxLength={120} value={form.business} onChange={updateForm} placeholder=" " aria-invalid={Boolean(fieldErrors.business)} /></Field>
              <Field label="Phone *" name="phone" error={fieldErrors.phone}><input name="phone" required type="tel" inputMode="tel" autoComplete="tel" pattern="[0-9+()\-\s]{8,20}" maxLength={20} value={form.phone} onChange={updateForm} placeholder=" " aria-invalid={Boolean(fieldErrors.phone)} /></Field>
              <Field label="Email (optional)" name="email" error={fieldErrors.email}><input name="email" type="email" inputMode="email" autoComplete="email" maxLength={160} value={form.email} onChange={updateForm} placeholder=" " aria-invalid={Boolean(fieldErrors.email)} /></Field>
            </div>
            <MagneticButton className="sc-next" onClick={next}>Continue <I name="arrow" size={16} /></MagneticButton>
          </motion.div>
        ) : (
          <motion.div key="s2" className="sc-step" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }} transition={{ duration: 0.35, ease: EASE }}>
            <p className="sc-q">What kind of place is it?</p>
            <div className="sc-chipset" role="radiogroup" aria-label="Business type">
              {TYPES.map((t) => (
                <motion.button type="button" key={t} role="radio" aria-checked={form.type === t} className={form.type === t ? "on" : ""} whileTap={{ scale: 0.94 }} onClick={() => set("type", t)}>{form.type === t && <I name="check" size={12} />}{t}</motion.button>
              ))}
            </div>
            {fieldErrors.type && <span className="field-error" role="alert">{fieldErrors.type}</span>}
            <p className="sc-q">What would you like to improve? <small>(pick any)</small></p>
            <div className="sc-chipset">
              {FOCUS.map((t) => (
                <motion.button type="button" key={t} aria-pressed={focusOn.includes(t)} className={focusOn.includes(t) ? "on" : ""} whileTap={{ scale: 0.94 }} onClick={() => toggleFocus(t)}>{t}</motion.button>
              ))}
            </div>
            <Field label="Anything else we should know?" name="message">
              <textarea name="message" rows={3} maxLength={1000} value={form.message.startsWith("Focus: ") ? form.message.split("\n").slice(1).join("\n") : form.message} onChange={(e) => set("message", (form.message.startsWith("Focus: ") ? form.message.split("\n")[0] + "\n" : "") + e.target.value)} placeholder=" " />
            </Field>
            <p className="form-privacy-notice sc-priv"><strong>How we use these details:</strong> only to respond to this request and arrange your walkthrough.</p>
            <label className={`sc-consent${fieldErrors.privacyConsent ? " has-error" : ""}`}>
              <input name="privacyConsent" type="checkbox" checked={form.privacyConsent} onChange={updateForm} aria-invalid={Boolean(fieldErrors.privacyConsent)} />
              <span className="sc-box" aria-hidden="true"><I name="check" size={12} /></span>
              <span>I have read the <button type="button" onClick={() => openLegal("privacy")}>Privacy Policy</button> and agree that Pratyeksha may use these details to respond to my request.</span>
            </label>
            {fieldErrors.privacyConsent && <span className="field-error" role="alert">{fieldErrors.privacyConsent}</span>}
            {formError && <p className="form-error" role="alert" aria-live="polite">{formError}</p>}
            <div className="sc-row">
              <button type="button" className="sc-back" onClick={() => setStep(1)}>Back</button>
              <motion.button type="submit" className="sc-submit" disabled={sending} whileTap={{ scale: 0.98 }}>
                <span className="sc-btn-in">{sending ? "Sending securely…" : "See Your Restaurant, Connected"} <I name="arrow" size={16} /></span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <p className="sc-note"><I name="lock-keyhole" size={13} /> Used only to respond to this request. No pressure, just a focused conversation.</p>
    </form>
  );
}
