const express = require('express');
const app = express();
const mysql = require('mysql2');
const cors = require('cors');
const {body,validationResult, Result} = require('express-validator');

const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const session = require("express-session");

const bcrypt = require('bcrypt');
const secret = 10;


app.use(express.json());
const corsOptions ={
    origin:'http://localhost:3000', 
    credentials:true,            //access-control-allow-credentials:true
    optionSuccessStatus:200
}
app.use(cors(corsOptions));

app.use(cookieParser());
app.use(bodyParser.urlencoded({extended:true}));

app.use(session({
    key:"userID",
    secret:"subscribe",
    resave:false,
    saveUninitialized:false,
    cookie:{
        express: 60 * 60,
    }
}));

const db = mysql.createConnection({
    host:"172.30.64.1",
    user:"purin",
    password:"123456",
    database:"hafuboard",
    port: 3306,
});

db.on('error', function(err) {
    console.log("[mysql error]",err);
  });

// ----------------------------------------------------------
app.post('/register',(req,res) => {
    const username = req.body.username;
    const email = req.body.email;
    const pass = req.body.pass;

    db.query("SELECT email FROM users WHERE email = ?",email,(err,resalt) =>{
        if(err){
            console.log(err);
        } else if(resalt.length > 0) {
            res.send({message:"This email is already in use."});
        } else {
            bcrypt.hash(pass,secret,(err,hash) => {
                if(err){
                    console.log(err);
                }
                db.query("INSERT INTO users (name,email,password) VALUES(?,?,?)",
                [username,email,hash],
                (err,resalt) => {
                    if(err){
                        console.log(err);
                    } else {
                        res.send({completed:"Register Completed"});
                    }
                })
            });
        }
    })

});

app.get("/login",(req,res) => {
    if(req.session.user){
        res.send({ loggedIn: true, user: req.session.user });
    } else {
        res.send({ loggedIn: false})
    }
});

app.post('/login',(req,res) => {
    // Object.keys(result).length
    const email = req.body.email;
    const pass = req.body.pass;
    db.query("SELECT * FROM users WHERE email = ?;",email,(err,result) => {
        if(err){
            res.send({err:err});
        } else if(result.length > 0){
            bcrypt.compare(pass, result[0].password, (error, response) => {
                if(response){
                    req.session.user = result;
                    // console.log(req.session.user);
                    res.send(result);
                } else {
                    res.send({message:"Enter email and password again please"});
                }
            });
        } 
        else {
            res.send({message:"User don't exist"});
        }
    });
});

app.get('/logout', function(req,res){
    req.session.destroy();
    res.send({message:"Out"});
 });

// ------------------------------------------------------------
app.get('/topic',(req,res) => {
    db.query("SELECT * FROM topic",(err,result) => {
        if(err){
            console.log(err);
        }else{
            res.send(result);
        }
    });
});

app.get('/sel/:id',(req,res) => {
    const id = req.params.id;
    db.query("SELECT * FROM topic WHERE id = ?",id,(err,resalt) => {
        if(err){
            console.log(err);
        } else {
            res.send(resalt);
        }
    })
})

app.post('/create',(req,res) => {
    const topic = req.body.topic;
    const content = req.body.content;
    const user_id = req.body.user_id;
    const author_name = req.body.author_name;

    db.query("INSERT INTO topic (topic,content,user_id,author_name) VALUES(?,?,?,?)",
    [topic,content,user_id,author_name],
    (err,result) => {
        if(err){
            console.log(err);
        }else{
            res.send(result);
        }
    });
});

app.put('/update',(req,res) => {
    const id = req.body.id;
    const topic = req.body.topic;
    const content = req.body.content;

    db.query("UPDATE topic SET topic = ?,content=? WHERE id = ?",
    [topic,content,id],
    (err,resalt) => {
        if(err){
            console.log(err);
        }else{
            res.send({message: "Update Completed ! 😽"})
        }
    });
});

app.delete('/delete/:id',(req,res) => {
    const id = req.params.id;
    db.query("DELETE FROM topic WHERE id = ?",id,(err,resalt) => {
        if(err){
            console.log(err);
        }else{
            res.send(resalt);
        }
    });

});

app.post("/addComment",(req,res) => {
    const user_id = req.body.user_id;
    const user_name = req.body.user_name;
    const comment = req.body.comment;
    const topic_id = req.body.topic_id;

    db.query("INSERT INTO comments (user_id,user_name,comment,topic_id) VALUES (?,?,?,?)",
    [user_id,user_name,comment,topic_id],
    (err,resalt) => {
        if(err){
            console.log(err);
        }else{
            res.send("Add Comment Comple");
        }
    })
})

app.get("/comment/:id",(req,res) => {
    const id = req.params.id;
    db.query("SELECT * FROM comments WHERE topic_id = ?",id,(err,resalt) => {
        if(err){
            console.log(err);
        } else {
            res.send(resalt);
        }
    })
})

app.delete("/delComment/:id",(req,res) => {
    const id = req.params.id;
    db.query("DELETE FROM comments WHERE comment_id = ?",id,(err,result) => {
        if(err){
            res.send({err: "Delete failed !"});
        } else {
            res.send({message: "Delete data complete"});
        }
    })
})

app.put("/updateComment",(req,res)=>{
    const id = req.body.id;
    const newcomment = req.body.newcomment;
    db.query("UPDATE comments SET comment = ? WHERE comment_id = ?",[newcomment,id],
    (err,resalt)=>{
        if(err){
            res.send({err: "Update failed !"});
        } else {
            res.send({message: "Update data complete"});
        }
    })
}) 

app.get("/editTopic/:id",(req,res) =>{
    const id = req.params.id;
    db.query("SELECT * FROM topic WHERE id = ?",id,(err,resalt) => {
        if(err){
            console.log(err);
        } else {
            res.send(resalt);
        }
    })
})

app.get("/userlist",(req,res) => {
    db.query("SELECT * FROM users",(err,result) =>{
        if(err){
            console.log(err);
        } else {
            res.send(result);
        }
    })
})

app.get("/search/:name",(req,res) => {
    const name = req.params.name;
    db.query(`SELECT * FROM topic WHERE topic LIKE '${'%' + name + '%'}' OR author_name LIKE '${'%' + name + '%'}'`,(err,resalt) => {
        if(err){
            console.log(err);
        } else {
            // console.log(name)
            res.send(resalt);
        }
    })
})
 
app.listen('3001',()=>{
    console.log('Server is running port 3001');
});

