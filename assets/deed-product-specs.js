/* ============================================================
   Productpagina: tab "Eigenschappen" koppelen aan de specs-metavelden
   (DEED, 06-09-2026)
   Het thema rendert in de tab_details-tab van sections/product-main-alt.liquid
   alleen de statische richtext uit de blokinstelling. In het live thema
   kwamen de eigenschappen uit het metaobject in product.metafields.specs.*
   (blok metaobject_specs, de slide-in). snippets/deed-product-specs.liquid
   zet datzelfde metaobject als JSON op de pagina; dit script bouwt daar de
   rijen van in de tab, met dezelfde regels als het thema (zelfde skip-lijst,
   labels uit Theme.specs_label, booleans als Ja/Nee). Geen metaobject =
   tab en tabknop verbergen.
   ============================================================ */
(function () {
  var SKIP = ['id', 'admin_graphql_api_id', 'handle', 'display_name', 'updated_at', 'created_at', 'type', 'categorie_type'];
  var YES = { nl: 'Ja', en: 'Yes', de: 'Ja' };
  var NO = { nl: 'Nee', en: 'No', de: 'Nein' };
  var MORE = { nl: 'Toon meer', en: 'Show more', de: 'Mehr anzeigen' };
  var LESS = { nl: 'Toon minder', en: 'Show less', de: 'Weniger anzeigen' };

  function init() {
    var tab = document.querySelector('.product-main__tab.tab-details');
    if (!tab) return;
    var textWrap = tab.querySelector('.product-main__tab-details-text');
    if (!textWrap) return;
    var lang = (document.documentElement.lang || 'nl').slice(0, 2);

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

    var dataEl = document.getElementById('deed-product-specs');
    var data = null;
    if (dataEl) {
      try { data = JSON.parse(dataEl.textContent); } catch (e) { data = null; }
    }
    if (!data || typeof data !== 'object') { hideTab(); return; }

    // Theme is in dit thema een lexicale global (geen window.Theme), vandaar typeof
    var labels = {};
    try { if (typeof Theme !== 'undefined' && Theme.specs_label) labels = Theme.specs_label; } catch (e) {}
    var ul = document.createElement('ul');
    Object.keys(data).forEach(function (key) {
      var lower = key.toLowerCase();
      for (var i = 0; i < SKIP.length; i++) { if (lower.indexOf(SKIP[i]) !== -1) return; }
      var value = data[key];
      var display;
      if (value === true || value === 'true') display = YES[lang] || YES.nl;
      else if (value === false || value === 'false') display = NO[lang] || NO.nl;
      else if (value === null || value === undefined || value === '') return;
      else if (Array.isArray(value)) display = value.join(', ');
      else if (typeof value === 'object') return;
      else display = String(value);
      if (display.trim() === '' || display === '0') return;

      var label = labels[key] || key.replace(/[_-]/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
      var li = document.createElement('li');
      var h = document.createElement('span'); h.className = 'heading'; h.textContent = label;
      var t = document.createElement('span'); t.className = 'text'; t.textContent = display;
      li.appendChild(h); li.appendChild(t);
      ul.appendChild(li);
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
        link.innerHTML = '<span class="product-main__details-more-text"><span>' + (MORE[lang] || MORE.nl) + '</span><span>' + (LESS[lang] || LESS.nl) + '</span></span>';
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
