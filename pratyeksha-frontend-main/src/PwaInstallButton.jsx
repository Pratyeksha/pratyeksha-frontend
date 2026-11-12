import React, { useState } from 'react';
import { Download, CheckCircle2, Smartphone, X } from 'lucide-react';
import { isIosInstallable, usePwaInstall } from './pwa';

export default function PwaInstallButton({ kind = 'customer', compact = false, light = false }) {
  const { canInstall, installed, promptInstall } = usePwaInstall(kind);
  const [showIos, setShowIos] = useState(false);

  if (installed) {
    return compact ? null : (
      <span style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:11, fontWeight:800, color: light ? '#56684c' : '#d3bfa2' }}>
        <CheckCircle2 size={14} /> App installed
      </span>
    );
  }

  const ios = isIosInstallable();
  if (!canInstall && !ios) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => ios ? setShowIos(true) : promptInstall()}
        style={{
          display:'inline-flex', alignItems:'center', justifyContent:'center', gap:7,
          border:'1px solid rgba(211,191,162,0.28)',
          background: light ? '#fff' : 'rgba(211,191,162,0.08)',
          color: light ? '#2e3134' : '#d3bfa2',
          borderRadius:10, padding: compact ? '8px 11px' : '10px 14px',
          fontSize: compact ? 10 : 11, fontWeight:900, letterSpacing:'0.5px', cursor:'pointer',
          whiteSpace:'nowrap'
        }}
      >
        <Download size={compact ? 13 : 14} /> Install App
      </button>
      {showIos && (
        <div style={{ position:'fixed', inset:0, zIndex:10000, background:'rgba(0,0,0,.65)', display:'flex', alignItems:'flex-end', justifyContent:'center', padding:18 }}>
          <div style={{ width:'100%', maxWidth:420, background: light ? '#fff' : '#121212', color: light ? '#2e3134' : '#fff', borderRadius:20, padding:22, boxShadow:'0 20px 70px rgba(0,0,0,.35)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <div style={{ display:'flex', alignItems:'center', gap:9, fontWeight:900 }}><Smartphone size={18} /> Install App</div>
              <button type="button" onClick={() => setShowIos(false)} style={{ border:0, background:'transparent', color:'inherit', cursor:'pointer' }}><X size={18}/></button>
            </div>
            <div style={{ fontSize:13, lineHeight:1.7, opacity:.75 }}>
              In Safari, tap <strong>Share</strong>, then choose <strong>Add to Home Screen</strong> and confirm <strong>Add</strong>.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
