import React, { useEffect, useMemo, useState } from 'react';
import { CalendarClock, CheckCircle2, Clock3, ImagePlus, LockKeyhole, Megaphone, Play, RefreshCw, Send, ShieldCheck, Upload, Video, XCircle } from 'lucide-react';
import { createCampaign, getCampaignAudience, getCampaignStatus, getCampaigns, sendCampaign, unlockCampaignStudio, uploadCampaignMedia } from '../api';
import { useTenantName } from '../brand';
import { useNavigate } from 'react-router-dom';
import pratyekshaLogo from '../assets/pratyeksha-logo.png';

function toLocalInput(date) {
  const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return d.toISOString().slice(0,16);
}

export default function CampaignStudio() {
  const tenantName = useTenantName();
  const brandUpper = (tenantName || 'Guest feedback').toUpperCase();
  const navigate = useNavigate();
  const token = localStorage.getItem('jayAmbeAdminToken');
  const [configured, setConfigured] = useState(false);
  // Campaign Studio access is intentionally memory-only.
// Never restore the unlock from sessionStorage/localStorage.
const [campaignAccessToken, setCampaignAccessToken] = useState('');
  const [password, setPassword] = useState('');
  const [unlocking, setUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState('');
  const [audience, setAudience] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [filters, setFilters] = useState({ minRating:'', maxRating:'', dateFrom:'', dateTo:'' });
  const [form, setForm] = useState({ name:'', templateName:'', languageCode:'en_US', commonText:'', mediaType:'', mediaId:'', scheduledAt:'', sendNow:false });
  const [fileName, setFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      navigate('/admin/login');
      return;
    }

    // Remove any stale unlock left by an older build.
    sessionStorage.removeItem('jayAmbeCampaignAccessToken');
    setCampaignAccessToken('');
    setPassword('');
    setUnlockError('');

    // Leaving Campaign Studio immediately invalidates its private access.
    return () => {
      sessionStorage.removeItem('jayAmbeCampaignAccessToken');
    };
  }, [navigate, token]);

  const clearCampaignAccess = () => {
    sessionStorage.removeItem('jayAmbeCampaignAccessToken');
    setCampaignAccessToken('');
    setPassword('');
    setUnlockError('');
  };

  const unlock = async (event) => {
    event?.preventDefault();
    if (!password.trim() || unlocking) return;
    setUnlocking(true); setUnlockError('');
    try {
      const res = await unlockCampaignStudio(token, password);
      const access = res.data?.token;
      if (!access) throw new Error('Campaign access could not be created.');
      // Do NOT persist this token. It must expire when this Campaign Studio
      // visit/component is left, so the next click requires the password again.
      sessionStorage.removeItem('jayAmbeCampaignAccessToken');
      setCampaignAccessToken(access);
      setPassword('');
    } catch (err) {
      setUnlockError(err?.response?.data?.message || 'Incorrect campaign password.');
    } finally { setUnlocking(false); }
  };
  const load = async()=>{
    try {
      const [status, aud, list] = await Promise.all([getCampaignStatus(token,campaignAccessToken), getCampaignAudience(token,campaignAccessToken,{...filters}), getCampaigns(token,campaignAccessToken)]);
      setConfigured(Boolean(status.data.configured)); setAudience(aud.data.customers||[]); setCampaigns(list.data.items||[]);
    } catch(err){ if(err?.response?.status===401){localStorage.removeItem('jayAmbeAdminToken');clearCampaignAccess();navigate('/admin/login');} if(err?.response?.status===403){clearCampaignAccess();setUnlockError('Campaign Studio is locked. Enter your private password again.');} }
  };
  useEffect(()=>{if(token && campaignAccessToken)load();},[token,campaignAccessToken,filters.minRating,filters.maxRating,filters.dateFrom,filters.dateTo]);

  const update=(key,value)=>setForm(f=>({...f,[key]:value}));
  const previewName=audience[0]?.name||'Customer';
  const preview = useMemo(()=>form.commonText.replaceAll('{{name}}',previewName),[form.commonText,previewName]);

  const uploadMedia=async(file)=>{
    if(!file)return;
    setError('');
    if(file.size>15*1024*1024){setError('Please keep campaign media under 15 MB.');return;}
    const type=file.type.startsWith('video/')?'video':file.type.startsWith('image/')?'image':'document';
    setForm(f=>({...f,mediaType:type,mediaId:''})); setFileName(file.name); setUploading(true);
    const reader=new FileReader();
    reader.onload=async()=>{
      try{
        const res=await uploadCampaignMedia(token,campaignAccessToken,{dataUrl:reader.result,mediaType:type,filename:file.name});
        update('mediaId',res.data.mediaId); setNotice('Media uploaded to WhatsApp and attached to this campaign.');
      }catch(err){setError(err?.response?.data?.message||'Media upload failed.');setForm(f=>({...f,mediaId:''}));}
      finally{setUploading(false);}
    };
    reader.onerror=()=>{setUploading(false);setError('Could not read that file.');};
    reader.readAsDataURL(file);
  };

  const create = async(sendNow=false)=>{
    setError('');setNotice('');
    if(!form.name.trim()||!form.templateName.trim()){setError('Campaign name and approved WhatsApp template name are required.');return;}
    if(!form.mediaId && form.mediaType){setError('Upload the selected media to WhatsApp before creating the campaign.');return;}
    setSaving(true);
    try{
      const res=await createCampaign(token,campaignAccessToken,{...form,scheduledAt:sendNow?'':(form.scheduledAt?new Date(form.scheduledAt).toISOString():''),sendNow,filters:{minRating:filters.minRating,maxRating:filters.maxRating,lastFeedbackFrom:filters.dateFrom,lastFeedbackTo:filters.dateTo}});
      setCampaigns(c=>[res.data.campaign,...c]);
      setNotice(sendNow?`Sending started for ${audience.length} unique customers.`:'Campaign saved.');
      if(sendNow) setTimeout(load,1200);
    }catch(err){setError(err?.response?.data?.message||'Could not create campaign.');}
    finally{setSaving(false);}
  };

  const send=(id)=>sendCampaign(token,campaignAccessToken,id).then(()=>{setNotice('Campaign sending started.');load();}).catch(err=>setError(err?.response?.data?.message||'Could not start campaign.'));

  if(!token)return null;
  if(!campaignAccessToken) return <main className="campaign-lock-shell">
    <section className="campaign-lock-card">
      <div className="campaign-lock-mark"><LockKeyhole size={24}/></div>
      <span className="eyebrow">{brandUpper} / PRIVATE</span>
      <h1>Campaign <em>Studio</em></h1>
      <p>This workspace is protected by a second private password. Your normal admin login is not enough to open campaign controls.</p>
      <form onSubmit={unlock} className="campaign-lock-form">
        <label>Private campaign password<input autoFocus type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your private password" autoComplete="current-password"/></label>
        {unlockError && <div className="campaign-lock-error"><XCircle size={16}/>{unlockError}</div>}
        <button className="primary-button campaign-unlock-button" type="submit" disabled={!password.trim()||unlocking}><LockKeyhole size={16}/>{unlocking?'Unlocking…':'Unlock Campaign Studio'}</button>
      </form>
      <button className="campaign-lock-back" onClick={() => { clearCampaignAccess(); navigate('/admin'); }}>← Return to Admin</button>
      <div className="campaign-lock-brand"><span>POWERED BY</span><img src={pratyekshaLogo} alt="Pratyeksha"/></div>
    </section>
  </main>;
  return <main className="campaign-shell">
    <header className="campaign-topbar"><div><button className="campaign-back" onClick={() => { clearCampaignAccess(); navigate('/admin'); }}>← Admin</button><span className="eyebrow">{brandUpper} / DIRECT</span><h1>Campaign <em>Studio</em></h1><p>Create, personalize, schedule and monitor WhatsApp campaigns from one workspace.</p></div><div className="campaign-brand"><span>POWERED BY</span><img src={pratyekshaLogo} alt="Pratyeksha"/></div></header>
    <div className="campaign-layout">
      <section className="campaign-main">
        <div className="campaign-status-row"><div className={`connection-status ${configured?'connected':'not-connected'}`}><span></span>{configured?'WhatsApp API connected':'WhatsApp API not configured'}</div><button className="ghost-button" onClick={load}><RefreshCw size={15}/> Refresh</button></div>
        {!configured && <div className="campaign-warning"><ShieldCheck size={18}/><div><strong>Connect WhatsApp Business Platform</strong><p>Add the Meta WhatsApp credentials to Render before sending. The campaign workspace is ready, but it will not send until the API is configured.</p></div></div>}

        <div className="campaign-panel"><div className="campaign-panel-head"><div><span className="eyebrow">01 · AUDIENCE</span><h2>Who should receive it?</h2><p>All unique customer profiles are eligible. Review the recipient list before sending and use approved WhatsApp templates.</p>
            <div className="campaign-compliance"><ShieldCheck size={17}/><div><strong>All-customer audience</strong><p>Campaigns use the unique customer directory, one recipient per mobile number. Rating and date filters are optional controls when you want a narrower campaign.</p></div></div></div><strong className="audience-count">{audience.length}<small>eligible</small></strong></div>
          <div className="campaign-filter-grid"><label>Minimum rating<select value={filters.minRating} onChange={e=>setFilters(f=>({...f,minRating:e.target.value}))}><option value="">Any</option><option value="4">4★+</option><option value="3">3★+</option><option value="2">2★+</option></select></label><label>Maximum rating<select value={filters.maxRating} onChange={e=>setFilters(f=>({...f,maxRating:e.target.value}))}><option value="">Any</option><option value="2">2★ or less</option><option value="3">3★ or less</option><option value="4">4★ or less</option></select></label><label>Last visit from<input type="date" value={filters.dateFrom} onChange={e=>setFilters(f=>({...f,dateFrom:e.target.value}))}/></label><label>Last visit to<input type="date" value={filters.dateTo} onChange={e=>setFilters(f=>({...f,dateTo:e.target.value}))}/></label></div>
          <div className="audience-preview">{audience.slice(0,8).map(c=><span key={c._id}>{c.name}</span>)}{audience.length>8&&<span>+{audience.length-8} more</span>}</div>
        </div>

        <div className="campaign-panel"><div className="campaign-panel-head"><div><span className="eyebrow">02 · MESSAGE</span><h2>Build the campaign</h2><p>Business-initiated WhatsApp messages use an approved template. Put the customer name in template variable 1 and the common campaign copy in variable 2.</p></div></div>
          <div className="campaign-form-grid"><label>Campaign name<input value={form.name} onChange={e=>update('name',e.target.value)} placeholder="Weekend special — September"/></label><label>Approved template name<input value={form.templateName} onChange={e=>update('templateName',e.target.value)} placeholder="jay_ambe_weekend_offer"/></label><label>Template language<input value={form.languageCode} onChange={e=>update('languageCode',e.target.value)} placeholder="en_US"/></label></div>
          <label className="campaign-message-field">Common campaign text<textarea value={form.commonText} onChange={e=>update('commonText',e.target.value)} placeholder="Hi {{name}}, this weekend we have a special offer waiting for you…" maxLength={1024}/><small>Preview personalization: <b>{preview}</b></small></label>
          <div className="media-upload-box"><div><strong><ImagePlus size={18}/> Optional image / video</strong><span>{fileName||'Upload the creative you want to attach to the approved media-header template.'}</span></div><label className="upload-button"><Upload size={16}/>{uploading?'Uploading…':'Choose media'}<input type="file" accept="image/*,video/*" onChange={e=>uploadMedia(e.target.files?.[0])}/></label>{form.mediaId&&<span className="uploaded-ok"><CheckCircle2 size={15}/> Uploaded</span>}</div>
        </div>

        <div className="campaign-panel"><div className="campaign-panel-head"><div><span className="eyebrow">03 · DELIVERY</span><h2>Send now or schedule</h2><p>The scheduler checks due campaigns every minute while the Render service is running.</p></div></div>
          <div className="delivery-grid"><button className="delivery-choice active"><Play size={17}/><span><b>Send now</b><small>Start the campaign immediately</small></span></button><label className="schedule-field"><CalendarClock size={17}/><span><b>Schedule</b><input type="datetime-local" min={toLocalInput(new Date(Date.now()+60000))} value={form.scheduledAt} onChange={e=>update('scheduledAt',e.target.value)}/></span></label></div>
          <div className="campaign-actions"><button className="secondary-button" disabled={saving||!configured} onClick={()=>create(false)}><Clock3 size={16}/> {form.scheduledAt?'Schedule campaign':'Save draft'}</button><button className="primary-button" disabled={saving||!configured||uploading||audience.length===0} onClick={()=>create(true)}><Send size={16}/> Send to {audience.length} customers</button></div>
        </div>
        {notice&&<div className="campaign-success"><CheckCircle2 size={17}/>{notice}</div>}{error&&<div className="campaign-error"><XCircle size={17}/>{error}</div>}
      </section>
      <aside className="campaign-side">
        <div className="campaign-preview"><span className="eyebrow">LIVE PREVIEW</span><div className="whatsapp-card"><div className="wa-head"><span>{brandUpper}</span><small>WhatsApp template</small></div>{form.mediaId&&<div className="wa-media">{form.mediaType==='video'?<Video size={32}/>:<ImagePlus size={32}/>}<span>{fileName||'Campaign media'}</span></div>}<div className="wa-body">{preview||'Your personalized campaign message will appear here.'}</div><small className="wa-note">Template approval and WhatsApp policy rules apply.</small></div></div>
        <div className="campaign-history"><div className="campaign-panel-head"><div><span className="eyebrow">CAMPAIGN HISTORY</span><h3>Recent sends</h3></div></div>{campaigns.map(c=><article className="history-campaign" key={c._id}><div><strong>{c.name}</strong><span>{c.status} · {c.stats?.total||c.recipients?.length||0} recipients</span></div>{c.status==='draft'||c.status==='scheduled'?<button onClick={()=>send(c._id)} disabled={!configured}><Send size={15}/></button>:<span className="history-stat">{c.stats?.sent||0}/{c.stats?.total||0}</span>}</article>)}{!campaigns.length&&<span className="empty-campaign">No campaigns yet.</span>}</div>
        <div className="campaign-compliance"><ShieldCheck size={17}/><div><strong>Permission first</strong><p>Use this workspace only for customers who explicitly agreed to receive WhatsApp marketing from {tenantName || 'your business'}. Honor opt-outs and approved templates.</p></div></div>
      </aside>
    </div>
    <footer className="campaign-footer"><span>{brandUpper} · CAMPAIGN STUDIO</span><span className="powered-by"><small>POWERED BY</small><img src={pratyekshaLogo} alt="Pratyeksha"/></span></footer>
  </main>;
}
