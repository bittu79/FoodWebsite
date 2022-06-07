const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const app = express();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {open} = require("sqlite");
app.use(express.json());
const sqlite3 = require("sqlite3");
const { render } = require("express/lib/response");
const dbPath = path.join(__dirname,"userData.db");
const multer = require("multer");
let db = null;

      
const intializeDbAndServer = async (request,response)=>{
        try{
                db = await open({
                        filename:dbPath,
                        driver:sqlite3.Database
                })
                app.listen(3000,()=>{
                        console.log("Server Running at http://localhost:3000");
                });
        }
        catch(e){
                console.log(`Db Error ${e.message}`);
                process.exit(1);
        }
}

intializeDbAndServer();

app.use(express.static('public'));
app.use('/css',express.static(__dirname + 'public/css'));
app.use('/images',express.static(__dirname + 'public/images'));
app.use('/javascript',express.static(__dirname + 'public/javascript'));
app.use('/uploads',express.static(__dirname + 'public/uploads'));
app.use(bodyParser.urlencoded({extended: true}));


app.set('views','./views');
app.set('view engine','ejs'); 
app.get('/foodApp',(request,response)=>{
        response.render('index');
})


app.get('/register',(request,response)=>{
        response.render('register',{data:"Email Must be Unique"});
})

app.get("/login",(request,response)=>{
        response.render("login",{data:"Enter Valid Credentials"});
})

app.post("/user-created",async (request,response)=>{
        const {fn,email,ps,cps} = request.body;
        const userQuery = `
                SELECT
                        *
                FROM 
                        userDetails
                WHERE
                        email = '${email}'
        `
        const dbUser = await db.get(userQuery);
        if(dbUser === undefined){
                const img = 'images/user.png'
                const hasedPassword =await bcrypt.hash(ps,10);
                if(ps === cps){
                        const userQuery = `
                                INSERT INTO userDetails(
                                        fullname,email,password,img
                                )
                                VALUES('${fn}','${email}','${hasedPassword}','${img}')
                        `;
                        const dbUser = await db.run(userQuery);
                        response.redirect('/login');
                }
                else{
                        response.render('register',{data:"Passwords must be Same"});
                }
        }
        else{
                response.render('register',{data:"Email has already been taken"});
        }
        
});



let ct = null;
let bt = null;
app.post('/user-login',async(request,response)=>{

        const {email,ps} = request.body
        ct = email;
        const userQuery = `
                SELECT
                        *
                FROM 
                        userDetails
                WHERE
                        email = '${email}'
        `
        const dbUser = await db.get(userQuery);
        if(dbUser !== undefined){
        bt = dbUser.id;
        const matchPassword = await bcrypt.compare(ps,dbUser.password);
        if (matchPassword === true){
                payload = {
                        email:email
                }
                jwtToken = jwt.sign(payload,"secret");
                const userQuery = `
                INSERT INTO token(
                        email,jwtToken
                )
                VALUES('${email}','${jwtToken}')
        `;
                const dbUser = await db.run(userQuery);
                response.redirect("/HomePage");
        }
        else{
                response.render("login",{data:"Password is Incorrect"})
        }
        }
        else{
                response.render("login",{data:"User Does not Exist"})
        }
})


const authenticateToken = async (request,response,next)=>{
        const userQuery = `
                SELECT
                        *
                FROM
                        token
                WHERE
                        email = '${ct}'
        `
        const dbUser = await db.get(userQuery);
        if(dbUser !== undefined){
                jwt.verify(dbUser.jwtToken,"secret",async (error,payload)=>{
                        if(error){
                                response.redirect("/HomePage");
                        }
                        else{
                                next();
                        }
                })
        }  
        else{
                response.redirect("/login");
        }
}

app.get("/profile",authenticateToken,async (request,response)=>{
        const userQuery = `
                SELECT
                        *
                FROM
                        userDetails
                WHERE
                        email = '${ct}'
        `
        const dbUser = await db.get(userQuery);
        response.render("profile",{data:dbUser,data1:[]});
})

app.get("/HomePage",authenticateToken,async (request,response)=>{
        const userQuery = `
                SELECT
                        *
                FROM 
                        item
        `
        const dbUser = await db.all(userQuery);
        const uQuery = `
                        SELECT
                                *
                        FROM 
                                buyitem
                        WHERE 
                                userid = ${bt}
                `
        const dhUser = await db.all(uQuery);
        response.render("loginnavbar",{data:dbUser,data1:dhUser});
})

app.get("/logout",async (request,response)=>{
        const userQuery = `
                SELECT
                        *
                FROM
                        token
                WHERE 
                        email = '${ct}'
        `
        const dbUser = await db.get(userQuery);
        const deleteQuery  = `
                DELETE FROM token
                WHERE   
                        email = '${dbUser.email}'
        `
        await db.run(deleteQuery);
        response.redirect('/foodApp');
})


var storage = multer.diskStorage({
        destination: function (req, file, cb) {
      
            cb(null, "./public/uploads")
        },
        filename: function (req, file, cb) {
          cb(null, file.fieldname+bt+".jpg")
        }
      })
      const maxSize = 1 * 10000 * 10000;
    
      var upload = multer({ 
          storage: storage,
          limits: { fileSize: maxSize },
          fileFilter: function (req, file, cb){
          
              var filetypes = /jpeg|jpg|png/;
              var mimetype = filetypes.test(file.mimetype);
        
              var extname = filetypes.test(path.extname(
                          file.originalname).toLowerCase());
              
              if (mimetype && extname) {
                  return cb(null, true);
              }
            
              cb("Error: File upload only supports the "
                      + "following filetypes - " + filetypes);
            } 
        
      }).single("mypic");       


      app.post("/uploadProfilePicture", function(req, res, next) {
        
        upload(req,res,function(err) {
      
            if(err) {
      
                res.send(err)
            }
            else {
      
                const rt = `uploads/mypic${bt}.jpg`;
                const updateQuery = `
                        UPDATE userDetails
                        SET 
                           img = '${rt}'
                        WHERE
                                id = ${bt}
                `
                const dbUser = db.run(updateQuery);
                res.redirect('/profile');
            }
        })
    })


app.post("/search-items",async (request,response)=>{
        const {search} = request.body;
        const userQuery = `
                SELECT
                        *
                FROM 
                        item
                WHERE
                        itemName LIKE '%${search}%'
        `
        const dbUser = await db.all(userQuery);
        const uQuery = `
                        SELECT
                                *
                        FROM 
                                buyitem
                        WHERE 
                                userid = ${bt}
                `
        const dhUser = await db.all(uQuery);
        response.render("loginnavbar",{data:dbUser,data1:dhUser});
})

app.get('/users/:userId', (req, res) => {
        res.send(req.params)
      })


app.get("/additem/",authenticateToken,async (request,response)=>{
        const userQuery = `
                SELECT
                        *
                FROM 
                        item
                WHERE 
                        id = ${request.query.id}
        `
        const dbUser = await db.get(userQuery);
        const urQuery = `
                SELECT
                        *
                FROM 
                        buyitem
                WHERE 
                        itemName = '${dbUser.itemName}'
        `
        const dvUser = await db.get(urQuery);
        if (dvUser !== []){
                const qQuery = `
        INSERT INTO buyitem (
                name,itemName,price,rating,img,userid
        )
        VALUES ('${dbUser.name}','${dbUser.itemName}',${dbUser.price},${dbUser.rating},'${dbUser.img}',${bt})
        `
        const dUser = await db.run(qQuery);
       response.redirect(`/HomePage#id${dbUser.id}`);
        }
        else{
                response.redirect("/HomePage")
        }
})


app.get("/deleteitem/",async (request,response)=>{
        const uQuery =`
                DELETE FROM  buyitem
                WHERE 
                        id = ${request.query.id}
        `
        const dUser = await db.run(uQuery);
       response.redirect("/mycart")
})



app.get("/mycart",async (request,response)=>{
        const uQuery = `
                        SELECT
                                *
                        FROM 
                                buyitem
                        WHERE 
                                userid = ${bt}
                `
        const dhUser = await db.all(uQuery);
        const uy = `
                        SELECT
                                *
                        FROM 
                                userDetails
                        WHERE
                                id = ${bt}
                `
        const dr = await db.get(uy);
        if (dhUser.length === 0){
        response.render("myorder2",{data1:dhUser,data2:"images/cart1.jpg"});
        }
        else{
                response.render("myorders",{data:dhUser,data1:dhUser,data2:dr});    
        }
})

app.get("/orderplaced",async (request,response)=>{
        const userQuery = `
                        SELECT
                                *
                        FROM 
                                buyitem
                        WHERE
                                userid = ${bt}
                `
        const dhUser = await db.all(userQuery);
        const uy = `
                        SELECT
                                *
                        FROM 
                                userDetails
                        WHERE
                                id = ${bt}
                `
        const dr = await db.get(uy);
        const uQuery = `
                        DELETE FROM buyitem
                        WHERE name IN ("non veg","veg","Desserts") AND userid = ${bt}
                `
        const dbUser = await db.run(uQuery);
        for (let i = 0; i < dhUser.length; i++) {
                let d = new Date();
                const qQuery = `
        INSERT INTO orderitem (
                name,itemName,price,rating,img,dtime,userid,address
        )
        VALUES ('${dhUser[i].name}','${dhUser[i].itemName}',${dhUser[i].price},${dhUser[i].rating},'${dhUser[i].img}','${d}',${bt},'${dr.address}')
        `
        const dUser = await db.run(qQuery);
              }
        response.render("myorder2",{data1:[],data2:"images/order.jpg"});
})


app.get("/orderhistory",async (request,response)=>{
        const uQuery = `
                        SELECT
                                *
                        FROM 
                                orderitem
                        WHERE 
                                userid = ${bt}
                `
        const dhUser = await db.all(uQuery);
        dhUser.reverse();
        const userQuery = `
                        SELECT
                                *
                        FROM 
                                buyitem
                        WHERE 
                                userid = ${bt}
                `
        const dbUser = await db.all(userQuery);
        response.render("orderhistory",{data:dhUser,data1:dbUser});
})

app.post("/addressPage",async (request,response)=>{
        const {address2} = request.body;
        const uQuery = `
        SELECT
                *
        FROM 
                buyitem
        WHERE 
                userid = ${bt}
`
        const dhUser = await db.all(uQuery);
        const userQuery = `
                UPDATE userDetails
                SET 
                        address = '${address2}'
                WHERE 
                        id  = ${bt}
        `
        const dbUser = await db.get(userQuery);
        const uy = `
                        SELECT
                                *
                        FROM 
                                userDetails
                        WHERE
                                id = ${bt}
                `
        const dr = await db.get(uy);
        response.render("myorders",{data:dhUser,data1:dhUser,data2:dr});

});


