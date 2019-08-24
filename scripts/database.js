"use strict";

var db = require('pg');
var config = { user: 'postgres', database: 'SharkReef', password: 'mamadastacoslol', host: 'localhost', port: 5432, max: 10, idleTimeoutMillis: 30000 };
var pool = new db.Pool(config);

pool.on('error', function (err) {
    console.error('idle client error', err.message, err.stack);
});

module.exports.connect = function (callback) {
    return pool.connect(callback);
};



class Database {
  static className(model) { return (new model).constructor.name + ' as lh '}
  static publicKey(pk) { if (pk != 'all' && pk) return 'WHERE lh.' + pk[0] + " = '" + pk[1] + "'"; else return ''; }
  static joinNeeded(model, attrs) {
    if (!Object.getPrototypeOf(model).name)
      return false;
    let keys = model.variables();
    if (attrs == 'all')
      return true;
    attrs.forEach( item => {
      if (!keys.includes(item))
        return true;
    });
    return false;
  }
  static join(attrs, pk, model) {
    if (Database.joinNeeded(model, attrs))
      return 'FULL JOIN ' + Object.getPrototypeOf(model).name + ' rh on lh.' + pk[0] + '=rh.' + pk[0] + ' ';
    else
      return '';
  }
  static attributes(attrs, pre='', encap='', post='') {
    let attributes = pre;
    if (attrs == 'all') {
      attributes = '*';
    } else {
      attrs.forEach( (item, index) => {
        attributes += encap + item + encap;
        if (index < attrs.length-1)
          attributes += ', ';
      });
    }
    return attributes + post;
  }
  getData( model, attrs, pk, fn) {
    let c = new model;
    let d = [];
    let keys = Object.keys(c);
    let query;
    query = 'SELECT ' + Database.attributes(attrs, '', '', ' FROM ') + Database.className(model);
    query += Database.join(attrs, pk, model);
    query += Database.publicKey(pk);
    console.log(query);
    pool.query(query, (err, res) => {
      if (err)
        return console.error('error running query', err);
      let rtr = function(item) {
        c[item] = res.rows[0][item];
      }
      if (res.rows.length == 1) {
        if (attrs == 'all')
          keys.forEach ( rtr );
        else
          attrs.forEach( rtr );
      } else if (res.rows.length > 1) {
        res.rows.forEach( (item, index) => {
          d.push(new model);
          keys.forEach ( (key) => {
            d[index][key] = res.rows[index][key];
          });
        });
      } else return fn(false);
      if (res.rows.length == 1)
        return fn(c);
      else if (res.rows.length >= 1)
        return fn(d);
    });
  }
  saveData(model, attrs, pk, input, fn) {
    let pre = '(', post = ')', query ='';
    if (pk) {
      if (attrs.length > 1) {
        pre = 'SET (';
      } else {
        pre = 'SET ';
        post = '';
      }
      query = 'UPDATE ';
    } else query = 'INSERT INTO ';
    query += Database.className(model) + Database.attributes(attrs, pre, '', post);
    query += pk? ' = (' : ' VALUES (';
    query += Database.attributes(input, '', "'", ') ') + Database.publicKey(pk);
    console.log(query);
    pool.query(query, (err) => {
      if (err)
        return console.error('error running query', err);
      if (fn)
        return fn();
    });
  }
  deleteData(model, pk, fn) {
    let query = 'DELETE FROM ' + Database.className(model) + Database.publicKey(pk);
    console.log(query);
    pool.query(query, (err) => {
      if (err)
          return console.error('error running query', err);
      if (fn)
        return fn();
    });
  }

}

module.exports = new Database;
module.exports.pool = pool
