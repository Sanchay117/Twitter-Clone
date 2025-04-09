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
    const root = document.documentElement;

    const darkBlack = getComputedStyle(root).getPropertyValue('--dark-black');
    const darkWhite = getComputedStyle(root).getPropertyValue('--dark-white');

    // Swap them
    root.style.setProperty('--dark-black', darkWhite.trim());
    root.style.setProperty('--dark-white', darkBlack.trim());
});
