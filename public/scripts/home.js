document.querySelectorAll('.tweet').forEach((el) => {
    el.addEventListener('click', () => {
        window.location.href = `/post/${el.id}`;
    });
});
