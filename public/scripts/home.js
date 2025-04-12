let username;
let uID;
const feed = document.querySelector('.feed');

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

            postDiv.innerHTML = `
            <div class="tweet-author">@${post.users.username} <span class="tweet-time">· ${post.date2}</span></div>
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
