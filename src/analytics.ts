function appendScript(src: string) {
  const script = document.createElement('script');
  script.src = src;
  script.async = true;
  document.head.appendChild(script);
}

export function initAnalytics() {
  const verification = import.meta.env.VITE_GSC_VERIFICATION;
  if (verification) {
    const meta = document.createElement('meta');
    meta.name = 'google-site-verification';
    meta.content = verification;
    document.head.appendChild(meta);
  }

  const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (gaId) {
    appendScript(`https://www.googletagmanager.com/gtag/js?id=${gaId}`);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer.push(args);
    };
    window.gtag('js', new Date());
    window.gtag('config', gaId, { anonymize_ip: true });
  }

  const clarityId = import.meta.env.VITE_CLARITY_PROJECT_ID;
  if (clarityId) {
    const script = document.createElement('script');
    script.text = `
      (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", "${clarityId}");
    `;
    document.head.appendChild(script);
  }
}

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}
