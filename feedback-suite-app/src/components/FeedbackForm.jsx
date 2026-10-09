import React, { useState } from 'react';
import { Check, Coffee, MessageCircle, ShieldCheck, Star, UtensilsCrossed } from 'lucide-react';
import { submitFeedback } from '../api';
import StarRating from './StarRating';
import pratyekshaLogo from '../assets/pratyeksha-logo.png';

const initialRatings = { foodQuality: 0, taste: 0, service: 0, ambience: 0 };

export default function FeedbackForm() {
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', mobile: '', ratings: initialRatings, improve: '' });

  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const setRating = (key, value) =>
    setForm((current) => ({ ...current, ratings: { ...current.ratings, [key]: value } }));

  const validate = () => {
    if (!form.name.trim()) {
      setError('Please enter your name.');
      return false;
    }
    if (!/^\d{10}$/.test(form.mobile)) {
      setError('Please enter a valid 10-digit mobile number.');
      return false;
    }
    if (Object.values(form.ratings).some((rating) => !rating)) {
      setError('Please rate each part of your experience.');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setError('');
    try {
      await submitFeedback({
        name: form.name.trim(),
        mobile: form.mobile,
        ratings: form.ratings,
        improve: form.improve.trim(),
      });
      setSubmitted(true);
    } catch (err) {
      setError(err?.response?.data?.message || 'We could not save your feedback right now. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (submitted) {
    return (
      <main className="feedback-shell success-shell">
        <div className="ambient ambient-left" />
        <div className="ambient ambient-right" />
        <section className="success-card">
          <div className="success-mark"><Check size={30} /></div>
          <span className="eyebrow">THANK YOU</span>
          <h1>Thank you for<br /><em>sharing your experience.</em></h1>
          <p>Your feedback has been received and will help us improve.</p>
          <div className="success-detail"><Coffee size={17} /><span>Your voice matters.</span></div>
        </section>
      </main>
    );
  }

  return (
    <main className="feedback-shell">
      <div className="ambient ambient-left" />
      <div className="ambient ambient-right" />

      <header className="feedback-hero">
        <div className="brand-lockup">
          <div className="brand-icon"><Coffee size={27} /></div>
          <div><span className="brand-name">JAY AMBE</span><span className="brand-sub">CAFE</span></div>
        </div>
        <div className="hero-copy">
          <span className="eyebrow">A little note from us</span>
          <h1>Your experience<br /><em>matters here.</em></h1>
          <p>Share a few quick ratings and help us make the next visit better.</p>
          <div className="hero-promise"><span>✦</span><span>Quick</span><span>Private</span><span>Meaningful</span></div>
        </div>
        <div className="hero-orbit"><Star size={44} strokeWidth={1.2} /><MessageCircle size={17} /></div>
      </header>

      <section className="feedback-card">
        <div className="progress-head">
          <div><span className="eyebrow">YOUR FEEDBACK</span><h2>Tell us what you think</h2><p>A few details and four simple ratings.</p></div>
          <span className="progress-percent"><strong>100%</strong><small>one page</small></span>
        </div>
        <div className="progress-track"><span style={{ width: '100%' }} /></div>

        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <div className="section-intro section-intro-responsive">
              <span className="section-number">01</span>
              <div><h3>Your details</h3><p>Tell us who you are so we can keep your feedback connected.</p></div>
            </div>
            <div className="field-grid two responsive-fields">
              <label className="field">
                <span>Your name</span>
                <input value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="Enter your name" maxLength={80} required />
              </label>
              <label className="field">
                <span>Mobile number</span>
                <input value={form.mobile} onChange={(e) => setField('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="Enter 10-digit mobile number" inputMode="numeric" required />
              </label>
            </div>
          </div>

          <div className="form-section">
            <div className="section-intro section-intro-responsive">
              <span className="section-number">02</span>
              <div><h3>Rate your experience</h3><p>Tap a star for each part of your visit.</p></div>
            </div>
            <div className="rating-panel rating-panel-responsive">
              <StarRating label="Food quality" value={form.ratings.foodQuality} onChange={(v) => setRating('foodQuality', v)} />
              <StarRating label="Taste" value={form.ratings.taste} onChange={(v) => setRating('taste', v)} />
              <StarRating label="Service" value={form.ratings.service} onChange={(v) => setRating('service', v)} />
              <StarRating label="Ambience" value={form.ratings.ambience} onChange={(v) => setRating('ambience', v)} />
            </div>
            <div className="rating-scale rating-scale-responsive"><span>1 · Needs work</span><span>3 · Good</span><span>5 · Loved it</span></div>
          </div>

          <div className="form-section">
            <div className="section-intro section-intro-responsive">
              <span className="section-number">03</span>
              <div><h3>One last thought</h3><p>If there is something we could improve, tell us here.</p></div>
            </div>
            <label className="field">
              <span>Improvement suggestion <small>optional</small></span>
              <textarea value={form.improve} onChange={(e) => setField('improve', e.target.value)} placeholder="What could we improve?" rows={5} maxLength={800} />
            </label>
          </div>

          {error && <div className="form-error">{error}</div>}
          <div className="form-action-note"><ShieldCheck size={15} /><span>Your feedback stays secure.</span></div>
          <div className="form-actions form-actions-responsive">
            <span />
            <button type="submit" className="primary-button" disabled={saving}>{saving ? 'Saving…' : 'Send feedback'}{!saving && <Check size={17} />}</button>
          </div>
        </form>
      </section>

      <footer className="feedback-footer">
        <span><UtensilsCrossed size={15} /> Jay Ambe Cafe</span>
        <span>Good food · Good vibes · Always</span>
        <span><MessageCircle size={15} /> We read every response</span>
        <span className="powered-by"><small>POWERED BY</small><img src={pratyekshaLogo} alt="Pratyeksha" /></span>
      </footer>
    </main>
  );
}
