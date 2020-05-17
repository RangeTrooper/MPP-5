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
    type Mutation {
        deleteGuitar (guitar_id: Int!): Int
        addGuitar(guitar_id: Int!, guitar_name: String!, amount_in_stock: Int!, img_src: String): Guitar
    },
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
    },
    deleteGuitar:  async (data) => {
        let obj = data.guitar_id + "";
        let temp = parseInt(obj);
        let query = "DELETE FROM warehouse WHERE guitar_id = " + temp;
        let result = await connection.query(query);
        if (result[0].affectedRows !== 0){
            console.log('deleted');
            return temp;
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
    }
};

main();

let app = express();
app.use('/api', express_graphql({
    schema: myschema,
    rootValue: root,
    graphiql: true,
}));

///дописать обработчик для загрузки файла

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

