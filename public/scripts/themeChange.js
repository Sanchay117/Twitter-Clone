let isDark = true;

const btn = document.getElementById('toggleTheme');

btn.addEventListener('click', () => {
    const root = document.documentElement.style;

    if (isDark) {
        // Light mode
        root.setProperty('--bg-color', '#f1f1f1');
        root.setProperty('--text-color', '#121212');
        root.setProperty('--tweet-bg', '#ffffff');
        root.setProperty('--tweet-hover', '#e6e6e6');
        root.setProperty('--border-color', '#ccc');
        root.setProperty('--timestamp-color', '#555');

        document.querySelectorAll('.text-light').forEach((el) => {
            el.classList.remove('text-light');
            el.classList.add('text-dark');
        });

        btn.classList.remove('btn-outline-light');
        btn.classList.add('btn-outline-dark');
    } else {
        // Dark mode
        root.setProperty('--bg-color', '#121212');
        root.setProperty('--text-color', '#f1f1f1');
        root.setProperty('--tweet-bg', '#1a1a1a');
        root.setProperty('--tweet-hover', '#1e1e1e');
        root.setProperty('--border-color', '#2c2c2c');
        root.setProperty('--timestamp-color', '#aaa');

        document.querySelectorAll('.text-dark').forEach((el) => {
            el.classList.remove('text-dark');
            el.classList.add('text-light');
        });

        btn.classList.remove('btn-outline-dark');
        btn.classList.add('btn-outline-light');
    }

    isDark = !isDark;
});
