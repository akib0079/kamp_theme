import { Component } from '@theme/component';
import { debounce, onDocumentReady } from '@theme/utilities';
import { MegaMenuHoverEvent } from '@theme/events';

class MegaMenu extends Component {

  #abortController = new AbortController();
   /**
   * @type {State}
   */

  #state = {
    activeItem: null,
  };
  #closeTimeout = null;
  #mobile = false;

  connectedCallback() {
    super.connectedCallback();

    // this.overflowMenu?.addEventListener('pointerleave', () => this.#debouncedDeactivate(), {
    //   signal: this.#abortController.signal,
    // });

    // onDocumentLoaded(this.#preloadImages);
    
    
    this.init();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#abortController.abort();
  }
  init(){
    if(this.closest('header-drawer')) this.#mobile = true;
    this.querySelectorAll('.mega-menu__anchor-link').forEach(item => {
        item.addEventListener('click', e => {
          // if (this.#mobile){
              e.preventDefault();
              this.activateItem(item);
            // }
        })
        // item.addEventListener('mouseenter', e => {
        //     if (!this.#mobile)
        //     this.activateItem(item);
        // })
    })
    if (!this.#mobile){
      this.#state.activeItem = this.querySelector('.mega-menu__anchor-link.active');
      this.closest('.mega-menu__list').style.setProperty('--megamenu-content-height', this.querySelector(`.mega-menu__content[data-id="${this.#state.activeItem.dataset.id}"]`).scrollHeight + 'px');
    }
    else{
      this.querySelector('.mega-menu__anchor-link.active').classList.remove('active');
      this.querySelector('.mega-menu__content.active').classList.remove('active');
    }
    
    this.closest('.menu-list__list-item.megamenu').querySelector('.menu-list__link').addEventListener('mouseenter', () => {
      clearTimeout(this.#closeTimeout);
      if(this.closest('.menu-list__list-item.megamenu').classList.contains('active')) return;
      this.closest('.menu-list__list-item.megamenu').classList.add("active");
      document.body.classList.add("megamenu-active");
    })
    this.addEventListener('mouseenter', () => {
      if (this.#mobile) return;
      clearTimeout(this.#closeTimeout);
    })
    this.addEventListener('mouseleave', () => {
      if (this.#mobile) return;
      this.#closeTimeout = setTimeout(this.closeMegaMenu, 150);
    })
    this.closest('.menu-list__list-item.megamenu').addEventListener('mouseleave', () => {
      if (this.#mobile) return;
      this.#closeTimeout = setTimeout(this.closeMegaMenu, 150);
    })
    this.closest('.menu-list__list-item.megamenu').querySelector('.menu-list__link').addEventListener('click', e => {
      e.preventDefault();
      if (!this.#mobile) return;
      this.closest('.menu-list__list-item.megamenu').classList.add("active");
    })
    if (this.#mobile){
      this.querySelectorAll('.megamenu__close-button').forEach(item => {
        item.addEventListener('click', e => {
          e.preventDefault();
            if(item.classList.contains('content-close'))
              this.deactivateActiveItem()
            else
            item.closest('.active').classList.remove("active");
        })
    })
    }
  }
  closeMegaMenu() {
    document.body.classList.remove("megamenu-active");
    document.querySelector('.menu-list__list-item.megamenu.active')?.classList.remove("active");
  }
  activateItem(item){
    if (!item || item == this.#state.activeItem) return;
    this.deactivateActiveItem();
    item.classList.add('active');
    const content = this.querySelector(`.mega-menu__content[data-id="${item.dataset.id}"]`);
    content.classList.add('active');
    this.style.setProperty('--megamenu-content-height', content.scrollHeight + 'px');
    this.#state.activeItem = item;
  }
  deactivateActiveItem(){
    if (!this.#state.activeItem) return;
    this.#state.activeItem.classList.remove('active');
    this.querySelector(`.mega-menu__content[data-id="${this.#state.activeItem.dataset.id}"]`).classList.remove('active');
    this.#state.activeItem = null;
  }
}

if (!customElements.get('mega-menu')) {
  customElements.define('mega-menu', MegaMenu);
}