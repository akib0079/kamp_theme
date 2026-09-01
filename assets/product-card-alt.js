import { Component } from '@theme/component';
import { debounce, onDocumentLoaded } from '@theme/utilities';
import {
  ThemeEvents,
  CartUpdateEvent,
  CartAddEvent,
} from '@theme/events';

class ProductCardAlt extends Component {
    #slider = null;
    connectedCallback() {
        super.connectedCallback();
        this.init();
    }
    init(){
        onDocumentLoaded(() => {
            this.initSlider(); 
            this.initSwatches(); 
            //this.initAjaxCart(); 
        });
        if(this.classList.contains('globo-template-product')){
            this.fetchReviews();
        }
    }
    async fetchReviews(){
        const id = this.dataset.productId;
        if(id){
            const url = `https://api.judge.me/api/v1/widgets/preview_badge?api_token=DKyluAuaeKXc_lFDdw0vzHh_7Rs&shop_domain=kampeerwinkelecomm.myshopify.com&external_id=${id}`;
            try {
                const res = await fetch(url);
                const data = await res.json();
                // this.querySelector('.product-card__alt_price-wrapper').insertAdjacentHTML('beforeend', data.badge)

                // 1. Initialize the parser
                const parser = new DOMParser();

                // 2. Parse the string into an HTML document
                const doc = parser.parseFromString(data.badge, 'text/html');
                const badge = doc.querySelector('.jdgm-prev-badge')
                if(badge.dataset.averageRating && badge.dataset.averageRating != '0.00'){
                    badge.querySelector('.jdgm-prev-badge__text').innerHTML = `<span> ${Number(badge.dataset.averageRating)}</span> <span>${ badge.dataset.numberOfReviews }</span><span> reviews </span>`;
                    console.log(badge); // Outputs: Hello World
                    this.querySelector('.product-card__alt_price-wrapper').append(badge)
                }
                
            } catch (e) {
                console.log(e)
                return null;
            }
        }
    }
    initSlider(){
        this.#slider = new Swiper(this.querySelector('.product-card__alt-gallery'), {
            slidesPerView: 1,
        });
        this.addEventListener('variant_changed', (e) => {
            const { variantId } = e.detail;
            const mediaId = this.querySelector(`input[value="${variantId}"]`).dataset.media;
            if (!mediaId) return;
            const slideIndex = [...this.#slider.slides].findIndex(
                slide => slide.dataset.mediaId == mediaId
            );

            if (slideIndex === -1) return;

            this.#slider.slideTo(slideIndex);
        })
    }
    initSwatches(){
        this.addEventListener('change', (e) => {
            if (!e.target.classList.contains('js-option')) return;

            const selectedOptions = this.getSelectedOptions();

            // if not all options selected yet, bail
            if (selectedOptions.includes(null)) return;
            const variant = this.findVariantByOptions(
                selectedOptions
            );
            if (!variant) return;
            this.dispatchEvent(
                new CustomEvent('variant_changed', {
                detail: {
                    variantId: variant,
                    options: selectedOptions
                }
                })
            );
        });
    }
    initAjaxCart(){
        const btn = this.querySelector('.quick-add');
        if(!btn) return;
        this.addEventListener('variant_changed', (e) => {
            const { variantId } = e.detail;
            btn.dataset.variantId = variantId;
        })
        btn.addEventListener('click', e=>{
            e.preventDefault();
            btn.classList.add('btn--in-progress');
            fetch(Theme.routes.cart_add_url, {
                method: 'POST',
                body: JSON.stringify({
                    items: [
                    {
                    id: btn.dataset.variantId,
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
                            variantId: btn.dataset.variantId,
                        })
                    );
                    btn.classList.add('check');
                    setTimeout(() => {
                    btn.classList.remove('check');
                    }, 1500)
                    Theme.showQuickPopup("Added to cart", btn);
                } else if (response.description) {
                    Theme.showQuickPopup(response.description, btn);
                }
            });
        })
    }
    getSelectedOptions() {
        const selectors = this.querySelectorAll('.product-alt__option-selector');
        const values = [];

        selectors.forEach((selector) => {
            const checked = selector.querySelector('.js-option:checked');
            values.push(checked ? {"position": checked.dataset.position, "value": checked.value} : null);
        });

        return values;
    }
    findVariantByOptions(options) {
        const selector = options
        .map(o => `[option-${o.position}="${CSS.escape(o.value)}"]`)
        .join('');
        return this.querySelector(selector).value;
    }

    
}
if (!customElements.get('product-card-alt')) {
  customElements.define('product-card-alt', ProductCardAlt);
}