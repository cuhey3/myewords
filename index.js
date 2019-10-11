const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000
const pages = require('./pages');
const JAWSDB_URL = process.env['JAWSDB_URL'];
const mysql = require('mysql');
const connectionParam = {
  host: JAWSDB_URL.split('@')[1].split(':')[0],
  user: JAWSDB_URL.split('//')[1].split(':')[0],
  password: JAWSDB_URL.split('@')[0].split(':')[2],
  port: JAWSDB_URL.split(':')[3].split('/')[0],
  database: JAWSDB_URL.split(':')[3].split('/')[1]
};
const connection = mysql.createConnection(connectionParam);

connection.connect();
connection.query('create table if not exists keywords (title varchar(255), score int, index title_index(title));');
connection.end();
express()
        .use(express.static(path.join(__dirname, 'public')))
        .get('/foo', (req, res) => {
          const connection = mysql.createConnection(connectionParam);
          connection.query('select * from keywords;', function (err, rows, fields) {
            //console.log(err, rows, fields);
          })
          res.send('boo');
        })
        .get('/api', (req, res) => {
          let increment = 0;
          const title = req.query.keyword;
          if ('up' === req.query.recommend) {
            increment = 1;
          } else if ('down' === req.query.recommend) {
            increment = -1;
          } else {
            throw new Error();
          }
          if (pages.some((page) => title === page[0])) {
            const connection = mysql.createConnection(connectionParam);
            connection.connect();
            connection.query('update keywords set score=score + (' + increment + ") where title='" + title + "';", function (err, rows, fields) {
              //console.log(rows);
              if (!rows.changedRows) {
                connection.query("insert into keywords values('" + title + "', " + increment + ');', function () {
                  connection.end();
                  res.send('foo');
                });
              } else {
                connection.end();
                res.send('foo');
              }
            });
          } else {
            throw new Error();
          }
        })
        .get('/recommend', (req,res) => {
            const connection = mysql.createConnection(connectionParam);
            connection.connect();
            connection.query('select title from keywords where score > 0 order by score desc;', function (err, rows, fields) {
              //console.log(rows);
              const titles = rows.map((row) => row.title);
              connection.end();
              res.send(JSON.stringify(titles));
            });
        })
        .listen(PORT, () => console.log(`Listening on ${ PORT }`));
