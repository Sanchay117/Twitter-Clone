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

// const form = document.querySelector('form');
// form.addEventListener('submit', async (e) => {
//     e.preventDefault(); // Prevent normal form submission

//     const tweet = tweetInput.value;

//     try {
//         const res = await fetch('/create', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({
//                 tweet: tweet,
//                 // You can also include date or user data here if needed
//             }),
//         });

//         if (!res.ok) throw new Error('Failed to post tweet');

//         const data = await res.json(); // Parse the response JSON

//         // Optionally redirect or clear form
//         document.querySelector('h1').textContent = 'Tweet Posted Successfully';
//         console.log('Posted');
//         form.style.display = 'none';
//     } catch (err) {
//         console.error(err);
//         alert('Something went wrong');
//         window.href = '/home';
//     }
// });
