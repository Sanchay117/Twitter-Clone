import express from "express";
import {dirname} from "path";
import { fileURLToPath } from "url";
import { createClient } from '@supabase/supabase-js'
import dotenv from "dotenv";

dotenv.config();

// Create a single supabase client for interacting with your database
const supabase = createClient('https://xyzcompany.supabase.co', 'public-anon-key')

const app = express();
const PORT = process.env.PORT;
const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(express.static(__dirname + "/public"));
app.use(express.urlencoded({extended:true}));

app.get("/",(req,res)=>{
    res.redirect("/login");
});

app.get("/login",(req,res)=>{
    res.sendFile(__dirname + "/public/login.html");
});

app.post("/login", (req,res)=>{
    console.log(req.body);
    res.redirect("/");
});

app.listen(PORT,()=>{
    console.log(`Server started on PORT:${PORT}`);
});