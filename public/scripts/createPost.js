const tweetBox = document.getElementById('tweet');
const charCount = document.getElementById('charCount');

tweetBox.addEventListener('input', () => {
    charCount.textContent = `${tweetBox.value.length} / 250`;
});

let username, uID;

(async () => {
    try {
        const userRes = await fetch('/api/user');
        if (!userRes.ok) throw new Error('Not logged in');
        const userData = await userRes.json();
        username = userData.username;
        uID = userData.ID;
    } catch (err) {
        console.log(err);
        window.location.href = '/login'; // Redirect if any fetch fails
    }
})();
