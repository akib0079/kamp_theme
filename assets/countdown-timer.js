import { Component } from '@theme/component';
import { onDocumentLoaded } from '@theme/utilities';

class CountdownTimer extends Component {
  #interval = null;
  #endDate = null;
  #observer = null;
  #isVisible = false;

  connectedCallback() {
    super.connectedCallback();
    onDocumentLoaded(() => this.init());
  }

  disconnectedCallback() {
    if (this.#interval) {
      clearInterval(this.#interval);
    }
  }

  init() {
    const endDateStr = this.dataset.endDate;
    if (!endDateStr) return;

    this.hideOnComplete = this.dataset.hideOnComplete === 'true';
    this.timezone = this.dataset.timezone || 'store';

    this.cacheElements();
    this.parseEndDate(endDateStr);

    if (!this.#endDate) return;
    this.initVisibilityObserver();

    this.tick();
    this.#interval = setInterval(() => this.tick(), 1000);
  }

  cacheElements() {
    this.daysEl = this.querySelector('[data-days]');
    this.hoursEl = this.querySelector('[data-hours]');
    this.minutesEl = this.querySelector('[data-minutes]');
    this.secondsEl = this.querySelector('[data-seconds]');
  }

  parseEndDate(str) {
    if (this.timezone === 'utc') {
      this.#endDate = new Date(str + ' UTC');
    } else {
      this.#endDate = new Date(str.replace(' ', 'T'));
    }

    if (isNaN(this.#endDate)) {
      console.warn('Invalid countdown date:', str);
      this.#endDate = null;
    }
  }

  tick() {
    const now = new Date();
    let diff = this.#endDate - now;

    if (diff <= 0) {
      this.update(0, 0, 0, 0);
      clearInterval(this.#interval);

      this.dispatchEvent(
        new CustomEvent('countdown_finished', {
          bubbles: true,
          detail: { endDate: this.#endDate }
        })
      );

      if (this.hideOnComplete) {
        this.style.display = 'none';
      }

      return;
    }

    const days = Math.floor(diff / 86400000);
    diff %= 86400000;
    const hours = Math.floor(diff / 3600000);
    diff %= 3600000;
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    this.update(days, hours, minutes, seconds);
  }

  update(d, h, m, s) {
    if (this.daysEl) this.daysEl.textContent = this.pad(d);
    if (this.hoursEl) this.hoursEl.textContent = this.pad(h);
    if (this.minutesEl) this.minutesEl.textContent = this.pad(m);
    if (this.secondsEl) this.secondsEl.textContent = this.pad(s);
  }

  pad(num) {
    return String(num).padStart(2, '0');
  }

    initVisibilityObserver() {
        this.#observer = new IntersectionObserver(
            (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                this.#isVisible = true;
                this.start();
                } else {
                this.#isVisible = false;
                this.stop();
                }
            });
            },
            {
            threshold: 0.2 // at least 20% visible
            }
        );

        this.#observer.observe(this);
    }

    start() {
        if (this.#interval) return; // already running
        this.tick();
        this.#interval = setInterval(() => this.tick(), 1000);
    }

    stop() {
        if (!this.#interval) return;
        clearInterval(this.#interval);
        this.#interval = null;
    }


}

if (!customElements.get('countdown-timer')) {
  customElements.define('countdown-timer', CountdownTimer);
}
