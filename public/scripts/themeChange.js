const themeToggle = document.querySelector('.theme');

themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-bs-theme');
    document.documentElement.setAttribute(
        'data-bs-theme',
        currentTheme === 'light' ? 'dark' : 'light'
    );
    if (currentTheme === 'light') {
        themeToggle.innerHTML = '<i class="fa-solid fa-moon moon-icon"></i>';
    } else themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
});
