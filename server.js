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

    const ID = data.uid;
    req.session.user = { username, ID }; // Store in session
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

app.get('/post/:id', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');
    }

    const postId = req.params.id;

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

    // console.log(data);
    // console.log(data2);

    res.render('post', { post: data, timeAgo: date.timeAgo, comments: data2 }); // assuming you're using EJS/Pug/etc.
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

    console.log(friendUsers);
    res.render('friends', { friends: friendUsers });
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

// Logout route
app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Error logging out');
        }
        res.redirect('/login');
    });
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
