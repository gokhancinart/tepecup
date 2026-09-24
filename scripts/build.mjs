import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const site = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/site.json'), 'utf8'));
const productsData = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/products.json'), 'utf8'));
const references = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/references.json'), 'utf8'));

const { baseUrl, contact, tr: trSite, en: enSite } = site;
const products = productsData.products;

const PAGE_FILES = {
  tr: {
    home: 'index.html',
    products: 'urunlerimiz.html',
    print: 'baskili-bardak.html',
    references: 'referanslar.html',
    contact: 'iletisim.html',
    about: 'hakkimizda.html',
    faq: 'sss.html',
    privacy: 'kvkk.html'
  },
  en: {
    home: 'index.html',
    products: 'products.html',
    print: 'custom-print.html',
    references: 'references.html',
    contact: 'contact.html',
    about: 'about.html',
    faq: 'faq.html',
    privacy: 'privacy.html'
  }
};

const STANDALONE_PAGES = ['products', 'print', 'references', 'contact'];
const LOGO_FILE = 'images/Logo/logo.png';
const FOOTER_LOGO_FILE = 'images/Logo/logo-negative.png';
const FAVICON_ICO = 'favicon.ico';
const APPLE_TOUCH_ICON = 'apple-touch-icon.png';
const BRAND_NAME = 'Tepe Cup';
const WHATSAPP_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';
const PRODUCT_SIZE_ORDER = ['4oz', '7oz', '8oz'];
const DEFAULT_PRODUCT_TAB = '7oz';

const HOME_FEATURED_PRODUCT_IDS = [
  '4oz-good-idea',
  '7oz-cizgi', '7oz-yildiz', '7oz-togo',
  '7oz-coffee-renkli', '7oz-espresso',
  '8oz-coffee', '8oz-coffee-mix'
];

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function assets(depth) {
  return depth ? '../'.repeat(depth) : '';
}

function langPrefix(depth) {
  return depth > 1 ? '../'.repeat(depth - 1) : '';
}

function waUrl(message) {
  return `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(message)}`;
}

function contactEmails() {
  if (Array.isArray(contact.emails) && contact.emails.length) return contact.emails;
  return contact.email ? [contact.email] : [];
}

function productUrl(lang, product) {
  const loc = lang === 'tr' ? product.tr : product.en;
  const folder = lang === 'tr' ? 'urunler' : 'products';
  return `/${lang}/${folder}/${loc.slug}.html`;
}

function relativeLangUrls(lang, kind, product = null) {
  if (kind === 'home') {
    return lang === 'tr'
      ? { tr: 'index.html', en: '../en/index.html' }
      : { tr: '../tr/index.html', en: 'index.html' };
  }
  if (kind === 'product') {
    return lang === 'tr'
      ? { tr: `${product.tr.slug}.html`, en: `../../en/products/${product.en.slug}.html` }
      : { tr: `../../tr/urunler/${product.tr.slug}.html`, en: `${product.en.slug}.html` };
  }
  if (PAGE_FILES.tr[kind] && PAGE_FILES.en[kind]) {
    return lang === 'tr'
      ? { tr: PAGE_FILES.tr[kind], en: `../en/${PAGE_FILES.en[kind]}` }
      : { tr: `../tr/${PAGE_FILES.tr[kind]}`, en: PAGE_FILES.en[kind] };
  }
  return relativeLangUrls(lang, 'home');
}

function pageCanonical(lang, pageKey) {
  return `${baseUrl}/${lang}/${PAGE_FILES[lang][pageKey]}`;
}

function pageAlternates(pageKey) {
  return {
    tr: pageCanonical('tr', pageKey),
    en: pageCanonical('en', pageKey)
  };
}

function alternatePair(product) {
  return {
    tr: baseUrl + productUrl('tr', product),
    en: baseUrl + productUrl('en', product)
  };
}

function write(rel, content) {
  const file = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, 'utf8');
}

function faviconTags(depth) {
  const a = assets(depth);
  return `  <link rel="icon" href="${a}${FAVICON_ICO}" sizes="any">
  <link rel="icon" href="${a}${LOGO_FILE}" type="image/png">
  <link rel="apple-touch-icon" href="${a}${APPLE_TOUCH_ICON}">`;
}

function seoHead({ lang, locale, title, description, canonical, alternates, depth, ogImage, jsonLd = [] }) {
  const a = assets(depth);
  const og = ogImage || `${baseUrl}/${LOGO_FILE}`;
  const altTags = alternates
    ? Object.entries(alternates)
        .map(([l, href]) => `  <link rel="alternate" hreflang="${l}" href="${esc(href)}">`)
        .join('\n') +
      `\n  <link rel="alternate" hreflang="x-default" href="${esc(alternates.tr || alternates.en)}">`
    : '';

  const ld = jsonLd
    .map(obj => `  <script type="application/ld+json">${JSON.stringify(obj)}</script>`)
    .join('\n');

  return `<!DOCTYPE html>
<html lang="${lang}" data-base="${a}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${esc(description)}">
  <title>${esc(title)}</title>
  <link rel="canonical" href="${esc(canonical)}">
${altTags}
  <meta property="og:type" content="website">
  <meta property="og:locale" content="${locale}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${esc(canonical)}">
  <meta property="og:image" content="${esc(og.startsWith('http') ? og : baseUrl + '/' + og.replace(/^\//, ''))}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${esc(og.startsWith('http') ? og : baseUrl + '/' + og.replace(/^\//, ''))}">
${faviconTags(depth)}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${a}css/style.css">
${ld}
</head>`;
}

function langSwitcher(lang, trHref, enHref) {
  return `<div class="lang-switch" aria-label="Language">
    <a class="lang-link${lang === 'tr' ? ' active' : ''}" href="${esc(trHref)}" hreflang="tr" lang="tr">TR</a>
    <span class="lang-divider">|</span>
    <a class="lang-link${lang === 'en' ? ' active' : ''}" href="${esc(enHref)}" hreflang="en" lang="en">EN</a>
  </div>`;
}

function headerHtml(lang, s, depth, activePage = 'home', langUrls = null) {
  const a = assets(depth);
  const lp = langPrefix(depth);
  const p = PAGE_FILES[lang];
  const home = `${lp}${p.home}`;
  const urls = langUrls || relativeLangUrls(lang, activePage === 'home' ? 'home' : activePage);
  const switcher = langSwitcher(lang, urls.tr, urls.en);
  const wa = waUrl(s.whatsappMessages.general);

  const navItems = [
    ['home', s.nav.home, p.home],
    ['products', s.nav.products, p.products],
    ['print', s.nav.print, p.print],
    ['references', s.nav.refs, p.references],
    ['about', s.nav.about, p.about],
    ['contact', s.nav.contact, p.contact]
  ].map(([key, label, file]) =>
    `<a href="${lp}${file}" class="${activePage === key ? 'nav-active' : ''}">${esc(label)}</a>`
  ).join('\n      ');

  return `<header class="site-header" id="top">
  <div class="container nav-wrap">
    <a class="brand" href="${home}" aria-label="${esc(BRAND_NAME)}">
      <img src="${a}${LOGO_FILE}" alt="${esc(BRAND_NAME)}">
    </a>
    <nav class="nav" aria-label="Main menu">
      ${navItems}
      <a class="nav-cta" href="${wa}" target="_blank" rel="noopener">${esc(s.nav.quote)}</a>
    </nav>
    ${switcher}
    <button class="menu-toggle" aria-label="Menu" aria-expanded="false">☰</button>
  </div>
</header>`;
}

function footerHtml(lang, s, depth) {
  const a = assets(depth);
  const lp = langPrefix(depth);
  const p = PAGE_FILES[lang];
  return `<footer class="footer">
  <div class="container footer-grid">
    <div><img src="${a}${FOOTER_LOGO_FILE}" alt="${esc(BRAND_NAME)}" class="footer-logo"></div>
    <div><strong>${esc(s.footer.menu)}</strong>
      <a href="${lp}${p.home}">${esc(s.nav.home)}</a>
      <a href="${lp}${p.products}">${esc(s.nav.products)}</a>
      <a href="${lp}${p.print}">${esc(s.nav.print)}</a>
      <a href="${lp}${p.references}">${esc(s.nav.refs)}</a>
      <a href="${lp}${p.contact}">${esc(s.nav.contact)}</a>
    </div>
    <div><strong>${esc(s.footer.legal)}</strong>
      <a href="${lp}${p.about}">${esc(s.nav.about)}</a>
      <a href="${lp}${p.faq}">${esc(s.nav.faq)}</a>
      <a href="${lp}${p.privacy}">${lang === 'tr' ? 'KVKK' : 'Privacy'}</a>
    </div>
    <div class="footer-contact"><strong>${esc(s.footer.contact)}</strong>
      <a href="tel:${contact.phone}">${esc(contact.phoneDisplay)}</a>
      <p class="footer-address">${esc(contact.address[lang])}</p>
    </div>
  </div>
  <div class="container copyright">${esc(s.footer.copyright)}</div>
</footer>
<a class="floating-whatsapp" href="${waUrl(s.whatsappMessages.quote)}" target="_blank" rel="noopener" aria-label="WhatsApp">${WHATSAPP_ICON}</a>
<script src="${a}js/script.js"></script>`;
}

function orgJsonLd(lang) {
  const s = lang === 'tr' ? trSite : enSite;
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: BRAND_NAME,
    url: baseUrl + s.homePath,
    logo: baseUrl + '/' + LOGO_FILE,
    image: baseUrl + '/' + LOGO_FILE,
    telephone: contact.phone,
    email: contactEmails(),
    address: {
      '@type': 'PostalAddress',
      streetAddress: contact.address[lang],
      addressLocality: lang === 'tr' ? 'Başakşehir' : 'Basaksehir',
      addressRegion: 'Istanbul',
      addressCountry: 'TR'
    },
    description: s.meta.homeDescription
  };
}

function sectionHeadSplit(eyebrow, title, desc, extraClass = '') {
  return `<div class="section-head section-head-split ${extraClass}">
    <div><span class="eyebrow">${esc(eyebrow)}</span><h2>${esc(title)}</h2></div>
    <p>${esc(desc)}</p>
  </div>`;
}

function pageHeadSplit(eyebrow, title, desc, extraClass = '') {
  return `<div class="section-head section-head-split page-head ${extraClass}">
    <div><span class="eyebrow">${esc(eyebrow)}</span><h1>${esc(title)}</h1></div>
    <p>${esc(desc)}</p>
  </div>`;
}

function whyFeatures(lang) {
  if (lang === 'tr') {
    return [
      ['Pratik Servis', 'Hazırlanan içeceğin hızlı şekilde servis edilmesine ve paket servis düzeninin kolaylaşmasına yardımcı olur.'],
      ['Farklı Ölçü Seçenekleri', '4 OZ, 7 OZ ve 8 OZ seçenekleriyle espresso, standart servis ve daha büyük içecekler için uygun ölçüyü seçebilirsiniz.'],
      ['Markanızı Görünür Kılar', 'Baskılı bardaklar; logonuzu, renklerinizi ve tasarımınızı müşterinizin elinde görünür hale getirir.'],
      ['Hafif ve Kullanışlı', 'Günlük işletme temposunda taşıma, servis ve stoklama süreçleri için pratik bir bardak çözümüdür.'],
      ['Sıcak & Soğuk İçecekler', 'Kahve ve çaydan soğuk içeceklere kadar farklı servis ihtiyaçlarında kullanılabilecek seçenekler sunar.'],
      ['İhtiyaca Göre Tasarım', 'Baskılı veya baskısız seçeneklerle işletmenizin tarzına ve kullanım amacına uygun görünüm oluşturabilirsiniz.']
    ];
  }
  return [
    ['Practical Service', 'Helps serve prepared beverages quickly and keeps takeaway operations organized.'],
    ['Multiple Size Options', 'Choose from 4 OZ, 7 OZ and 8 OZ for espresso, standard service and larger drinks.'],
    ['Boosts Brand Visibility', 'Printed cups put your logo, colors and design directly in your customer\'s hands.'],
    ['Lightweight & Convenient', 'A practical cup solution for carrying, serving and stocking in daily operations.'],
    ['Hot & Cold Beverages', 'Options suitable for everything from coffee and tea to cold drinks.'],
    ['Design for Your Needs', 'Create the right look for your business with printed or plain options.']
  ];
}

function whySectionHtml(lang, s, depth) {
  const why = whyFeatures(lang);
  const whyIntro = lang === 'tr'
    ? ['Neden karton bardak kullanmalısınız?', 'İşletmenizde hızlı servis, farklı içecek boyutları ve markanıza özel görünüm istiyorsanız karton bardaklar kullanışlı bir çözümdür. 4 OZ, 7 OZ ve 8 OZ seçenekleri sayesinde farklı servis ihtiyaçlarına uygun ölçüyü seçebilir; baskılı veya baskısız modeller arasından tercihinizi yapabilirsiniz.']
    : ['Why use paper cups?', 'If your business needs fast service, different beverage sizes and a branded look, paper cups are a practical solution. Choose from 4 OZ, 7 OZ and 8 OZ sizes and pick printed or plain models to match your needs.'];
  const whyBottom = lang === 'tr'
    ? [`${BRAND_NAME} ile seçim daha kolay.`, 'Ölçünüzü belirleyin, bardak modelinizi seçin ve isterseniz logonuzu yükleyerek baskılı bardak görünümünü önceden inceleyin.', 'Bardak Önizlemesini Deneyin']
    : [`Easier choice with ${BRAND_NAME}.`, 'Pick your size, choose your cup model and preview your printed cup by uploading your logo.', 'Try Cup Preview'];
  const lp = langPrefix(depth);

  return `<section class="section why-cardboard">
    <div class="container">
      ${sectionHeadSplit(s.why.eyebrow, s.why.title, s.why.desc, 'why-head')}
      <div class="why-intro">
        <div class="why-intro-number">01</div>
        <div><strong>${esc(whyIntro[0])}</strong><p>${esc(whyIntro[1])}</p></div>
      </div>
      <div class="feature-grid why-grid">
        ${why.map((f, i) => `<div class="feature why-feature"><b>${String(i + 1).padStart(2, '0')}</b><div class="feature-icon">${['☕','↕','◉','▣','◒','✦'][i]}</div><h3>${esc(f[0])}</h3><p>${esc(f[1])}</p></div>`).join('\n')}
      </div>
      <div class="why-bottom">
        <div class="why-bottom-copy">
          <strong>${esc(whyBottom[0])}</strong>
          <span>${esc(whyBottom[1])}</span>
          <ul class="why-bottom-steps">
            <li>${lang === 'tr' ? 'Logonuzu PDF veya JPEG olarak yükleyin' : 'Upload your logo as PDF or JPEG'}</li>
            <li>${lang === 'tr' ? 'Bardağa canlı önizleme ile yerleştirin' : 'Place it on the cup with live preview'}</li>
            <li>${lang === 'tr' ? '4 renge kadar özel baskı · 4 / 7 / 8 OZ' : 'Up to 4-color print · 4 / 7 / 8 OZ'}</li>
          </ul>
        </div>
        <div class="why-bottom-visual" aria-hidden="true">
          <div class="why-bottom-cups">
            <img src="${assets(depth)}images/4oz-karton-bardak/4oz-beyaz.webp" alt="">
            <span class="why-bottom-arrow">→</span>
            <img src="${assets(depth)}${references[0].image}" alt="" class="why-bottom-cup-main">
          </div>
          <span class="why-bottom-tag">${lang === 'tr' ? 'Özel baskılı bardak' : 'Custom printed cup'}</span>
        </div>
        <a class="btn btn-primary" href="${lp}${PAGE_FILES[lang].print}">${esc(whyBottom[2])}</a>
      </div>
    </div>
  </section>`;
}

function contactSectionHtml(lang, s, asPage = false) {
  const head = asPage
    ? pageHeadSplit(s.contact.eyebrow, s.contact.title, s.contact.desc, 'contact-head')
    : sectionHeadSplit(s.contact.eyebrow, s.contact.title, s.contact.desc, 'contact-head');
  const contactList = `<div class="contact-list">
        <a href="tel:${contact.phone}"><span>${esc(s.contact.phone)}</span><strong>${esc(contact.phoneDisplay)}</strong></a>
        ${contactEmails().map(email => `<a href="mailto:${esc(email)}"><span>${esc(s.contact.email)}</span><strong>${esc(email)}</strong></a>`).join('\n        ')}
        <div><span>${esc(s.contact.address)}</span><strong>${esc(contact.address[lang])}</strong></div>
      </div>`;
  const mapLabel = lang === 'tr' ? `${BRAND_NAME} konum haritası` : `${BRAND_NAME} location map`;
  const mapQuery = encodeURIComponent(contact.address[lang]);
  const mapSrc = contact.mapEmbed || `https://maps.google.com/maps?q=${mapQuery}&hl=${lang}&z=15&output=embed`;

  if (asPage) {
    return `<div class="container contact-page">
      ${head}
      <div class="contact-grid contact-grid-page">
        <div class="contact-map">
          <iframe src="${esc(mapSrc)}" title="${esc(mapLabel)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>
        </div>
        ${contactList}
      </div>
    </div>`;
  }

  return `<section class="section contact"><div class="container"><div class="contact-grid">
      <div>${head}</div>
      ${contactList}
    </div></div></section>`;
}

function ctaSectionHtml(lang, s, inline = false) {
  const cls = inline ? 'cta-section cta-section-inline' : 'cta-section';
  return `<section class="${cls}">
    <div class="container cta-box">
      <div><span class="eyebrow">${esc(s.cta.eyebrow)}</span><h2>${esc(s.cta.title)}</h2><p>${esc(s.cta.desc)}</p></div>
      <a class="btn btn-light" href="${waUrl(s.whatsappMessages.quote)}" target="_blank" rel="noopener">${esc(s.cta.btn)}</a>
    </div>
  </section>`;
}

function mockupSection(lang, s, depth, asPage = false) {
  const a = assets(depth);
  const head = asPage
    ? pageHeadSplit(s.print.eyebrow, s.print.title, s.print.desc, 'print-preview-head')
    : sectionHeadSplit(s.print.eyebrow, s.print.title, s.print.desc, 'print-preview-head');
  const t = lang === 'tr' ? {
    uploadStrong: 'Logo PDF, JPEG veya PNG yükleyin',
    uploadSpan: 'PDF, JPEG veya PNG dosyanızı buraya sürükleyin veya seçin',
    choose: 'Logo Seç',
    size: 'Bardak ölçüsü',
    scale: 'Logo boyutu', x: 'Yatay konum', y: 'Dikey konum', rot: 'Döndürme',
    white: 'Logo etrafındaki beyaz alanı şeffaflaştır',
    reset: 'Ayarları sıfırla',
    download: 'Bardağı İndir',
    noteStrong: 'Nasıl çalışıyor?',
    noteSpan: 'PDF\'in ilk sayfası veya JPEG/PNG görseli tarayıcıda işlenir ve logo bardağın baskı alanına yerleştirilir. Dosyanız sunucuya gönderilmeden yalnızca bu sayfada işlenir.',
    live: 'CANLI ÖNİZLEME',
    emptyStrong: 'Logonuzu yükleyin',
    emptySpan: 'PDF, JPEG veya PNG yüklediğinizde markanız bardağın üzerinde görünecek.',
    cupAlt: 'Beyaz karton bardak önizlemesi',
    demoBadge: 'Örnek logo — kendi logonuzu yükleyin',
    step1: 'Logonuzu yükleyin', step1Sub: 'PDF, JPEG veya PNG',
    step2: 'Bardağa yerleştirin', step2Sub: 'Boyut ve konum',
    step3: 'Teklif alın', step3Sub: 'WhatsApp ile',
    comparePlain: 'Baskısız', comparePrinted: 'Markanıza özel baskılı',
    examplesTitle: `Bu markalar ${BRAND_NAME} ile baskılı bardak kullanıyor`,
    badgeColors: '4 renge kadar baskı', badgeFormats: 'PDF / JPEG / PNG', badgeSizes: '4 · 7 · 8 OZ'
  } : {
    uploadStrong: 'Upload logo PDF, JPEG or PNG',
    uploadSpan: 'Drag and drop or select your PDF, JPEG or PNG file here',
    choose: 'Choose Logo',
    size: 'Cup size',
    scale: 'Logo size', x: 'Horizontal position', y: 'Vertical position', rot: 'Rotation',
    white: 'Make white areas around logo transparent',
    reset: 'Reset settings',
    download: 'Download Cup',
    noteStrong: 'How does it work?',
    noteSpan: 'The first page of your PDF or your JPEG/PNG image is processed in the browser and placed on the cup print area. Your file is never uploaded to a server.',
    live: 'LIVE PREVIEW',
    emptyStrong: 'Upload your logo',
    emptySpan: 'Your brand will appear on the cup once you upload a PDF, JPEG or PNG.',
    cupAlt: 'White paper cup preview',
    demoBadge: 'Sample logo — upload your own',
    step1: 'Upload your logo', step1Sub: 'PDF, JPEG or PNG',
    step2: 'Place on cup', step2Sub: 'Size and position',
    step3: 'Get a quote', step3Sub: 'Via WhatsApp',
    comparePlain: 'Plain', comparePrinted: 'Custom printed for your brand',
    examplesTitle: `These brands use ${BRAND_NAME} printed cups`,
    badgeColors: 'Up to 4-color print', badgeFormats: 'PDF / JPEG / PNG', badgeSizes: '4 · 7 · 8 OZ'
  };

  const exampleRefs = references.slice(0, 6).map(ref => {
    const loc = lang === 'tr' ? ref.tr : ref.en;
    return `<figure class="print-example-item">
      <img src="${a}${ref.image}" alt="${esc(loc.name)}" loading="lazy">
      <figcaption>${esc(loc.name)}</figcaption>
    </figure>`;
  }).join('\n');

  return `<section class="print-section print-preview-section${asPage ? ' print-section-page' : ''}">
    <div class="container">
      ${head}
      <div class="print-badges">
        <span>${esc(t.badgeColors)}</span>
        <span>${esc(t.badgeFormats)}</span>
        <span>${esc(t.badgeSizes)}</span>
      </div>
      <div class="print-compare">
        <figure class="print-compare-item">
          <img src="${a}images/4oz-karton-bardak/4oz-beyaz.webp" alt="${esc(t.comparePlain)}" loading="lazy">
          <figcaption>${esc(t.comparePlain)}</figcaption>
        </figure>
        <div class="print-compare-arrow" aria-hidden="true">→</div>
        <figure class="print-compare-item print-compare-item-featured">
          <img src="${a}${references[0].image}" alt="${esc(t.comparePrinted)}" loading="lazy">
          <figcaption>${esc(t.comparePrinted)}</figcaption>
        </figure>
      </div>
      <div class="mockup-tool">
        <div class="mockup-controls">
          <div class="print-steps">
            <div class="print-step"><span>1</span><div><strong>${esc(t.step1)}</strong><small>${esc(t.step1Sub)}</small></div></div>
            <div class="print-step"><span>2</span><div><strong>${esc(t.step2)}</strong><small>${esc(t.step2Sub)}</small></div></div>
            <div class="print-step"><span>3</span><div><strong>${esc(t.step3)}</strong><small>${esc(t.step3Sub)}</small></div></div>
          </div>
          <div class="upload-box" id="pdfDropZone">
            <div class="upload-icon">PDF<br>PNG</div>
            <div><strong>${esc(t.uploadStrong)}</strong><span>${esc(t.uploadSpan)}</span></div>
            <input type="file" id="pdfInput" accept="application/pdf,.pdf,image/jpeg,.jpg,.jpeg,image/png,.png" hidden>
            <button type="button" class="btn btn-primary upload-btn" id="pdfChooseBtn">${esc(t.choose)}</button>
          </div>
          <div class="control-card">
            <div class="control-title">${esc(t.size)}</div>
            <div class="size-choice" role="group">
              <button type="button" class="size-choice-btn active" data-cup-size="4">4 OZ</button>
              <button type="button" class="size-choice-btn" data-cup-size="7">7 OZ</button>
              <button type="button" class="size-choice-btn" data-cup-size="8">8 OZ</button>
            </div>
          </div>
          <div class="control-card">
            <div class="control-row"><label for="logoScale">${esc(t.scale)} <output id="logoScaleValue">100%</output></label><input id="logoScale" type="range" min="45" max="170" value="100"></div>
            <div class="control-row"><label for="logoX">${esc(t.x)} <output id="logoXValue">0</output></label><input id="logoX" type="range" min="-80" max="80" value="0"></div>
            <div class="control-row"><label for="logoY">${esc(t.y)} <output id="logoYValue">0</output></label><input id="logoY" type="range" min="-60" max="60" value="0"></div>
            <div class="control-row"><label for="logoRotate">${esc(t.rot)} <output id="logoRotateValue">0°</output></label><input id="logoRotate" type="range" min="-12" max="12" value="0"></div>
            <label class="check-row"><input id="removeWhite" type="checkbox" checked><span>${esc(t.white)}</span></label>
            <button type="button" class="reset-btn" id="resetMockup">${esc(t.reset)}</button>
            <button type="button" class="btn btn-primary download-btn" id="downloadMockup" disabled>${esc(t.download)}</button>
          </div>
          <div class="preview-note"><strong>${esc(t.noteStrong)}</strong><span>${esc(t.noteSpan)}</span></div>
        </div>
        <div class="mockup-stage" id="mockupStage">
          <div class="stage-label"><span>${esc(t.live)}</span><strong id="cupSizeLabel">4 OZ</strong></div>
          <div class="demo-badge" id="demoBadge">${esc(t.demoBadge)}</div>
          <div class="cup-mockup size-4" id="cupMockup">
            <img id="cupPhoto" class="cup-photo" src="${a}images/mockup/7oz-baskisiz.jpg" alt="${esc(t.cupAlt)}">
            <div class="cup-print-area" id="cupPrintArea"><canvas id="logoCanvas"></canvas></div>
            <div class="cup-highlight"></div>
            <div class="cup-gloss"></div>
            <div class="cup-shadow"></div>
          </div>
          <div class="empty-preview" id="emptyPreview">
            <div class="empty-icon">＋</div>
            <strong>${esc(t.emptyStrong)}</strong>
            <span>${esc(t.emptySpan)}</span>
          </div>
        </div>
      </div>
      <div class="print-examples">
        <p class="print-examples-title">${esc(t.examplesTitle)}</p>
        <div class="print-examples-grid">${exampleRefs}</div>
      </div>
    </div>
  </section>`;
}

function productGallery(lang, s, depth, asPage = false) {
  const a = assets(depth);
  const productFolder = lang === 'tr' ? 'urunler' : 'products';
  const sizes = PRODUCT_SIZE_ORDER;
  const activeIndex = Math.max(0, sizes.indexOf(DEFAULT_PRODUCT_TAB));
  const tabs = sizes.map((size, i) => {
    const sz = s.products.sizes[size];
    const active = i === activeIndex;
    return `<button class="product-tab${active ? ' active' : ''}" role="tab" aria-selected="${active}" aria-controls="panel-${size}" data-tab="${size}">${esc(sz.label)}</button>`;
  }).join('\n');

  const panels = sizes.map((size, i) => {
    const sz = s.products.sizes[size];
    const active = i === activeIndex;
    const items = products.filter(p => p.size === size).map(p => {
      const loc = lang === 'tr' ? p.tr : p.en;
      const href = `${productFolder}/${loc.slug}.html`;
      return `<article class="product-item">
        <a class="product-item-link" href="${href}">
          <img src="${a}${p.image}" alt="${esc(loc.title)}" loading="lazy">
          <h4>${esc(loc.title)}</h4>
          <span class="product-item-cta">${esc(s.products.viewDetail)}</span>
        </a>
      </article>`;
    }).join('\n');

    return `<div class="product-panel${active ? ' active' : ''}" id="panel-${size}" role="tabpanel"${active ? '' : ' hidden'}>
      <div class="product-panel-head">
        <div><span class="product-size">${esc(sz.badge)}</span><h3>${esc(sz.title)}</h3><p>${esc(sz.desc)}</p></div>
        <span class="product-badge">${esc(sz.badge === 'EN ÇOK ÜRETİLEN' || sz.badge === 'MOST POPULAR' ? sz.badge : sz.label)}</span>
      </div>
      <div class="product-gallery">${items}</div>
    </div>`;
  }).join('\n');

  const options = s.products.options.map(o =>
    `<div><strong>${esc(o.strong)}</strong><span>${esc(o.span)}</span></div>`
  ).join('\n');

  const head = asPage
    ? pageHeadSplit(s.products.eyebrow, s.products.title, s.products.subtitle, 'products-head')
    : sectionHeadSplit(s.products.eyebrow, s.products.title, s.products.subtitle, 'products-head');
  const tag = asPage ? 'main' : 'section';
  const cls = asPage ? ' class="page-main"' : ' class="section products-section"';

  return `<${tag}${cls}>
    <div class="container">
      ${head}
      <div class="product-tabs" role="tablist">${tabs}</div>
      <div class="product-panels">${panels}</div>
      <div class="product-options">${options}</div>
    </div>
  </${tag}>`;
}

const REF_SECTOR_ORDER = ['municipality', 'corporate', 'cafe', 'retail', 'education', 'healthcare', 'international'];

function refPrintLabel(lang, ref) {
  if (!ref.print) return '';
  return typeof ref.print === 'object' ? ref.print[lang] : ref.print;
}

function refDescLabel(lang, ref) {
  if (!ref.desc) return '';
  return typeof ref.desc === 'object' ? ref.desc[lang] : ref.desc;
}

function refSectorLabel(lang, sector) {
  const s = lang === 'tr' ? trSite : enSite;
  return s.refs.filters?.[sector] || sector;
}

function refMetaLine(lang, ref) {
  const parts = [
    ref.size ? ref.size.replace(/oz/i, ' OZ').toUpperCase() : '',
    refPrintLabel(lang, ref),
    ref.sector ? refSectorLabel(lang, ref.sector) : ''
  ].filter(Boolean);
  return parts.join(' · ');
}

function referenceCard(ref, i, lang, a, s, { clickable = false } = {}) {
  const loc = lang === 'tr' ? ref.tr : ref.en;
  const meta = refMetaLine(lang, ref);
  const desc = refDescLabel(lang, ref);
  const quoteMsg = (s.refs.quoteMessage || '').replace('{name}', loc.name);
  const attrs = [
    `class="reference-card reference-card-image${clickable ? ' reference-card-clickable' : ''}"`,
    `data-sector="${esc(ref.sector || '')}"`
  ];
  if (clickable) {
    attrs.push(
      `data-name="${esc(loc.name)}"`,
      `data-tag="${esc(loc.tag)}"`,
      `data-size="${esc(ref.size ? ref.size.replace(/oz/i, ' OZ').toUpperCase() : '')}"`,
      `data-print="${esc(refPrintLabel(lang, ref))}"`,
      `data-sector-label="${esc(refSectorLabel(lang, ref.sector))}"`,
      `data-desc="${esc(desc)}"`,
      `data-image="${esc(a + ref.image)}"`,
      `data-number="${String(i + 1).padStart(2, '0')}"`,
      `data-quote-href="${esc(waUrl(quoteMsg))}"`,
      `tabindex="0"`,
      `role="button"`,
      `aria-label="${esc(loc.name)} — ${esc(s.refs.viewDetail)}"`
    );
  }
  return `<article ${attrs.filter(Boolean).join(' ')}>
      <div class="reference-image"><img src="${a}${ref.image}" alt="${esc(loc.name)}" loading="lazy"></div>
      <div class="reference-card-body">
        <span class="reference-number">${String(i + 1).padStart(2, '0')}</span>
        <strong>${esc(loc.name)}</strong>
        <small>${esc(loc.tag)}</small>
        ${meta ? `<p class="reference-meta">${esc(meta)}</p>` : ''}
        ${clickable ? `<span class="reference-view">${esc(s.refs.viewDetail)}</span>` : ''}
      </div>
    </article>`;
}

function referenceFilters(lang, s) {
  const sectors = [...new Set(references.map(r => r.sector).filter(Boolean))];
  const sorted = REF_SECTOR_ORDER.filter(sec => sectors.includes(sec));
  const buttons = [`<button type="button" class="reference-filter active" data-sector="all">${esc(s.refs.filterAll)}</button>`];
  sorted.forEach(sec => {
    buttons.push(`<button type="button" class="reference-filter" data-sector="${sec}">${esc(s.refs.filters[sec])}</button>`);
  });
  return `<div class="reference-filters" role="group" aria-label="${esc(s.refs.filterLabel)}">${buttons.join('')}</div>`;
}

function referenceModal(lang, s) {
  return `<div class="reference-modal" id="referenceModal" hidden aria-hidden="true">
  <div class="reference-modal-backdrop" data-ref-close></div>
  <div class="reference-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="referenceModalTitle">
    <button type="button" class="reference-modal-close" data-ref-close aria-label="${esc(s.refs.modalClose)}">&times;</button>
    <div class="reference-modal-image"><img id="referenceModalImg" src="" alt=""></div>
    <div class="reference-modal-body">
      <span class="reference-number" id="referenceModalNum"></span>
      <h2 id="referenceModalTitle"></h2>
      <p class="reference-modal-tag" id="referenceModalTag"></p>
      <dl class="reference-modal-meta">
        <div><dt>${esc(s.refs.modalSize)}</dt><dd id="referenceModalSize"></dd></div>
        <div><dt>${esc(s.refs.modalPrint)}</dt><dd id="referenceModalPrint"></dd></div>
        <div><dt>${esc(s.refs.modalSector)}</dt><dd id="referenceModalSector"></dd></div>
      </dl>
      <p class="reference-modal-desc" id="referenceModalDesc"></p>
      <div class="reference-modal-actions">
        <a class="btn btn-primary" id="referenceModalQuote" href="#" target="_blank" rel="noopener">${esc(s.refs.modalQuote)}</a>
      </div>
    </div>
  </div>
</div>`;
}

function referencesSection(lang, s, depth, asPage = false) {
  const a = assets(depth);
  const cards = references.map((ref, i) => referenceCard(ref, i, lang, a, s, { clickable: asPage })).join('\n');

  const head = asPage
    ? pageHeadSplit(s.refs.eyebrow, s.refs.title, s.refs.desc, 'refs-head')
    : sectionHeadSplit(s.refs.eyebrow, s.refs.title, s.refs.desc, 'refs-head');

  return asPage
    ? `<div class="container refs-page">
      ${head}
      ${referenceFilters(lang, s)}
      <div class="reference-grid reference-grid-page">${cards}</div>
      <p class="reference-empty" id="referenceEmpty" hidden>${esc(s.refs.emptyFilter)}</p>
      ${referenceModal(lang, s)}
    </div>`
    : `<section class="section references-section">
    <div class="container">
      ${head}
      <div class="reference-grid">${cards}</div>
    </div>
  </section>`;
}

function homeProductsSection(lang, s, depth) {
  const a = assets(depth);
  const lp = langPrefix(depth);
  const productFolder = lang === 'tr' ? 'urunler' : 'products';
  const copy = lang === 'tr'
    ? {
        title: 'Popüler karton bardak modellerimiz.',
        subtitle: '4 OZ, 7 OZ ve 8 OZ seçeneklerimizden öne çıkan modeller. Tüm katalog için ürünler sayfasını inceleyin.',
        viewAll: 'Tüm Ürünleri Gör'
      }
    : {
        title: 'Popular paper cup models.',
        subtitle: 'Featured models from our 4 OZ, 7 OZ and 8 OZ range. Browse the products page for the full catalog.',
        viewAll: 'View All Products'
      };

  const featured = HOME_FEATURED_PRODUCT_IDS
    .map(id => products.find(p => p.id === id))
    .filter(Boolean);

  const items = featured.map(p => {
    const loc = lang === 'tr' ? p.tr : p.en;
    const sizeLabel = productsData.sizeInfo[p.size][lang].label;
    return `<article class="product-item home-product-item">
      <a class="product-item-link" href="${productFolder}/${loc.slug}.html">
        <span class="home-product-size">${esc(sizeLabel)}</span>
        <img src="${a}${p.image}" alt="${esc(loc.title)}" loading="lazy">
        <h4>${esc(loc.title)}</h4>
        <span class="product-item-cta">${esc(s.products.viewDetail)}</span>
      </a>
    </article>`;
  }).join('\n');

  return `<section class="section home-products-section">
    <div class="container">
      ${sectionHeadSplit(s.products.eyebrow, copy.title, copy.subtitle, 'home-products-head')}
      <div class="product-gallery home-product-gallery">${items}</div>
      <div class="home-products-action">
        <a class="btn btn-secondary" href="${lp}${PAGE_FILES[lang].products}">${esc(copy.viewAll)}</a>
      </div>
    </div>
  </section>`;
}

function buildHome(lang) {
  const s = lang === 'tr' ? trSite : enSite;
  const depth = 1;
  const a = assets(depth);
  const lp = langPrefix(depth);
  const canonical = baseUrl + s.homePath;
  const alternates = pageAlternates('home');
  const wa = waUrl(s.whatsappMessages.general);

  const html = `${seoHead({
    lang, locale: s.locale, title: s.meta.homeTitle, description: s.meta.homeDescription,
    canonical, alternates, depth, jsonLd: [orgJsonLd(lang), {
      '@context': 'https://schema.org', '@type': 'WebSite', name: BRAND_NAME, url: canonical
    }]
  })}
<body>
${headerHtml(lang, s, depth, 'home', relativeLangUrls(lang, 'home'))}
<main>
  <section class="hero">
    <div class="container hero-grid">
      <div class="hero-copy">
        <span class="eyebrow">${esc(s.hero.eyebrow)}</span>
        <h1>${esc(s.hero.title)} <span>${esc(s.hero.titleHighlight)}</span></h1>
        <p class="hero-text">${esc(s.hero.text)}</p>
        <div class="hero-actions">
          <a class="btn btn-primary" href="${wa}" target="_blank" rel="noopener">${esc(s.hero.ctaPrimary)}</a>
          <a class="btn btn-secondary" href="${lp}${PAGE_FILES[lang].products}">${esc(s.hero.ctaSecondary)}</a>
        </div>
      </div>
      <div class="hero-visual">
        <div class="hero-card">
          <img src="${a}images/7oz-karton-bardak/7oz-yildiz-karton-bardak.webp" alt="${esc(BRAND_NAME)} 7 oz">
          <div class="hero-badge"><strong>TEPE CUP</strong><small>Take it, drink it.</small></div>
        </div>
      </div>
    </div>
  </section>
  ${homeProductsSection(lang, s, depth)}
  ${ctaSectionHtml(lang, s)}
  ${whySectionHtml(lang, s, depth)}
</main>
${footerHtml(lang, s, depth)}
</body>
</html>`;

  write(`${lang}/index.html`, html);
}

function buildStandalonePage(lang, pageKey) {
  const s = lang === 'tr' ? trSite : enSite;
  const depth = 1;
  const meta = s.pagesMeta[pageKey];
  const canonical = pageCanonical(lang, pageKey);
  const alternates = pageAlternates(pageKey);
  const filename = PAGE_FILES[lang][pageKey];

  let body = '';
  if (pageKey === 'products') {
    body = productGallery(lang, s, depth, true);
  } else if (pageKey === 'print') {
    body = `<main class="page-main page-main-print">${mockupSection(lang, s, depth, true)}</main>`;
  } else if (pageKey === 'references') {
    body = `<main class="page-main page-main-muted">${referencesSection(lang, s, depth, true)}</main>`;
  } else if (pageKey === 'contact') {
    body = `<main class="page-main">${contactSectionHtml(lang, s, true)}${ctaSectionHtml(lang, s, true)}</main>`;
  }

  const html = `${seoHead({
    lang, locale: s.locale, title: meta.title, description: meta.metaDescription,
    canonical, alternates, depth, jsonLd: [orgJsonLd(lang)]
  })}
<body>
${headerHtml(lang, s, depth, pageKey, relativeLangUrls(lang, pageKey))}
${body}
${footerHtml(lang, s, depth)}
</body>
</html>`;

  write(`${lang}/${filename}`, html);
}

function productTechnicalSpecsHtml(lang, size, pd) {
  const sizeInfo = productsData.sizeInfo[size][lang];
  if (!sizeInfo.specs?.length) {
    return `<div class="product-detail-meta">
      <div><strong>${esc(pd.sizeLabel)}</strong><span>${esc(sizeInfo.label)} (${esc(sizeInfo.capacity)})</span></div>
    </div>`;
  }
  return `<h2>${esc(pd.technicalTitle)}</h2>
    <table class="product-specs">
      <tbody>${sizeInfo.specs.map(([label, value]) =>
        `<tr><th scope="row">${esc(label)}</th><td>${esc(value)}</td></tr>`
      ).join('')}</tbody>
    </table>`;
}

function buildProductPage(lang, product) {
  const s = lang === 'tr' ? trSite : enSite;
  const loc = lang === 'tr' ? product.tr : product.en;
  const depth = 2;
  const a = assets(depth);
  const lp = langPrefix(depth);
  const folder = lang === 'tr' ? 'urunler' : 'products';
  const canonical = baseUrl + `/${lang}/${folder}/${loc.slug}.html`;
  const alt = alternatePair(product);
  const langUrls = relativeLangUrls(lang, 'product', product);
  const sizeInfo = productsData.sizeInfo[product.size][lang];
  const features = productsData.commonFeatures[lang];
  const related = products.filter(p => p.size === product.size && p.id !== product.id).slice(0, 4);
  const pd = s.productDetail;
  const wa = waUrl(s.whatsappMessages.product.replace('{product}', loc.title));

  const relatedHtml = related.map(p => {
    const pl = lang === 'tr' ? p.tr : p.en;
    return `<a class="related-item" href="${pl.slug}.html">
      <img src="${a}${p.image}" alt="${esc(pl.title)}" loading="lazy">
      <span>${esc(pl.title)}</span>
    </a>`;
  }).join('\n');

  const html = `${seoHead({
    lang, locale: s.locale, title: loc.title + ` | ${BRAND_NAME}`, description: loc.metaDescription,
    canonical, alternates: alt, depth, ogImage: product.image, jsonLd: [{
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: loc.title,
      description: loc.description,
      image: baseUrl + '/' + product.image,
      brand: { '@type': 'Brand', name: BRAND_NAME },
      offers: {
        '@type': 'Offer', availability: 'https://schema.org/InStock', priceCurrency: 'TRY',
        url: canonical, seller: { '@type': 'Organization', name: BRAND_NAME }
      }
    }, {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: pd.breadcrumbHome, item: baseUrl + s.homePath },
        { '@type': 'ListItem', position: 2, name: pd.breadcrumbProducts, item: pageCanonical(lang, 'products') },
        { '@type': 'ListItem', position: 3, name: loc.title, item: canonical }
      ]
    }]
  })}
<body class="product-detail-page">
${headerHtml(lang, s, depth, 'products', langUrls)}
<main class="page-main">
  <div class="container">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a href="${lp}index.html">${esc(pd.breadcrumbHome)}</a>
        <span>/</span>
        <a href="${lp}${PAGE_FILES[lang].products}">${esc(pd.breadcrumbProducts)}</a>
        <span>/</span>
        <span aria-current="page">${esc(loc.title)}</span>
      </nav>
      <div class="product-single">
        <div class="product-single-image">
          <img src="${a}${product.image}" alt="${esc(loc.title)}">
        </div>
        <div class="product-single-content">
          <span class="product-size">${esc(sizeInfo.label)} · ${esc(sizeInfo.capacity)}</span>
          <h1>${esc(loc.title)}</h1>
          <p>${esc(loc.description)}</p>
          ${productTechnicalSpecsHtml(lang, product.size, pd)}
          <h2>${esc(pd.featuresTitle)}</h2>
          <ul class="detail-list">${features.map(f => `<li>${esc(f)}</li>`).join('')}</ul>
          <h2>${esc(pd.usesTitle)}</h2>
          <ul class="detail-list">${loc.uses.map(u => `<li>${esc(u)}</li>`).join('')}</ul>
          <div class="product-detail-actions">
            <a class="btn btn-primary" href="${wa}" target="_blank" rel="noopener">${esc(pd.quoteBtn)}</a>
            <a class="btn btn-secondary" href="${lp}${PAGE_FILES[lang].products}">${esc(pd.backToProducts)}</a>
          </div>
        </div>
      </div>
      ${related.length ? `<div class="related-products"><h2>${esc(pd.relatedTitle)}</h2><div class="related-grid">${relatedHtml}</div></div>` : ''}
  </div>
</main>
${footerHtml(lang, s, depth)}
</body>
</html>`;

  write(`${lang}/${folder}/${loc.slug}.html`, html);
}

function buildContentPage(lang, type) {
  const s = lang === 'tr' ? trSite : enSite;
  const depth = 1;
  const a = assets(depth);
  const page = s[type];
  const filename = lang === 'tr'
    ? { about: 'hakkimizda.html', faq: 'sss.html', privacy: 'kvkk.html' }[type]
    : { about: 'about.html', faq: 'faq.html', privacy: 'privacy.html' }[type];
  const canonical = baseUrl + `/${lang}/${filename}`;
  const alternates = pageAlternates(type);
  const langUrls = relativeLangUrls(lang, type);

  let body = '';
  if (type === 'faq') {
    body = `<div class="faq-list">${page.items.map(item =>
      `<details class="faq-item"><summary>${esc(item.q)}</summary><p>${esc(item.a)}</p></details>`
    ).join('\n')}</div>`;
  } else if (type === 'about' && page.points) {
    body = `<div class="about-points">${page.points.map((point, i) =>
      `<article class="about-point"><span>${String(i + 1).padStart(2, '0')}</span><h2>${esc(point.title)}</h2><p>${esc(point.text)}</p></article>`
    ).join('\n')}</div>`;
  } else {
    body = page.paragraphs.map(p => `<p>${esc(p)}</p>`).join('\n');
  }

  const jsonLd = type === 'faq' ? [{
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: page.items.map(item => ({
      '@type': 'Question', name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a }
    }))
  }] : [];

  const pageHead = pageHeadSplit(page.eyebrow, page.heading, page.metaDescription, `${type}-head page-head-block`);
  const aboutImage = type === 'about'
    ? `<figure class="about-visual"><img src="${a}images/tepecup-uretim.jpg" alt="${esc(lang === 'tr' ? 'Tepe Cup üretim tesisi' : 'Tepe Cup production facility')}"></figure>`
    : '';

  const html = `${seoHead({
    lang, locale: s.locale, title: page.title, description: page.metaDescription,
    canonical, alternates, depth, ogImage: type === 'about' ? `${baseUrl}/images/tepecup-uretim.jpg` : undefined, jsonLd
  })}
<body class="content-page">
${headerHtml(lang, s, depth, type, langUrls)}
<main class="page-main">
  <div class="container">
    ${pageHead}
    ${aboutImage}
    ${type === 'about' ? body : `<div class="content-body content-body-page">${body}</div>`}
  </div>
</main>
${footerHtml(lang, s, depth)}
</body>
</html>`;

  write(`${lang}/${filename}`, html);
}

function buildSitemap(urls) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.map(u => `  <url>
    <loc>${esc(u.loc)}</loc>${u.alternates ? u.alternates.map(a => `
    <xhtml:link rel="alternate" hreflang="${a.lang}" href="${esc(a.href)}"/>`).join('') : ''}
    <changefreq>${u.changefreq || 'monthly'}</changefreq>
    <priority>${u.priority || '0.8'}</priority>
  </url>`).join('\n')}
</urlset>`;
  write('sitemap.xml', xml);
}

function buildAll() {
  const urls = [];

  ['tr', 'en'].forEach(lang => {
    buildHome(lang);
    const s = lang === 'tr' ? trSite : enSite;
    urls.push({
      loc: pageCanonical(lang, 'home'),
      alternates: [{ lang: 'tr', href: pageCanonical('tr', 'home') }, { lang: 'en', href: pageCanonical('en', 'home') }],
      priority: '1.0'
    });

    STANDALONE_PAGES.forEach(pageKey => {
      buildStandalonePage(lang, pageKey);
      urls.push({
        loc: pageCanonical(lang, pageKey),
        alternates: [{ lang: 'tr', href: pageCanonical('tr', pageKey) }, { lang: 'en', href: pageCanonical('en', pageKey) }],
        priority: pageKey === 'products' ? '0.95' : '0.75'
      });
    });

    ['about', 'faq', 'privacy'].forEach(type => {
      buildContentPage(lang, type);
      urls.push({
        loc: pageCanonical(lang, type),
        alternates: [{ lang: 'tr', href: pageCanonical('tr', type) }, { lang: 'en', href: pageCanonical('en', type) }],
        priority: '0.6'
      });
    });

    products.forEach(product => {
      buildProductPage(lang, product);
      const loc = lang === 'tr' ? product.tr : product.en;
      const alt = alternatePair(product);
      urls.push({
        loc: baseUrl + productUrl(lang, product),
        alternates: [{ lang: 'tr', href: alt.tr }, { lang: 'en', href: alt.en }],
        priority: '0.9'
      });
    });
  });

  buildSitemap(urls);

  write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${baseUrl}/sitemap.xml\n`);

  write('index.html', `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0; url=/tr/">
  <link rel="canonical" href="${baseUrl}/tr/">
  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <title>${esc(BRAND_NAME)}</title>
  <script>location.replace('/tr/');</script>
</head>
<body><p><a href="/tr/">${esc(BRAND_NAME)}</a></p></body>
</html>`);

  publishStaticSite();

  console.log(`Built ${urls.length} URLs across TR/EN site.`);
}

function publishStaticSite() {
  const out = path.join(ROOT, 'public');
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });
  const entries = [
    'index.html',
    'robots.txt',
    'sitemap.xml',
    'favicon.ico',
    'apple-touch-icon.png',
    'google90218e5abf7d3090.html',
    'css',
    'js',
    'images',
    'tr',
    'en'
  ];
  for (const rel of entries) {
    const src = path.join(ROOT, rel);
    if (!fs.existsSync(src)) continue;
    fs.cpSync(src, path.join(out, rel), { recursive: true });
  }
}

buildAll();
