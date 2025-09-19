export class Router {
    constructor() {
        this.tabs = document.querySelectorAll('[role="tab"]');
        this.cards = document.querySelectorAll('[role="tabpanel"]');
        this.init();
    }

    init() {
        this.addEventListeners();
        // Handle initial page load
        const initialTabId = window.location.hash ? window.location.hash.substring(1) : 'tab-eqpace';
        const initialTab = document.getElementById(initialTabId);
        if (initialTab) {
            this.switchTab(initialTab);
        }
    }

    addEventListeners() {
        this.tabs.forEach(tab => {
            tab.addEventListener('click', () => this.handleTabClick(tab));
        });

        window.addEventListener('popstate', () => {
            const tabId = window.location.hash ? window.location.hash.substring(1) : 'tab-eqpace';
            const targetTab = document.getElementById(tabId);
            if (targetTab) {
                this.switchTab(targetTab, false); // Don't push state on popstate
            }
        });
    }

    handleTabClick(tab, pushState = true) {
        if (tab.getAttribute('aria-selected') === 'true') return; // Do nothing if already selected
        this.switchTab(tab, pushState);
    }

    switchTab(tab, pushState = true) {
        const targetCardId = tab.getAttribute('aria-controls');
        const targetCard = document.getElementById(targetCardId);
        const currentTab = document.querySelector('[role="tab"][aria-selected="true"]');
        const currentCard = document.querySelector('.card.active');

        if (!targetCard || currentCard === targetCard) return;

        // Update URL and history
        if (pushState) {
            history.pushState({ tabId: tab.id }, ``, `#${tab.id}`);
        }

        // Update tab states
        this.tabs.forEach(t => t.setAttribute('aria-selected', 'false'));
        tab.setAttribute('aria-selected', 'true');

        // --- Animation Logic ---
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        let direction = 'forward';
        if (currentTab) {
            const currentIndex = Array.from(this.tabs).indexOf(currentTab);
            const targetIndex = Array.from(this.tabs).indexOf(tab);
            if (targetIndex < currentIndex) {
                direction = 'back';
            }
        }

        if (prefersReducedMotion || !currentCard) {
            // No animation
            if(currentCard) currentCard.classList.remove('active');
            targetCard.classList.add('active');
        } else {
            // With animation
            currentCard.classList.add(direction);
            targetCard.classList.add(direction);

            currentCard.addEventListener('transitionend', () => {
                currentCard.classList.remove('active', 'page-leave-active', 'forward', 'back');
            }, { once: true });

            requestAnimationFrame(() => {
                currentCard.classList.add('page-leave-active');
                targetCard.classList.add('active', 'page-enter-active');
            });
        }

        // Focus on the new card's title for accessibility
        const title = targetCard.querySelector('h1');
        if (title) {
            title.setAttribute('tabindex', -1);
            title.focus();
        }
    }
}
