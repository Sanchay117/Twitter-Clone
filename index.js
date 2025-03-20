const toggleBtn = document.getElementsByClassName('theme')[0];
toggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-bs-theme');
    document.documentElement.setAttribute('data-bs-theme', currentTheme === 'light' ? 'dark' : 'light');
});