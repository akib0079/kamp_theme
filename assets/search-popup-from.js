import { Component } from '@theme/component';
import { debounce, onDocumentLoaded } from '@theme/utilities';
import {
  ThemeEvents,
  CartUpdateEvent,
  CartAddEvent,
} from '@theme/events';

class SearchPopupFom extends Component {
    #abortController = null;
    #predictiveAbortController = null;
    connectedCallback() {
        super.connectedCallback();
        this.#init();
    }
    #init(){
        this.initSearchForm();
        this.initProdSlider();
    }
    initSearchForm(){
        this.querySelectorAll('.kw-search-form').forEach(ele => {
            ['click', 'focus'].forEach(eventType => {
                ele.querySelector('.search-form-field').addEventListener(eventType, e => {
                    e.preventDefault();
                    document.body.classList.add('search-active');
                })
            });
            ele.querySelector('.search-form-field').addEventListener('keyup', e => {
                const value = ele.querySelector('.search-form-field').value;
                this.updateSearchContent(value);
            })
        })
        const value = this.querySelector('.search-form-field').value;
        if(value){
            this.updateSearchContent(value);
        }
        this.querySelectorAll('.kw-search_close,.search-popup-from__bg').forEach(ele => {
            ele.addEventListener('click', e => {
                e.preventDefault();
                document.body.classList.remove('search-active');
            })
        })
    }
    async updateSearchContent(terms = null){
        this.querySelector('.search-container').classList.add('ajax-loading');
        this.updateSuggestions(terms)
        const html = await this.fetchSearch(terms);
        this.querySelector('.search-container').innerHTML = html.innerHTML;
        this.initProdSlider();
        this.querySelector('.search-container').classList.remove('ajax-loading');
    }
    async updateSuggestions(terms = null){
        this.querySelector('.search-popup__sugg-container').classList.add('ajax-loading');
        const ul = this.querySelector('.search-popup__sugg-list');
        if(terms){
            const sugg = await this.fetchPredictiveSearch(terms);
            const template = this.querySelector('#search-popup__sugg-list-template')
            const wrapper = document.createElement('div');
            wrapper.innerHTML = template.innerHTML;
            const item = wrapper.querySelector('li');
            const result = [...sugg.resources.results.collections, ...sugg.resources.results.queries];
            this.querySelector('.search-popup__sugg-row').classList.toggle('active', result.length)

            const suggLink = this.querySelector('.search-popup__sugg-link');
            if(suggLink){
                const url = new URL(suggLink.href);
                url.searchParams.set('q', terms);
                suggLink.href = url.toString();
                suggLink.querySelector('.terms').innerText = terms;
            }

            ul.innerHTML = '';
            result.forEach(collection => {
                item.querySelector('a').dataset.keyword = collection.title;
                const url = new URL(item.querySelector('a').href);
                url.searchParams.set('q', collection.title);
                item.querySelector('a').href = url.toString();
                // item.querySelector('a').href = (new URL(item.querySelector('a').href)).set('q', collection.title);
                item.querySelector('span').innerHTML = collection.title;
                ul.append(item.cloneNode(true))
            });
        } else {
            ul.innerHTML = '';
            this.querySelector('.search-popup__sugg-row').classList.remove('active')
        }
        // this.querySelector('.search-popup__sugg-container').innerHTML = html.innerHTML;
        this.querySelector('.search-popup__sugg-container').classList.remove('ajax-loading');
    }
    fetchSearch(terms = null){
        if (this.#abortController) {
            this.#abortController.abort();
        }
        this.#abortController = new AbortController();
        const signal = this.#abortController.signal;
        const url = Theme.routes.search_url + '?type=product&view=ajax' + (terms == null ? '' : '&q='+ terms );
        
        return fetch(url, {signal}).
        then((response) => {
            if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.text();
        }).
        then((response) => {
            const parser = document.createElement('div');
            parser.innerHTML = response;
            const ajaxContainer = parser.querySelector('[data-ajax-container="search"]');
            return ajaxContainer;
        });
    }
    fetchPredictiveSearch(terms = null){
        if (this.#predictiveAbortController) {
            this.#predictiveAbortController.abort();
        }
        this.#predictiveAbortController = new AbortController();
        const signal = this.#predictiveAbortController.signal;
        const url = Theme.routes.search_url + '/suggest.json?' + (terms == null ? '' : 'q='+ terms + '&resources[type]=collection,query&resources[options][fields]=title&resources[limit]=3' );
        
        return fetch(url, {signal}).
        then((response) => {
            if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
    }
    initProdSlider(){
        new Swiper(this.querySelector('.search-popup__prod-swiper'),{
            slidesPerView: 'auto',
            freeMode: {
                enabled: true,
                sticky: true,
                momentumRatio: 0.8,
            },
        })
        
    }
}
if (!customElements.get('search-popup-from')) {
  customElements.define('search-popup-from', SearchPopupFom);
}