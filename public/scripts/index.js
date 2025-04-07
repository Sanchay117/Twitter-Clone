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

let username;
const container = document.querySelector('.container');

(async () => {
    try {
        const userRes = await fetch('/api/user');
        if (!userRes.ok) throw new Error('Not logged in');
        const userData = await userRes.json();
        username = userData.username;

        const postsRes = await fetch('/api/posts');
        if (!postsRes.ok) throw new Error('Not logged in');
        const postsData = await postsRes.json();
        const posts = postsData.data;

        posts.forEach((post) => {
            const postCard = document.createElement('div');
            postCard.className = 'card post';

            postCard.innerHTML = `
              <div class="card-body">
                <h5 class="card-title">
                  ${post.users.username} <span class="date">${post.date}</span>
                </h5>
                <p class="card-text">
                  ${post.content}
                </p>
                <div class="info">
                  <span> ${post.likes} <i class="fa-solid fa-heart"></i> </span>
                  <span>${post.views} <i class="fa-solid fa-eye"></i></span>
                  <span>${post.shares} <i class="fa-solid fa-share"></i></span>
                </div>
              </div>
            `;

            container.appendChild(postCard);
        });
    } catch (err) {
        console.log(err);
        window.location.href = '/login'; // Redirect if any fetch fails
    }
})();
