let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');
let fs = require("fs");
let busboy = require ("connect-busboy");
let express_graphql = require('express-graphql');
let { graphql, buildSchema} = require('graphql');
let connection;

const mysql = require('mysql2/promise');

let myschema = buildSchema(`
    type Query {
        guitars: [Guitar]
    },
    type Guitar {
        guitar_id: Int,
        guitar_name: String,
        amount_in_stock: Int,
        img_src: String
    }
`);

let root = {
    guitars: async () => {
        let [rows, fields] = await connection.query("SELECT * FROM warehouse");
        let content = JSON.stringify(rows);
        let guitars = JSON.parse(content);
        return guitars;
    }
};

main();

let app = express();
app.use('/api', express_graphql({
    schema: myschema,
    rootValue: root,
    graphiql: true,
}));
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
        password: "njhcbjy19"
    });
}


process.on("SIGINT",()=>{
    connection.end();
    process.exit();
});

