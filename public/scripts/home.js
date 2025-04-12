let username;
let uID;
const feed = document.querySelector('.feed');

function formatTimeAgo(datetimeStr) {
    const now = new Date();

    // Fix datetime string by trimming to milliseconds (first 3 digits after dot)
    const safeStr = datetimeStr.replace(/\.(\d{3})\d*/, '.$1');

    const date = new Date(safeStr);
    if (isNaN(date)) {
        return {
            formattedDate: 'Invalid date',
            timeAgo: 'some time ago',
        };
    }

    // 1. Format: e.g., Apr 8, 2025 12:42
    const formattedDate = date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    // 2. Time ago
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
        if (!postsRes.ok) throw new Error('Failed to load posts');
        const postsData = await postsRes.json();
        const posts = postsData.data;

        posts.sort((a, b) => new Date(b.date) - new Date(a.date));

        posts.forEach((post) => {
            const postDiv = document.createElement('div');
            postDiv.className = 'tweet';
            const { timeAgo } = formatTimeAgo(post.date);

            postDiv.innerHTML = `
            <div class="tweet-author">@${post.users.username} <span class="tweet-time">· ${timeAgo}</span></div>
            <div class="word-wrap">${post.content}</div>
            <div class="info mt-2 d-flex gap-3 text-muted small">
              <span><i class="fa-solid fa-heart"></i>${post.likes}</span>
              <span><i class="fa-solid fa-eye"></i>${post.views}</span>
              <span><i class="fa-solid fa-share-nodes"></i>${post.shares}</span>
            </div>
          `;

            postDiv.addEventListener('click', () => {
                window.location.href = `/post/${post.pid}`;
            });

            feed.appendChild(postDiv);
        });
    } catch (err) {
        console.error(err);
        window.location.href = '/login';
    }
})();
