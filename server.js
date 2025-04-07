import express from 'express';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import session from 'express-session';

// Initialize environment variables
dotenv.config();

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = dirname(fileURLToPath(import.meta.url));

// Middleware
app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({ extended: true }));

// Session middleware (MUST come after express.urlencoded)
app.use(
    session({
        secret: 'whydoihavetodoeverything', // Use an env variable in production
        resave: false,
        saveUninitialized: false,
    })
);

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

    req.session.user = { username }; // Store in session
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

    req.session.user = { username };
    res.redirect('/home');
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

app.get('/api/user', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not logged in' });
    }

    res.json({ username: req.session.user.username });
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
