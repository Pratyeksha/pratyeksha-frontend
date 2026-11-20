import React from 'react';
import { useLocation } from 'react-router-dom';

export default function FeedbackSuiteFrame() {
  const location = useLocation();
  const suffix = location.pathname.replace(/^\/feedback-suite/, '') || '/';
  const src = `/feedback-suite-app${suffix === '/' ? '/' : suffix}${location.search}${location.hash}`;
  return <iframe title="PRATYEKSHa Feedback Suite" src={src} style={{ display: 'block', width: '100%', height: '100dvh', border: 0, background: '#ece5db' }} allow="clipboard-write" />;
}
