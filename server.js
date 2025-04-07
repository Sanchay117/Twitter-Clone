import express from "express";
import {dirname} from "path";
import { fileURLToPath } from "url";
import { createClient } from '@supabase/supabase-js'
import dotenv from "dotenv";

dotenv.config();

// Create a single supabase client for interacting with your database
const supabase = createClient(process.env.DB_URL, process.env.API_KEY);

const app = express();
const PORT = process.env.PORT;
const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(express.static(__dirname + "/public"));
app.use(express.urlencoded({extended:true}));

app.get("/",(req,res)=>{
    res.redirect("/login");
});

app.get("/home",(req,res)=>{
    res.sendFile(__dirname + "/public/home.html");
});

app.get("/login",(req,res)=>{
    res.sendFile(__dirname + "/public/login.html");
});

app.get("/signup",(req,res)=>{
    res.sendFile(__dirname + "/public/signUp.html");
});

app.post("/login", async (req, res) => {
    const { username, password } = req.body;
  
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .single();
  
    if (error || !data || data.password !== password) {
      return res.send("Invalid credentials");
    }
  
    // Store username in session or pass via query param
    res.redirect(`/home?username=${username}`);
});

app.post("/signup", async (req, res) => {
    const { username, email, password } = req.body;
  
    // 1. Check if user already exists
    const { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .or(`username.eq.${username},email.eq.${email}`)
      .maybeSingle();
  
    if (fetchError) {
      console.error(fetchError);
      return res.status(500).send("Database error while checking for existing user.");
    }
  
    if (existingUser) {
      return res.status(400).send("User with this username or email already exists.");
    }
  
    // 2. Insert new user
    const { error: insertError } = await supabase
      .from("users")
      .insert([{ username, email, password }]);
  
    if (insertError) {
      console.error(insertError);
      return res.status(500).send("Error inserting user.");
    }
  
    res.redirect(`/home?username=${username}`);
});  

app.listen(PORT,()=>{
    console.log(`Server started on PORT:${PORT}`);
});