let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');
let fs = require("fs");
let busboy = require ("connect-busboy");
let express_graphql = require('express-graphql');
let { graphql, buildSchema} = require('graphql');
let connection;
require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
let response, request;

let myschema = buildSchema(`
    type Mutation {
        deleteGuitar (guitar_id: Int!): Int
        addGuitar(guitar_id: Int!, guitar_name: String!, amount_in_stock: Int!, img_src: String): Guitar
    },
    type Query {
        guitars: [Guitar]
        login (login: String!, password: String!): Boolean
        logout: Boolean
        verify: Boolean
    },
    type Guitar {
        guitar_id: Int,
        guitar_name: String,
        amount_in_stock: Int,
        img_src: String
    },
    type User {
        login: String,
        password: String
    }
`);

let root = {
    guitars: async () => {
        let [rows, fields] = await connection.query("SELECT * FROM warehouse");
        let content = JSON.stringify(rows);
        let guitars = JSON.parse(content);
        return guitars;
    },
    deleteGuitar:  async (data) => {
        let array = request.headers.cookie.split(';');
        let token = array[array.length -1].split('=')[1];
        if (verifyToken(token)) {
            let obj = data.guitar_id + "";
            let temp = parseInt(obj);
            let query = "DELETE FROM warehouse WHERE guitar_id = " + temp;
            let result = await connection.query(query);
            if (result[0].affectedRows !== 0) {
                console.log('deleted');
                return temp;
            } else {
                return 0;
            }
        } else {
            return 0;
        }

    },
    addGuitar: async (data) => {
        console.log(data);
        let obj = [data.guitar_id, data.guitar_name, data.amount_in_stock, data.img_src];
        let sql = "INSERT INTO warehouse VALUES (?,?,?,?)";
        let result = await connection.query(sql, obj);
        let returnValue = {guitar_name: data.guitar_name, guitar_id: data.guitar_id, amount_in_stock: data.amount_in_stock, img_src: data.img_src};
        return returnValue;
    },
    login: async (_, req,{res}) => {
        const login = _.login;
        const password = _.password;
        let user=new User(login,password,null);
        let passwordDB ;
        let sql="SELECT password FROM user WHERE login = ?";
        let result = await connection.query(sql, user.username);
        let results = JSON.stringify(result);
        if (result.length>0) {
            let temp = JSON.parse(results);
            passwordDB = temp[0][0].password;
            if (bcrypt.compareSync(password, passwordDB)) {
                const expiresIn = 60 * 60;
                const accessToken = jwt.sign({login: login}, process.env.SECRET_KEY, {expiresIn: expiresIn});
                response.setHeader('Set-Cookie', 'token=' + accessToken + '; expires = '+ setExpiringTime()+';Secure, HttpOnly');
                return true;
            } else {
                return false;
            }
        }else{
            return false;
        }
    },
    logout: () => {
        let token = request.headers.cookie.split(';')[3].split('=')[1];
        response.setHeader('Set-Cookie', 'token= ; expires=Thu, 01 Jan 1970 00:00:00 UTC; Secure, HttpOnly');
        return true;
    },
    verify: () => {
        let array = request.headers.cookie.split(';');
        let token = array[array.length -1].split('=')[1];
        if (verifyToken(token))
            return true;
        else
            return false;
    }
};

main();

let app = express();

app.post('/api/uploadFile', function(req, res) {
    fs.writeFile(__dirname +  '\\public\\images\\'+ "temp.jpg", req.body.file, function (error) {
        if (!error) {
            console.log('adding image succesful')
        }
    });
});

app.use('/api', function (req,res,next) {
    response = res;
    request = req;
    next();
});

app.use(busboy());

app.use('/api', express_graphql(() =>({
    schema: myschema,
    rootValue: root,
    graphiql: true,
})));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public/images')));

app.listen(3000,() => {
    console.log('Listening on port 3000');
});

async function main(){
     connection = await mysql.createConnection({
        host: "localhost",
        user: "root",
        database: "guitarshop",
        password: process.env.PASSWORD
    });
}

function verifyToken(token) {
    try{
        jwt.verify(token, process.env.SECRET_KEY);
        return true;
    }catch(error){
        return false;
    }
}


function User(username,password,email) {
    this.username=username;
    this.password= password;
    this.email=email;
}

function setExpiringTime() {
    let currentTime = new Date();
    let time = currentTime.getTime();
    let expireTime = time + 1000*3600;
    currentTime.setTime(expireTime);
    return currentTime.toUTCString();
}

process.on("SIGINT",()=>{
    connection.end();
    process.exit();
});

