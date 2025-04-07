import express from "express";
import {dirname} from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = 3000;
const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(express.static(__dirname + "/public"));
app.use(express.urlencoded({extended:true}));

app.get("/",(req,res)=>{
    res.redirect("/login");
});

app.get("/login",(req,res)=>{
    res.sendFile(__dirname + "/public/login.html");
});

app.listen(PORT,()=>{
    console.log(`Server started on PORT:${PORT}`);
});