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
let uID;
const container = document.querySelector('.container');

function formatTimeAgo(datetimeStr) {
    const now = new Date();
    const date = new Date(datetimeStr); // handles ISO-like formats fine

    // 1. Format the datetime nicely
    const formattedDate = date.toISOString().slice(0, 19).replace('T', ' ');

    // 2. Calculate "time ago"
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    let timeAgo = '';
    if (diffSec < 60) {
        timeAgo = `${diffSec} second${diffSec !== 1 ? 's' : ''} ago`;
    } else if (diffMin < 60) {
        timeAgo = `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
    } else if (diffHr < 24) {
        timeAgo = `${diffHr} hour${diffHr !== 1 ? 's' : ''} ago`;
    } else {
        timeAgo = `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
    }

    return { formattedDate, timeAgo };
}

(async () => {
    try {
        const userRes = await fetch('/api/user');
        if (!userRes.ok) throw new Error('Not logged in');
        const userData = await userRes.json();
        username = userData.username;
        uID = userData.ID;

        const postsRes = await fetch('/api/posts');
        if (!postsRes.ok) throw new Error('Not logged in');
        const postsData = await postsRes.json();
        const posts = postsData.data;

        posts.forEach((post) => {
            const postCard = document.createElement('div');
            postCard.className = 'card post';
            const { formattedDate, timeAgo } = formatTimeAgo(post.date);
            postCard.innerHTML = `
              <div class="card-body">
                <h5 class="card-title">
                  ${post.users.username} <span class="date">${timeAgo}</span>
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
