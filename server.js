import express from 'express';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import session from 'express-session';
import path from 'path';

// Initialize environment variables
dotenv.config();

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = dirname(fileURLToPath(import.meta.url));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session middleware (MUST come after express.urlencoded)
app.use(
    session({
        secret: 'whydoihavetodoeverything', // Use an env variable in production
        resave: false,
        saveUninitialized: false,
    })
);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Supabase client
const supabase = createClient(process.env.DB_URL, process.env.API_KEY);

// Routes

app.get('/', (req, res) => {
    res.redirect('/login');
});

app.get('/home', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.sendFile(__dirname + '/public/home.html');
});

app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/public/login.html');
});

app.get('/signup', (req, res) => {
    res.sendFile(__dirname + '/public/signUp.html');
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

    if (error || !data || data.password !== password) {
        return res.send('Invalid credentials');
    }

    // console.log(data);

    // Check if the user is banned
    const { data: bannedUser, error: bannedError } = await supabase
        .from('banned')
        .select('*')
        .eq('uid', data.uid)
        .single();

    if (bannedError) {
        if (bannedError.code === 'PGRST116') {
            // Not banned – no row found
        } else {
            console.error('Error checking banned status:', bannedError);
            return res.status(500).send('Internal server error');
        }
    }

    if (bannedUser) {
        return res
            .status(403)
            .send(`You are banned. Reason: ${bannedUser.reason}`);
    }

    const ID = data.uid;
    const bio = data.bio;
    req.session.user = { username, ID, bio }; // Store in session
    res.redirect('/home');
});

app.post('/signup', async (req, res) => {
    const { username, email, password, dob } = req.body;

    if (!dob) return res.status(400).send('Date of birth is required.');

    // Check if user already exists
    const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .or(`username.eq.${username},email.eq.${email}`)
        .maybeSingle();

    if (fetchError) {
        console.error(fetchError);
        return res
            .status(500)
            .send('Database error while checking for existing user.');
    }

    if (existingUser) {
        return res
            .status(400)
            .send('User with this username or email already exists.');
    }

    // Insert new user
    const { error: insertError } = await supabase
        .from('users')
        .insert([{ username, email, password, dob }]);

    if (insertError) {
        console.error(insertError);
        return res.status(500).send('Error inserting user.');
    }

    res.redirect('/login');
});

app.get('/admin/login', (req, res) => {
    res.render('adminLogin.ejs');
});

// Admin login
app.post('/admin/login', async (req, res) => {
    const { password } = req.body;

    if (!password) {
        return res.status(400).send('Admin password required.');
    }

    const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('password', password)
        .single();

    if (error || !data || data.password !== password) {
        return res.status(401).send('Invalid admin credentials.');
    }

    req.session.admin = { AID: data.aid };
    res.redirect('/admin');
});

app.get('/admin/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).send('Error logging out');
        }
        res.redirect('/admin/login'); // or your main login page
    });
});

app.get('/admin', async (req, res) => {
    if (!req.session.admin) {
        return res.redirect('/admin/login');
    }

    const { data: bannedUsers, error } = await supabase
        .from('banned')
        .select('uid, reason, date');

    if (error) {
        console.error(error);
        return res.status(500).send('Could not fetch banned users');
    }

    const { data: removedPosts, error: removedPostError } = await supabase.from(
        'removed_posts'
    ).select(`
        *,
        posts (
            content,
            uid
        )
    `);

    // console.log(removedPosts);

    if (removedPostError) {
        console.log(removedPostError);
        return res.status(500).send('Could not fetch removed posts');
    }

    res.render('admin', {
        bannedUsers: bannedUsers || [],
        removedPosts: removedPosts || [],
    });
});

// keerat's and ryan's code below
// being used
app.post('/admin/remove-post/:pid', async (req, res) => {
    if (!req.session.admin) {
        return res.redirect('/admin/login');
    }
    const pid = req.params.pid;
    const aid = req.session.admin.AID;
    const reason = req.body.reason;

    const { data, error } = await supabase
        .from('removed_posts')
        .insert({ pid, aid, reason });

    const { error2 } = await supabase.from('reports').delete().eq('pid', pid);

    if (error2) {
        console.error('Error deleting report:', error.message);
        return res.status(500).send('Could not remove post');
    }

    if (error) {
        console.error(error);
        return res.status(500).send('Could not remove post');
    }

    res.redirect('/admin/reports');
});

app.post('/admin/ban-user/:uid', async (req, res) => {
    if (!req.session.admin) {
        return res.redirect('/admin/login');
    }
    const uid = req.params.uid;
    const aid = req.session.admin.AID;
    const reason = req.body.reason;

    await supabase
        .from('banned')
        .insert([{ uid, reason, aid, date: new Date() }]);
    res.redirect('/admin');
});

// being used
app.post('/admin/unban-user/:uid', async (req, res) => {
    if (!req.session.admin || !req.session.admin.AID) {
        return res.status(401).send('Unauthorized');
    }
    const uid = req.params.uid;
    await supabase.from('banned').delete().eq('uid', uid);
    res.redirect('/admin');
});

// View all reports (Admin only) -> being used
app.get('/admin/reports', async (req, res) => {
    if (!req.session.admin) {
        return res.redirect('/admin/login');
    }

    const { data, error } = await supabase
        .from('reports')
        .select(
            `
            uid,
            pid,
            reason,
            date,
            users:uid (
                username
            ),
            posts:pid (
                content
            )
        `
        )
        .order('date', { ascending: false });

    if (error) {
        console.error('Error fetching reports:', error.message);
        return res.status(500).send('Failed to load reports');
    }

    for (const report of data) {
        const { data: authorData, error: idErr } = await supabase
            .from('posts')
            .select(
                `
                uid,
                users:uid(username)
            `
            )
            .eq('pid', report.pid)
            .single();

        if (idErr || !authorData) {
            console.error('Error fetching author data:', idErr?.message);
            return res.status(404).send('Error fetching author data...');
        }

        const { data: removeData, error: removeError } = await supabase
            .from('removed_posts')
            .select('*')
            .eq('pid', report.pid)
            .single();

        if (removeError && removeError.code !== 'PGRST116') {
            console.error(
                'Supabase error while checking removed_posts:',
                removeError.message
            );
            return res.status(500).send('An error occured');
        } else if (removeData) {
            // Found a matching removed post
            report.isRemoved = true;
        } else {
            // Not found (removeData is null or undefined)
            report.isRemoved = false;
        }

        report.authorID = authorData.uid;
        report.authorUsername = authorData.users.username;

        const { data: bannedData, error: bannedError } = await supabase
            .from('banned')
            .select('*')
            .eq('uid', report.authorID)
            .single();

        if (bannedError && bannedError.code !== 'PGRST116') {
            console.error(
                'Supabase error while checking removed_posts:',
                bannedError.message
            );
            return res.status(500).send('An error occured');
        } else if (bannedData) {
            // Found a matching removed post
            report.isBanned = true;
        } else {
            // Not found (bannedData is null or undefined)
            report.isBanned = false;
        }
    }

    // console.log(data);

    res.render('reports', { reports: data });
});

app.get('/admin/banned-users', async (req, res) => {
    if (!req.session.admin) {
        return res.status(403).send('Access denied. Admins only.');
    }

    const { data, error } = await supabase
        .from('banned')
        .select(
            `
            uid,
            aid,
            reason,
            date,
            users:uid (
                username
            ),
            admins:aid (
                aid
            )
        `
        )
        .order('date', { ascending: false });

    if (error) {
        console.error('Error fetching banned users:', error.message);
        return res.status(500).send('Failed to load banned users');
    }

    res.render('bannedUsers', { banned: data });
});

app.get('/admin/removed-posts', async (req, res) => {
    if (!req.session.admin) {
        return res.status(403).send('Access denied. Admins only.');
    }

    const { data, error } = await supabase
        .from('removed_posts')
        .select(
            `
            pid,
            aid,
            reason,
            date,
            posts:pid (
                content,
                uid
            ),
            admins:aid (
                aid
            ),
            users:posts.uid (
                username
            )
        `
        )
        .order('date', { ascending: false });

    if (error) {
        console.error('Error fetching removed posts:', error.message);
        return res.status(500).send('Failed to load removed posts');
    }

    res.render('removedPosts', { posts: data });
});

app.post('/create', async (req, res) => {
    const uID = req.session.user.ID;
    const { tweet } = req.body;

    if (!tweet || tweet.length > 250) {
        return res
            .status(400)
            .json({ error: 'Tweet must be 250 characters or less' });
    }

    const { error } = await supabase.from('posts').insert([
        {
            uid: uID,
            content: tweet,
            views: 1,
        },
    ]);

    if (error) {
        console.error(error);
        return res.status(500).json({ error: 'Failed to create post' });
    }

    res.redirect('/home');
});

// Ban a user
app.post('/ban/:uid', async (req, res) => {
    if (!req.session.admin || !req.session.admin.AID) {
        return res.status(401).send('Unauthorized');
    }

    const uid = req.params.uid;
    const { reason } = req.body;
    const aid = req.session.admin.AID;

    if (!reason || reason.trim() === '') {
        return res.status(400).send('Reason for banning is required.');
    }

    // Check if the user exists
    const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('uid', uid)
        .single();

    if (userError || !user) {
        return res.status(404).send('User not found.');
    }

    // Insert into the Banned table
    const { error: banError } = await supabase
        .from('banned')
        .insert([{ uid, aid, reason }]);

    if (banError) {
        console.error('Error banning user:', banError);
        return res.status(500).send('Failed to ban user.');
    }

    res.send('User has been banned successfully.');
});

// Remove a post
app.post('/remove-post/:pid', async (req, res) => {
    if (!req.session.admin || !req.session.admin.AID) {
        return res.status(401).send('Unauthorized');
    }

    const pid = req.params.pid;
    const { reason } = req.body;
    const aid = req.session.admin.AID;

    if (!reason || reason.trim() === '') {
        return res
            .status(400)
            .send('Reason for removing the post is required.');
    }

    // Check if the post exists
    const { data: post, error: postError } = await supabase
        .from('posts')
        .select('*')
        .eq('pid', pid)
        .single();

    if (postError || !post) {
        return res.status(404).send('Post not found.');
    }

    // Insert into the Removed_Posts table
    const { error: removeError } = await supabase
        .from('removed_posts')
        .insert([{ pid, aid, reason }]);

    if (removeError) {
        console.error('Error removing post:', removeError);
        return res.status(500).send('Failed to remove post.');
    }

    // Delete the post from the Posts table
    const { error: deleteError } = await supabase
        .from('posts')
        .delete()
        .eq('pid', pid);

    if (deleteError) {
        console.error('Error deleting post:', deleteError);
        return res.status(500).send('Failed to delete post.');
    }

    res.send('Post has been removed successfully.');
});

// Unremove a post -> being used
app.post('/unremove-post/:pid', async (req, res) => {
    if (!req.session.admin || !req.session.admin.AID) {
        return res.status(401).send('Unauthorized');
    }

    const pid = req.params.pid;

    // Check if the post is in the Removed_Posts table
    const { data: removedPost, error: removedPostError } = await supabase
        .from('removed_posts')
        .select(
            `*,
        posts (
            content,
            uid
        )`
        )
        .eq('pid', pid)
        .single();

    if (removedPostError || !removedPost) {
        return res.status(404).send('Post is not in the removed posts list.');
    }

    // Remove the post from the Removed_Posts table
    const { error: deleteRemovedError } = await supabase
        .from('removed_posts')
        .delete()
        .eq('pid', pid);

    if (deleteRemovedError) {
        console.error(
            'Error deleting removed post record:',
            deleteRemovedError
        );
        return res.status(500).send('Failed to delete removed post record.');
    }

    res.redirect('/admin');
});

// _________                    .__                     __  .__                                           __
// /   _____/____    ____   ____ |  |__ _____  ___.__. _/  |_|  |__   ____      ___________   ____ _____ _/  |_
// \_____  \\__  \  /    \_/ ___\|  |  \\__  \<   |  | \   __\  |  \_/ __ \    / ___\_  __ \_/ __ \\__  \\   __\
// /        \/ __ \|   |  \  \___|   Y  \/ __ \\___  |  |  | |   Y  \  ___/   / /_/  >  | \/\  ___/ / __ \|  |
// /_______  (____  /___|  /\___  >___|  (____  / ____|  |__| |___|  /\___  >  \___  /|__|    \___  >____  /__|
//        \/     \/     \/     \/     \/     \/\/                 \/     \/  /_____/             \/     \/
// sanchays code below

app.get('/post/:id', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');
    }

    const postId = req.params.id;
    const uid = req.session.user.ID;

    // selecting post
    let { data, error } = await supabase
        .from('posts')
        .select(
            `
        *,
        users:uid (
          username
        )
        `
        )
        .eq('pid', postId);

    // comments
    const { data: data2, error: error2 } = await supabase
        .from('comments')
        .select(
            `
          *,
          users:uid (
            username
          )
        `
        )
        .eq('pid', postId);

    if (error || !data) {
        return res.status(404).send('Post not found');
    }

    if (error2) {
        return res.status(404).send(error2);
    }

    data = data[0];
    const date = formatTimeAgo(data.date);
    data2.forEach((el) => {
        el.date = formatTimeAgo(el.date).timeAgo;
    });

    // console.log(data, postId);
    // console.log(data2);

    //incrementing views by 1
    const { updateError } = await supabase
        .from('posts')
        .update({ views: 1 + data.views })
        .eq('pid', postId);

    if (updateError) {
        console.error('Supabase update error:', updateError);
        return res
            .status(500)
            .send({ message: 'Update failed', error: updateError });
    }

    // console.log(data);

    // post already liked or nah
    const { data: likeData, error: likeERR } = await supabase
        .from('likes')
        .select('*')
        .eq('uid', uid)
        .eq('pid', postId);
    if (likeERR) {
        console.error('Supabase Like error:', likeERR);
        return res
            .status(500)
            .send({ message: 'Like check failed', error: likeERR });
    }

    let likedByCurrentUser = false;
    if (likeData.length > 0) likedByCurrentUser = true;

    // friend already liked or nah
    const { data: friendData, error: friendERR } = await supabase
        .from('friends')
        .select('*')
        .or(
            `and(uid1.eq.${uid},uid2.eq.${data.uid}),and(uid1.eq.${data.uid},uid2.eq.${uid})`
        );

    if (friendERR) {
        console.error('Supabase friend error:', friendERR);
        return res
            .status(500)
            .send({ message: 'friend check failed', error: friendERR });
    }

    let isFriend = false;
    if (friendData.length > 0) isFriend = true;

    // following already liked or nah
    const { data: followData, error: followERR } = await supabase
        .from('follows')
        .select('*')
        .or(
            `and(uid1.eq.${uid},uid2.eq.${data.uid}),and(uid1.eq.${data.uid},uid2.eq.${uid})`
        );

    if (followERR) {
        console.error('Supabase follow error:', followERR);
        return res
            .status(500)
            .send({ message: 'follow check failed', error: followERR });
    }

    let isFollowing = false;
    if (followData.length > 0) isFollowing = true;

    // reported already liked or nah
    const { data: reportData, error: reportERR } = await supabase
        .from('reports')
        .select('*')
        .eq('uid', req.session.user.ID)
        .eq('pid', postId);

    if (reportERR) {
        console.error('Supabase report error:', reportERR);
        return res
            .status(500)
            .send({ message: 'follow report failed', error: reportERR });
    }

    let isReported = false;
    if (reportData.length > 0) isReported = true;

    res.render('post', {
        post: data,
        timeAgo: date.timeAgo,
        comments: data2,
        likedByCurrentUser,
        isFriend,
        isFollowing,
        isReported,
        uid: req.session.user.ID,
    }); // assuming you're using EJS/Pug/etc.
});

app.post('/like/:pid', async (req, res) => {
    if (!req.session.user || !req.session.user.ID) {
        return res.redirect('/');
    }

    const pid = req.params.pid;
    const uid = req.session.user.ID;

    const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('pid', pid);
    if (error || !data) {
        return res.status(404).send('Post not found');
    }

    const { updateError } = await supabase
        .from('posts')
        .update({ likes: 1 + data[0].likes })
        .eq('pid', pid);

    if (updateError) {
        console.error('Supabase update error:', updateError);
        return res
            .status(500)
            .send({ message: 'Update failed', error: updateError });
    }

    const { likeError } = await supabase.from('likes').insert({ uid, pid });

    if (likeError) {
        console.error('Supabase Like error:', updateError);
        return res
            .status(500)
            .send({ message: 'Like failed', error: updateError });
    }

    if (uid !== data[0].uid) {
        const { error } = await supabase.from('notification').insert({
            uid: data[0].uid,
            sid: uid,
            type: 'Like',
            pid: data[0].pid,
            content: `${req.session.user.username} Liked your post.`,
            isread: false,
        });
        if (error) {
            console.error('Supabase Like error:', error);
            return res
                .status(500)
                .send({ message: 'Like failed', error: error });
        }
    }

    return res.redirect(`/post/${pid}`);
});

app.post('/add-friend/:uid', async (req, res) => {
    if (!req.session.user || !req.session.user.ID) {
        return res.redirect('/');
    }

    const uid2 = req.params.uid;
    const uid1 = req.session.user.ID;

    const { friendError } = await supabase
        .from('friends')
        .insert({ uid1, uid2 });

    if (friendError) {
        console.error('Supabase Friend error:', friendError);
        return res
            .status(500)
            .send({ message: 'Friend failed', error: friendError });
    }

    return res.redirect(`/profile/${uid2}`);
});

app.post('/report/:pid', async (req, res) => {
    if (!req.session.user || !req.session.user.ID) {
        return res.redirect('/');
    }

    const pid = req.params.pid;
    const uid = req.session.user.ID;
    const reason = req.body.reason;

    const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('pid', pid);
    if (error || !data) {
        return res.status(404).send('Post not found');
    }

    const { reportError } = await supabase
        .from('reports')
        .insert({ uid, pid, reason });

    if (reportError) {
        console.error('Supabase Report error:', reportError);
        return res
            .status(500)
            .send({ message: 'report failed', error: reportError });
    }

    return res.redirect(`/post/${pid}`);
});

app.post('/post/:id', async (req, res) => {
    const { comment } = req.body;
    const postId = req.params.id;
    const userId = req.session.user.ID; // Assuming you're storing user info in session

    if (!userId) {
        return res.status(401).send('Unauthorized');
    }

    try {
        const { data, error } = await supabase.from('comments').insert([
            {
                pid: postId,
                uid: userId,
                content: comment,
            },
        ]);

        if (error) {
            console.error(error);
            return res.status(500).send('Error adding comment');
        }

        const { data: post, error: pError } = await supabase
            .from('posts')
            .select('*')
            .eq('pid', postId);

        if (!post || pError) {
            console.log(pError);
            return res.status(404).send('Post Not Found');
        }

        const { error2 } = await supabase.from('notification').insert({
            uid: post[0].uid,
            sid: userId,
            type: 'Comment',
            pid: post[0].pid,
            content: `${req.session.user.username} commented your post.`,
            isread: false,
        });
        if (error2) {
            console.error('Supabase comment error:', error2);
            return res
                .status(500)
                .send({ message: 'comment failed', error: error2 });
        }

        res.redirect(`/post/${postId}`); // Redirect back to the post page
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

app.get('/friends', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');
    }
    const userId = req.session.user.ID;
    if (!userId) return res.redirect('/login');

    // Fetch both UID1 and UID2 where user is involved
    const { data: friendsData, error: friendsError } = await supabase
        .from('friends')
        .select('uid1, uid2')
        .or(`uid1.eq.${userId},uid2.eq.${userId}`);

    if (friendsError) {
        console.error('Error fetching friends:', friendsError.message);
        return res.status(500).send('Error loading friends');
    }

    // Extract the friend IDs (exclude self)
    const friendIds = friendsData.map((f) =>
        f.uid1 === userId ? f.uid2 : f.uid1
    );

    // console.log(friendIds);

    // if (friendIds.length === 0) return res.render('friends', { friends: [] });

    const { data: friendUsers, error: usersError } = await supabase
        .from('users')
        .select('uid, username, bio')
        .in('uid', friendIds);

    // console.log(friendUsers);

    if (usersError) {
        console.error('Error fetching user details:', usersError.message);
        return res.status(500).send('Error loading friends info');
    }

    // console.log(friendUsers);
    res.render('friends', { friends: friendUsers });
});

app.get('/profile/:id', async (req, res) => {
    try {
        // 1. Check if user is logged in
        if (!req.session.user) {
            return res.redirect('/');
        }

        const currentUserId = req.session.user.ID;
        const profileUserId = req.params.id;

        if (!currentUserId) return res.redirect('/login');

        // 2. Fetch user profile
        const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('uid, username, bio, dob')
            .eq('uid', profileUserId)
            .single();

        if (profileError || !profile) {
            console.error('Profile fetch error:', profileError?.message);
            return res.status(404).send('User not found');
        }

        // 3. Check if current user follows this profile
        const { data: followData, error: followError } = await supabase
            .from('follows')
            .select('uid1')
            .eq('uid1', currentUserId)
            .eq('uid2', profileUserId);

        if (followError) {
            console.error('Follow fetch error:', followError?.message);
            return res.status(500).send('Error fetching follow status');
        }

        const isFollowing = followData && followData.length > 0;

        // 4. Get mutual friends
        const { data: currentUserFriends, error: friendsError } = await supabase
            .from('friends')
            .select('uid1, uid2')
            .or(`uid1.eq.${currentUserId},uid2.eq.${currentUserId}`);

        if (friendsError) {
            console.error('Friends fetch error:', friendsError?.message);
            return res.status(500).send('Error fetching friends');
        }

        const currentFriendIds = currentUserFriends.map((f) =>
            f.uid1 === currentUserId ? f.uid2 : f.uid1
        );

        const { data: profileUserFriends, error: profileFriendsError } =
            await supabase
                .from('friends')
                .select('uid1, uid2')
                .or(`uid1.eq.${profileUserId},uid2.eq.${profileUserId}`);

        if (profileFriendsError) {
            console.error(
                'Profile user friends fetch error:',
                profileFriendsError?.message
            );
            return res.status(500).send('Error fetching profile user friends');
        }

        const profileFriendIds = profileUserFriends.map((f) =>
            f.uid1 === profileUserId ? f.uid2 : f.uid1
        );

        const mutualIds = currentFriendIds.filter((id) =>
            profileFriendIds.includes(id)
        );

        const { data: mutualFriends, error: mutualFriendsError } =
            await supabase
                .from('users')
                .select('uid, username')
                .in('uid', mutualIds);

        if (mutualFriendsError) {
            console.error(
                'Mutual friends fetch error:',
                mutualFriendsError?.message
            );
            return res.status(500).send('Error fetching mutual friends');
        }

        // 5. Fetch recent posts
        const { data: recentPosts, error: postsError } = await supabase
            .from('posts')
            .select('content, date')
            .eq('uid', profileUserId)
            .order('date', { ascending: false })
            .limit(5);

        if (postsError) {
            console.error('Posts fetch error:', postsError?.message);
            return res.status(500).send('Error fetching posts');
        }

        // 6. Render the profile page
        res.render('profile', {
            profile,
            isFollowing,
            mutualFriends: mutualFriends || [],
            recentPosts: recentPosts || [],
        });
    } catch (err) {
        console.error('Unexpected error:', err);
        return res.status(500).send('An unexpected error occurred');
    }
});

app.post('/follow/:id', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');
    }
    const currentUserId = req.session.user.ID;
    if (!currentUserId) return res.redirect('/');
    const targetId = req.params.id;

    if (!currentUserId || currentUserId === targetId) {
        return res.redirect('/profile/' + targetId);
    }

    const { data: existing } = await supabase
        .from('follows')
        .select()
        .eq('uid1', currentUserId)
        .eq('uid2', targetId);

    if (existing && existing.length > 0) {
        // Unfollow
        await supabase
            .from('follows')
            .delete()
            .match({ uid1: currentUserId, uid2: targetId });
    } else {
        // Follow
        await supabase
            .from('follows')
            .insert([{ uid1: currentUserId, uid2: targetId }]);
    }

    const { error } = await supabase.from('notification').insert({
        uid: targetId,
        sid: currentUserId,
        type: 'Follow',
        content: `${req.session.user.username} started following you.`,
        isread: false,
    });
    if (error) {
        console.error('Supabase follow error:', error);
        return res.status(500).send({ message: 'follow failed', error: error });
    }

    res.redirect('/profile/' + targetId);
});

// GET /messages
app.get('/messages', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');
    }
    const currentUID = req.session.user.ID;
    if (!currentUID) return res.redirect('/login');

    // Step 1: Get all messages involving current user
    const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .or(`uid1.eq.${currentUID},uid2.eq.${currentUID}`);

    if (msgError) {
        console.error('Error fetching messages:', msgError.message);
        return res.status(500).send('Internal Server Error');
    }

    // Step 2: Extract unique conversation partner UIDs
    const otherUIDs = new Set();
    messages.forEach((msg) => {
        const other = msg.uid1 === currentUID ? msg.uid2 : msg.uid1;
        otherUIDs.add(other);
    });

    // if (otherUIDs.size === 0) return res.render('messages', { conversations: [] });

    // Step 3: Fetch user details for conversation partners
    const { data: users, error: userError } = await supabase
        .from('users')
        .select('uid, username, bio')
        .in('uid', [...otherUIDs]);

    if (userError) {
        console.error('Error fetching users:', userError.message);
        return res.status(500).send('Internal Server Error');
    }

    // Step 4: Get latest message for each conversation
    const latestMessages = {};
    messages.forEach((msg) => {
        const other = msg.uid1 === currentUID ? msg.uid2 : msg.uid1;
        if (
            !latestMessages[other] ||
            new Date(msg.Date) > new Date(latestMessages[other].Date)
        ) {
            latestMessages[other] = msg;
        }
    });

    const conversations = users.map((user) => ({
        uid: user.uid,
        username: user.username,
        full_name: user.bio,
        latest_message: latestMessages[user.uid]?.content || '',
    }));

    // console.log(conversations);

    res.render('messages', { messages: conversations });
});

app.get('/chat/:uid', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');
    }
    const currentUID = req.session.user.ID;
    if (!currentUID) return res.redirect('/login');
    const otherUID = req.params.uid;

    // Fetch user info of the other person
    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('uid, username, bio')
        .eq('uid', otherUID)
        .single();

    if (userError || !userData) {
        console.error(userError?.message);
        return res.status(404).send('User not found');
    }

    // Fetch messages between currentUID and otherUID
    const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .or(
            `and(uid1.eq.${currentUID},uid2.eq.${otherUID}),and(uid1.eq.${otherUID},uid2.eq.${currentUID})`
        )
        .order('date', { ascending: true });

    if (msgError) {
        console.error(msgError.message);
        return res.status(500).send('Error fetching messages');
    }

    res.render('chat', {
        messages,
        currentUID,
        otherUser: userData,
    });
});

app.post('/chat/:uid', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');
    }
    const currentUID = req.session.user.ID;
    if (!currentUID) return res.redirect('/');

    const otherUID = req.params.uid;
    const { content } = req.body;

    if (!content || content.trim() === '')
        return res.redirect(`/chat/${otherUID}`);

    const { error } = await supabase.from('messages').insert([
        {
            uid1: currentUID,
            uid2: otherUID,
            content: content,
            date: new Date().toISOString(),
        },
    ]);

    if (error) {
        console.error('Error sending message:', error.message);
        return res.status(500).send('Error sending message');
    }

    res.redirect(`/chat/${otherUID}`);
});

app.get('/notifications', async (req, res) => {
    if (!req.session.user) return res.redirect('/');

    const userId = req.session.user.ID;
    if (!userId) return res.redirect('/');

    const { data: notifData, error: notifError } = await supabase
        .from('notification')
        .select('nid, uid, sid, type, pid, content, isread, created_at')
        .eq('uid', userId)
        .order('created_at', { ascending: false });

    if (notifError) {
        console.error('Error fetching notifications:', notifError.message);
        return res.status(500).send('Could not load notifications');
    }

    // console.log(notifData);
    // Fetch sender names in one query
    const senderIds = [...new Set(notifData.map((n) => n.sid))];
    // console.log(senderIds);
    const { data: sendersData, error: sendersError } = await supabase
        .from('users')
        .select('uid, username')
        .in('uid', senderIds);

    if (sendersError) {
        console.error('Error fetching senders:', sendersError.message);
        return res.status(500).send('Could not load senders');
    }

    const senderMap = {};
    sendersData.forEach((u) => {
        senderMap[u.uid] = u.username;
    });

    // Attach sender username
    const enrichedNotifs = notifData.map((n) => ({
        nid: n.nid,
        uid: n.uid,
        sid: n.sid,
        sender_name: senderMap[n.sid] || 'Unknown',
        type: n.type,
        pid: n.pid,
        content: n.content,
        isread: n.isread,
        created_at: n.created_at,
    }));

    res.render('notifications', { notifications: enrichedNotifs });
});

// settings
app.get('/settings', async (req, res) => {
    if (!req.session.user || !req.session.user.ID) {
        return res.redirect('/login');
    }

    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('uid', req.session.user.ID);

    if (!data || error) {
        console.error(error);
        res.status(404).send('Error fetching user');
    }

    // console.log(data[0]);

    res.render('settings', {
        profile: data[0],
    });
});

// profile
app.get('/profile', async (req, res) => {
    if (!req.session.user || !req.session.user.ID) {
        return res.redirect('/login');
    }

    const currentUserId = req.session.user.ID; // current logged-in user's ID

    // 1. Fetch user profile (the current logged-in user)
    const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('uid, username, bio, dob')
        .eq('uid', currentUserId)
        .single();

    if (profileError || !profile) {
        console.error('Profile fetch error:', profileError?.message);
        return res.status(404).send('User not found');
    }

    // 2. Fetch the list of users the current user is following
    const { data: followingData, error: followingError } = await supabase
        .from('follows')
        .select('uid2') // Get the users the current user is following
        .eq('uid1', currentUserId);

    if (followingError) {
        console.error('Error fetching following data:', followingError.message);
        return res.status(500).send('Error fetching following data');
    }

    const followingIds = followingData.map((follow) => follow.uid2);

    // 3. Fetch the list of followers for the current logged-in user
    const { data: followersData, error: followersError } = await supabase
        .from('follows')
        .select('uid1') // Get the users who follow the current logged-in user
        .eq('uid2', currentUserId);

    if (followersError) {
        console.error('Error fetching followers data:', followersError.message);
        return res.status(500).send('Error fetching followers data');
    }

    const followersIds = followersData.map((follow) => follow.uid1);

    // 4. Fetch the username for the users the current user is following
    const { data: followingUsers, error: followingUsersError } = await supabase
        .from('users')
        .select('uid, username')
        .in('uid', followingIds);

    if (followingUsersError) {
        console.error(
            'Error fetching following users:',
            followingUsersError.message
        );
        return res.status(500).send('Error fetching following users');
    }

    // 5. Fetch the username for the users who are following the current user
    const { data: followersUsers, error: followersUsersError } = await supabase
        .from('users')
        .select('uid, username')
        .in('uid', followersIds);

    if (followersUsersError) {
        console.error(
            'Error fetching followers users:',
            followersUsersError.message
        );
        return res.status(500).send('Error fetching followers users');
    }

    // Render the profile page with the fetched data
    res.render('profile_self', {
        profile,
        following: followingUsers || [],
        followers: followersUsers || [],
    });
});

app.post('/update-bio/:uid', async (req, res) => {
    const uid = req.params.uid;
    const bio = req.body.bio;

    const { error } = await supabase
        .from('users')
        .update({ bio })
        .eq('uid', uid);

    if (error) {
        console.error(error);
        return res.status(404).send('Error updating bio');
    }

    res.redirect(`/settings`);
});

// API endpoints
app.get('/api/user', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not logged in' });
    }

    res.json({ username: req.session.user.username, ID: req.session.user.ID });
});

app.get('/api/posts', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not logged in' });
    }

    const { data, error } = await supabase.from('posts').select(`
    *,
    users:uid (
      username
    )
  	`);

    if (error) {
        return res.status(500).send('Error Joining Tables');
    } else {
        res.json({ data: data });
    }
});

app.use((req, res, next) => {
    res.redirect('/');
});

app.listen(PORT, () => {
    console.log(`Server started on PORT: ${PORT}`);
});

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
