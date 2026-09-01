import { DialogComponent } from '@theme/dialog';
import { CartAddEvent } from '@theme/events';

/**
 * A custom element that manages a cart drawer.
 *
 * @extends {DialogComponent}
 */
class CartDrawerComponent extends DialogComponent {
  #recommSlider = null;

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener(CartAddEvent.eventName, this.#handleCartAdd);

    this.#initRecommSlider();
    this.#initiateAjaxRecomm();
    
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener(CartAddEvent.eventName, this.#handleCartAdd);
  }

  #handleCartAdd = () => {
    if (this.hasAttribute('auto-open')) {
      this.showDialog();
    }

    this.#updateRecommSlider();
  };

  #initiateAjaxRecomm () {
    this.querySelector('.cart-drawer__content')?.addEventListener('click', e=>{
      let prod = null;
      if(e.target.classList.contains('.cart-drawer__recomm_add-button') || e.target.closest('.cart-drawer__recomm_add-button')){
        prod = e.target.closest('.cart-drawer__recomm_product')
      }
      if(prod){
        e.preventDefault()
        const variantId = prod.querySelector('[data-input-curr-variant-id]').value
        const btn = prod.querySelector('.cart-drawer__recomm_add-button')
        btn.classList.add('btn--in-progress');
        fetch(Theme.routes.cart_add_url, {
            method: 'POST',
            body: JSON.stringify({
                items: [
                {
                    id: variantId,
                    quantity: 1
                }]

            }),
            headers: {
                "Content-Type": "application/json"
            }
        }).
        then((response) => {
            btn.classList.remove('btn--in-progress');
            return response.json();
        }).
        then((response) => {
            if (!response.status || response.status === 200) {
                document.dispatchEvent(
                    new CustomEvent('Theme:cartchanged', { bubbles: true, cancelable: false })
                );
                document.dispatchEvent(
                    new CartAddEvent(null, null, {
                        source: 'quick-add',
                        variantId: variantId,
                    })
                );
                console.log(variantId)
                btn.classList.add('check');
                setTimeout(() => {
                btn.classList.remove('check');
                }, 1500)
            } else if (response.description) {
                Theme.showQuickPopup(response.description, btn);
            }
        });
      }
    })
  };

  open() {
    this.showDialog();

    /**
     * Close cart drawer when installments CTA is clicked to avoid overlapping dialogs
     */
    customElements.whenDefined('shopify-payment-terms').then(() => {
      const installmentsContent = document.querySelector('shopify-payment-terms')?.shadowRoot;
      const cta = installmentsContent?.querySelector('#shopify-installments-cta');
      cta?.addEventListener('click', this.closeDialog, { once: true });
    });
  }

  close() {
    this.closeDialog();
  }

  


  #initRecommSlider() {
    const slider = this.querySelector('.cart-drawer__recomm-slider');
    if (!slider) return;

    if (this.#recommSlider) {
      this.#recommSlider.destroy(true, true);
      this.#recommSlider = null;
    }

    this.#recommSlider = new Swiper(slider, {
      slidesPerView: 'auto',
      pagination: {
        el: '.swiper-pagination',
        clickable: true,
      },
    });
  }
  async #updateRecommSlider() {
    const sectionId = this.querySelector('cart-items-component')?.dataset.sectionId;
    if (!sectionId) return;

    const url = new URL(window.location.href);
    url.searchParams.set('section_id', sectionId);

    const html = await fetch(url).then(r => r.text());
    const fragment = new DOMParser().parseFromString(html, 'text/html');

    const newSliderWrapper = fragment.querySelector('.cart-drawer__recomm-slider-wrapper');
    const oldSliderWrapper = this.querySelector('.cart-drawer__recomm-slider-wrapper');
    const oldSwiperWrapper = oldSliderWrapper?.querySelector('.swiper-wrapper');
    const newSwiperWrapper = newSliderWrapper?.querySelector('.swiper-wrapper');

    if (newSliderWrapper && !oldSliderWrapper) {
      // Slider didn't exist but now should — insert and init
      this.querySelector('scroll-hint')?.appendChild(newSliderWrapper);
      this.#initRecommSlider();

    } else if (!newSliderWrapper && oldSliderWrapper) {
      // Slider existed but should now be gone
      this.#recommSlider?.destroy(true, true);
      this.#recommSlider = null;
      oldSliderWrapper.remove();

    } else if (oldSwiperWrapper && newSwiperWrapper) {
      // Slider exists in both — update slides
      oldSwiperWrapper.innerHTML = newSwiperWrapper.innerHTML;
      this.#recommSlider?.update();
    }
  }

}

if (!customElements.get('cart-drawer-component')) {
  customElements.define('cart-drawer-component', CartDrawerComponent);
}
