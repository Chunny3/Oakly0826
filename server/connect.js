import mysql from "mysql2/promise";

// // 學校電腦
const pool = mysql.createPool({
  host: "localhost",
  port: 3306,
  user: "admin",
  password: "a12345",
  database: "oakly"
});


// 雅嵐
// const pool = mysql.createPool({
//   host: "localhost",
//   port: 3306,
//   user: "admin",
//   password: "a12345",
//   database: "oakly"
// });


// 雅嵐
// const pool = mysql.createPool({
//   host: 'localhost',
//   user: 'root',
//   password: '',
//   database: 'product',
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0,})

//欣錞
// const pool = mysql.createPool({
//   host: "localhost",
//   user: "root",
//   password: "1234",
//   database: "oakly",
//   waitForConnections: true,
//   connectionLimit:10,
//   queueLimit: 0,
// });

// 羿葶
// const pool = mysql.createPool({
//   host: "127.0.0.1",   // 建議寫 127.0.0.1 而不是 localhost
//   port: 3306,
//   user: "admin",
//   password: "a12345",
//   database: "oakly"
// });

export default pool;