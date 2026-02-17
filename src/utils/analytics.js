export const GA_MEASUREMENT_ID = 'G-LRZ37WHZYP';

export const initGA = () => {
  if (typeof window === 'undefined') return;
  if (window.gtag) return; // Already initialized

  // Create script tag
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID);
};

export const logPageView = (url) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: url,
  });
};

export const logEvent = (action, { category, label, value }) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};
