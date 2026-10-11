/** Loading-screen line that matches the module being opened. */
export function loaderMessageFor(pathname = '/') {
  const p = String(pathname || '/');
  if (p.startsWith('/owner')) return 'Opening your dashboard';
  if (p.startsWith('/kitchen')) return 'Firing up the kitchen';
  if (p.startsWith('/operator')) return 'Setting up the floor';
  if (p.startsWith('/master-admin')) return 'Opening the control room';
  if (p.startsWith('/landing')) return 'Welcome to Pratyeksha';
  if (p.startsWith('/feedback-suite')) return 'Opening your feedback space';
  if (p === '/' || p === '') return 'Finding your favourite cafés';
  return 'Preparing your menu';
}
