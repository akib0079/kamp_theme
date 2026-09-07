/* ============================================================
   Productpagina: tab "Eigenschappen" koppelen aan de specs-metavelden
   (DEED, 06-09-2026; vertalingen NL/EN/DE toegevoegd 07-09-2026)
   Het thema rendert in de tab_details-tab van sections/product-main-alt.liquid
   alleen de statische richtext uit de blokinstelling. In het live thema
   kwamen de eigenschappen uit het metaobject in product.metafields.specs.*
   (blok metaobject_specs, de slide-in). snippets/deed-product-specs.liquid
   zet datzelfde metaobject als JSON op de pagina; dit script bouwt daar de
   rijen van in de tab, met dezelfde regels als het thema (zelfde skip-lijst,
   maar op exacte sleutel zodat velden als tent_type wel getoond worden;
   booleans als Ja/Nee). Geen metaobject = tab en tabknop verbergen.

   Vertaling:
   - Labels: eerst Theme.specs_label (locales/*.json via snippets/specs-label.liquid,
     255 sleutels), daarna assets/deed-specs-labels.json (de 439 sleutels uit de
     metaobject-definities die daar ontbreken: {"sleutel":["NL","EN","DE"]}),
     anders de sleutel zelf netjes opgemaakt.
   - Waarden (EN/DE): de specs-metaobjecten zijn in Shopify niet vertaalbaar,
     dus tekstwaarden worden vertaald via assets/deed-specs-values.json
     ({"Nederlandse waarde":["EN","DE"]}, opgebouwd uit alle bestaande
     specs-entries) plus patroonregels hieronder (aantallen, temperatuur-
     bereiken, afmetingen). Getallen, maten, merk- en modelnamen blijven
     zoals ze zijn. Lange Nederlandse vrije teksten (verzorgingsinstructies
     enz.) die niet vertaald kunnen worden, worden op EN/DE verborgen.
   Nieuw woord toevoegen: regel toevoegen in deed-specs-values.json.
   De URL's van beide JSON-bestanden staan als data-attributen op het
   <script id="deed-product-specs"> element (snippet).
   ============================================================ */
(function () {
  var SKIP = ['id', 'admin_graphql_api_id', 'handle', 'display_name', 'updated_at', 'created_at', 'type', 'categorie_type'];
  var YES = { nl: 'Ja', en: 'Yes', de: 'Ja' };
  var NO = { nl: 'Nee', en: 'No', de: 'Nein' };
  var MORE = { nl: 'Toon meer', en: 'Show more', de: 'Mehr anzeigen' };
  var LESS = { nl: 'Toon minder', en: 'Show less', de: 'Weniger anzeigen' };
  var LANG_INDEX = { nl: 0, en: 1, de: 2 };

  // Patroonregels voor waarden die niet letterlijk in het woordenboek staan
  var PATTERNS = {
    en: [
      [/^(\d+) Personen$/i, '$1 persons'],
      [/^(\d+) Ingangen$/i, '$1 entrances'],
      [/^(\d+) fietsen$/i, '$1 bikes'],
      [/^(\d+) jaar$/i, '$1 years'],
      [/\btot\b/g, 'to'],
      [/\bLengte\b/g, 'Length'], [/\blengte\b/g, 'length'],
      [/\bHoogte\b/g, 'Height'], [/\bhoogte\b/g, 'height'],
      [/\bBreedte\b/g, 'Width'], [/\bbreedte\b/g, 'width'],
      [/\bDiepte\b/g, 'Depth'],
      [/\(L x B x H\)/g, '(L x W x H)'],
      [/\bper haring\b/g, 'per peg'],
      [/\bper karabijnhaak\b/g, 'per carabiner'], [/\bper karabiner\b/g, 'per carabiner'],
      [/\bSet van (\d+) stuks\b/g, 'Set of $1'],
      [/\bper stuk\b/g, 'each'],
      [/\bper rol\b/g, 'per roll'],
      [/\bopgevouwen\b/g, 'folded'], [/\bontvouwen\b/g, 'unfolded'],
      [/\bkabellengte\b/g, 'cable length'],
      [/\bcreditcardformaat\b/g, 'credit card size'],
      [/\bUitschuifbaar\b/g, 'Extendable'],
      [/\bGeschikte riembreedte\b/g, 'Suitable strap width'],
      [/\bmeter\b/g, 'm']
    ],
    de: [
      [/^(\d+) Ingangen$/i, '$1 Eingänge'],
      [/^(\d+) fietsen$/i, '$1 Fahrräder'],
      [/^(\d+) jaar$/i, '$1 Jahre'],
      [/\btot\b/g, 'bis'],
      [/\bLengte\b/g, 'Länge'], [/\blengte\b/g, 'Länge'],
      [/\bHoogte\b/g, 'Höhe'], [/\bhoogte\b/g, 'Höhe'],
      [/\bBreedte\b/g, 'Breite'], [/\bbreedte\b/g, 'Breite'],
      [/\bDiepte\b/g, 'Tiefe'],
      [/\bDiameter\b/g, 'Durchmesser'],
      [/\bper haring\b/g, 'pro Hering'],
      [/\bper karabijnhaak\b/g, 'pro Karabiner'], [/\bper karabiner\b/g, 'pro Karabiner'],
      [/\bSet van (\d+) stuks\b/g, 'Set mit $1 Stück'],
      [/\bper stuk\b/g, 'pro Stück'],
      [/\bper rol\b/g, 'pro Rolle'],
      [/\bopgevouwen\b/g, 'gefaltet'], [/\bontvouwen\b/g, 'entfaltet'],
      [/\bkabellengte\b/g, 'Kabellänge'],
      [/\bcreditcardformaat\b/g, 'Kreditkartenformat'],
      [/\bUitschuifbaar\b/g, 'Ausziehbar'],
      [/\bGeschikte riembreedte\b/g, 'Passende Gurtbreite'],
      [/\bmeter\b/g, 'm']
    ]
  };
  // Woorden waaraan een onvertaalde Nederlandse zin te herkennen is
  var DUTCH = /\b(de|het|een|met|voor|niet|bij|wordt|worden|gebruik|geschikt|regelmatig|reinig|laten|drogen|wassen|voorkomen|controleer|vermijd|afvegen|doek|alleen|zowel|ontworpen|compatibel met)\b/i;

  function fetchJson(url) {
    if (!url || typeof fetch !== 'function') return Promise.resolve({});
    return fetch(url, { credentials: 'omit' })
      .then(function (r) { return r.ok ? r.json() : {}; })
      .catch(function () { return {}; });
  }

  function makeTranslator(values, lang) {
    var idx = lang === 'de' ? 1 : 0;
    var lowerMap = {};
    Object.keys(values).forEach(function (k) { lowerMap[k.toLowerCase()] = values[k]; });
    return function (value) {
      if (lang === 'nl') return value;
      var hit = values[value] || lowerMap[value.toLowerCase()];
      if (hit && hit[idx]) return hit[idx];
      // Onvertaalbare Nederlandse vrije tekst (zinnen): niet tonen op EN/DE
      if (value.length > 45 || (value.length > 25 && DUTCH.test(value))) return null;
      var out = value;
      (PATTERNS[lang] || []).forEach(function (rule) { out = out.replace(rule[0], rule[1]); });
      return out;
    };
  }

  function render(data, labelsExtra, values) {
    var tab = document.querySelector('.product-main__tab.tab-details');
    if (!tab) return;
    var textWrap = tab.querySelector('.product-main__tab-details-text');
    if (!textWrap) return;
    var lang = (document.documentElement.lang || 'nl').slice(0, 2).toLowerCase();
    if (!(lang in LANG_INDEX)) lang = 'en';
    var li = LANG_INDEX[lang];

    var headerLink = null;
    var id = tab.getAttribute('data-id');
    if (id) {
      var a = document.querySelector('.product-main__tabs-hedader-link[data-id="' + id + '"]');
      headerLink = a ? a.closest('.swiper-slide') || a : null;
    }
    function hideTab() {
      tab.style.display = 'none';
      if (headerLink) headerLink.style.display = 'none';
    }
    if (!data || typeof data !== 'object') { hideTab(); return; }

    // Theme is in dit thema een lexicale global (geen window.Theme), vandaar typeof
    var themeLabels = {};
    try { if (typeof Theme !== 'undefined' && Theme.specs_label) themeLabels = Theme.specs_label; } catch (e) {}
    var translate = makeTranslator(values || {}, lang);

    var ul = document.createElement('ul');
    Object.keys(data).forEach(function (key) {
      // Exacte match (het thema zelf matcht op deelstring, waardoor alle *_type velden wegvallen)
      if (SKIP.indexOf(key.toLowerCase()) !== -1) return;
      var value = data[key];
      var display;
      if (value === true || value === 'true') display = YES[lang];
      else if (value === false || value === 'false') display = NO[lang];
      else if (value === null || value === undefined || value === '') return;
      else if (Array.isArray(value)) {
        var parts = [];
        for (var j = 0; j < value.length; j++) {
          var p = String(value[j]).trim();
          if (!p || p === 'null' || p === '[object Object]') continue;
          var tp = translate(p);
          if (tp !== null) parts.push(tp);
        }
        if (!parts.length) return;
        display = parts.join(', ');
      }
      else if (typeof value === 'object') return;
      else {
        var s = String(value).trim();
        if (!s || s === 'null' || s === '[object Object]') return;
        if (/^-?\d+([.,]\d+)?$/.test(s)) display = s;
        else {
          display = translate(s);
          if (display === null) return;
        }
      }
      if (display.trim() === '' || display === '0') return;

      var label = themeLabels[key];
      if (!label && labelsExtra && labelsExtra[key]) label = labelsExtra[key][li] || labelsExtra[key][0];
      if (!label) label = key.replace(/[_-]/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });

      var row = document.createElement('li');
      var h = document.createElement('span'); h.className = 'heading'; h.textContent = label;
      var t = document.createElement('span'); t.className = 'text'; t.textContent = display;
      row.appendChild(h); row.appendChild(t);
      ul.appendChild(row);
    });

    if (!ul.children.length) { hideTab(); return; }

    textWrap.innerHTML = '';
    textWrap.appendChild(ul);
    tab.classList.remove('expanded');

    // "Toon meer": zelfde gedrag als het thema (inklappen na 4 rijen bij meer dan 10)
    var moreWrap = tab.querySelector('.product-main__details-more-wrap');
    var link = tab.querySelector('.product-main__details-more');
    if (ul.children.length > 10) {
      if (!link) {
        if (!moreWrap) { moreWrap = document.createElement('div'); moreWrap.className = 'product-main__details-more-wrap'; tab.appendChild(moreWrap); }
        link = document.createElement('a');
        link.href = '#';
        link.className = 'product-main__details-more';
        link.innerHTML = '<span class="product-main__details-more-text"><span>' + MORE[lang] + '</span><span>' + LESS[lang] + '</span></span>';
        moreWrap.appendChild(link);
      }
      var fifth = ul.children[4];
      var distance = fifth.getBoundingClientRect().top - textWrap.getBoundingClientRect().top;
      tab.style.setProperty('--height', distance + 'px');
      var fresh = link.cloneNode(true);
      link.parentNode.replaceChild(fresh, link);
      fresh.addEventListener('click', function (e) {
        e.preventDefault();
        tab.classList.toggle('expanded');
      });
    } else {
      tab.style.removeProperty('--height');
      if (link) link.remove();
    }
  }

  function init() {
    var dataEl = document.getElementById('deed-product-specs');
    var data = null;
    if (dataEl) {
      try { data = JSON.parse(dataEl.textContent); } catch (e) { data = null; }
    }
    if (!data) { render(null, {}, {}); return; }
    var lang = (document.documentElement.lang || 'nl').slice(0, 2).toLowerCase();
    var labelsUrl = dataEl.getAttribute('data-labels');
    var valuesUrl = lang === 'nl' ? null : dataEl.getAttribute('data-values');
    Promise.all([fetchJson(labelsUrl), fetchJson(valuesUrl)]).then(function (res) {
      render(data, res[0], res[1]);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
