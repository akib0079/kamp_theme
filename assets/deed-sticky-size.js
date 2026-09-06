/* ============================================================
   Sticky add-to-cart balk: maatkiezer in plaats van aantal (DEED, 06-09-2026)
   De balk (.product-alt__bottom-bar in sections/product-main-alt.liquid)
   krijgt een eigen dropdown (geen native <select>) die de maat-radio's van
   de hoofdvariantkiezer spiegelt. De lijst opent naar boven, zodat de
   gekozen maat in de knop zichtbaar blijft. Kiezen in de balk zet de
   bijbehorende radio en vuurt 'change', zodat alle bestaande themalogica
   (beschikbaarheid, variant-id, prijs, knopstatus) gewoon blijft werken.
   Kiezen in de hoofdkiezer werkt de dropdown bij. Styling: deed-custom.css.
   ============================================================ */
(function () {
  var LABELS = { nl: 'Kies je maat', en: 'Choose your size', de: 'Größe wählen' };
  var SOLD_OUT = { nl: 'uitverkocht', en: 'sold out', de: 'ausverkauft' };
  var CHEVRON = '<svg class="deed-bb-size__chevron" width="12" height="8" viewBox="0 0 12 8" fill="none" aria-hidden="true"><path d="M1 1.5l5 5 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
  var CHECK = '<svg class="deed-bb-size__check" width="12" height="10" viewBox="0 0 12 10" fill="none" aria-hidden="true"><path d="M1 6.15652C1 6.15652 2.03125 6.15652 3.40625 8.56277C3.40625 8.56277 7.22793 2.26069 10.625 1.00027" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function init() {
    var bar = document.querySelector('.product-alt__bottom-bar');
    var picker = document.querySelector('.product-alt__variant-picker');
    if (!bar || !picker) return;

    // Maatkiezer = laatste optie die geen kleurswatch is
    var selectors = picker.querySelectorAll('.product-alt__option-selector:not(.option-selector--swatch)');
    if (!selectors.length) return;
    var sizeSelector = selectors[selectors.length - 1];
    var radios = Array.prototype.slice.call(sizeSelector.querySelectorAll('.js-option'));
    if (!radios.length) return;

    var row = bar.querySelector('.product-alt__buy-row');
    var qty = bar.querySelector('.product-alt__buy-quantity');
    if (!row) return;

    var lang = (document.documentElement.lang || 'nl').slice(0, 2);
    var placeholder = LABELS[lang] || LABELS.nl;
    var soldOut = SOLD_OUT[lang] || SOLD_OUT.nl;

    var wrap = document.createElement('div');
    wrap.className = 'deed-bb-size';

    var trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'deed-bb-size__trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.innerHTML = '<span class="deed-bb-size__value"></span>' + CHEVRON;

    var panel = document.createElement('div');
    panel.className = 'deed-bb-size__panel';
    panel.setAttribute('role', 'listbox');
    panel.setAttribute('aria-label', placeholder);

    wrap.appendChild(trigger);
    wrap.appendChild(panel);

    function labelFor(radio) {
      return radio.nextElementSibling ? radio.nextElementSibling.textContent.trim() : radio.value;
    }

    function build() {
      panel.innerHTML = '';
      var current = null;
      radios.forEach(function (r) {
        var unavailable = r.classList.contains('is-unavailable');
        var item = document.createElement('button');
        item.type = 'button';
        item.className = 'deed-bb-size__option';
        item.setAttribute('role', 'option');
        item.dataset.value = r.value;
        if (r.checked) {
          item.classList.add('is-active');
          item.setAttribute('aria-selected', 'true');
          current = r;
        }
        if (unavailable) {
          item.classList.add('is-unavailable');
          item.disabled = true;
        }
        item.innerHTML =
          '<span class="deed-bb-size__option-label">' + labelFor(r) + '</span>' +
          (unavailable ? '<span class="deed-bb-size__option-note">' + soldOut + '</span>' : CHECK);
        panel.appendChild(item);
      });
      var valueEl = trigger.querySelector('.deed-bb-size__value');
      valueEl.textContent = current ? labelFor(current) : placeholder;
      wrap.classList.toggle('has-value', !!current);
    }

    function open() {
      wrap.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
      var active = panel.querySelector('.is-active');
      if (active && active.scrollIntoView) active.scrollIntoView({ block: 'nearest' });
    }
    function close() {
      wrap.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
    }

    trigger.addEventListener('click', function (e) {
      e.preventDefault();
      wrap.classList.contains('is-open') ? close() : open();
    });

    // Balk -> hoofdkiezer
    panel.addEventListener('click', function (e) {
      var item = e.target.closest('.deed-bb-size__option');
      if (!item || item.disabled) return;
      var value = item.dataset.value;
      radios.forEach(function (r) {
        if (r.value === value && !r.checked) {
          r.checked = true;
          r.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
      build();
      close();
    });

    document.addEventListener('click', function (e) {
      if (!wrap.contains(e.target)) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });

    // Hoofdkiezer -> balk (ook beschikbaarheid na een kleurkeuze)
    picker.addEventListener('change', function (e) {
      if (!e.target.classList || !e.target.classList.contains('js-option')) return;
      // Even wachten tot het thema de is-unavailable-classes heeft bijgewerkt
      setTimeout(build, 0);
    });

    build();

    if (qty) {
      row.insertBefore(wrap, qty);
    } else {
      row.insertBefore(wrap, row.firstChild);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
