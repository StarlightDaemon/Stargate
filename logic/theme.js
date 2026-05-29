class ThemeController {
    constructor() {
        this.container = document.querySelector('.sdc-fusion-container');
        this.current   = localStorage.getItem('sdc-theme') || 'terminal';
        this.apply(this.current, false);
    }

    apply(theme, save = true) {
        this.container.setAttribute('data-theme', theme);
        this.current = theme;
        if (save) localStorage.setItem('sdc-theme', theme);

        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === theme);
        });
    }

    bindButtons() {
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', () => this.apply(btn.dataset.theme));
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.themeController = new ThemeController();
    window.themeController.bindButtons();
});
