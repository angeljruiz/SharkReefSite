"use strict";

var express = require('express');
var flash = require('connect-flash-plus');
var session = require('express-session');
var bp = require('body-parser');
var passport = require('passport');
var morgan = require('morgan');
var fs = require('fs');
var db = require('./scripts/database.js');
var pgSession = require('connect-pg-simple')(session);
var app = express();


require('./scripts/passport.js')(passport, db);

app.use(bp.urlencoded({extended: true}));
app.use(bp.json());
app.use(flash());
app.use(express.static(__dirname));
app.use(morgan('dev'));
app.use(session({
  store: new pgSession({
    pool : db.pool,                // Connection pool
  }),
  secret: 'weiofjwoeifj',
  name: 'Sharkreefcookies',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 1 day
}));
app.use(passport.initialize());
app.use(passport.session());
app.set('view engine', 'pug');
app.set('views', './views');
app.locals.pretty = true;

require('./scripts/utilities.js')(app, db, passport);
require('./scripts/routes.js')(app, db, passport);
var mw = require('./scripts/middleware.js')

var autoViews = {};
const reg = /(login|signup)/;

app.use( (req, res, next) => {
  let path = req.path.toLowerCase();
  if (reg.test(path) && req.isAuthenticated())
    return res.redirect('/');
  if (path === '/creator')
    res.locals.date = mw.formatDate(new Date());
  if (autoViews[path]) return res.render(autoViews[path]);
  if (fs.existsSync(__dirname + '/views' + path + '.pug')) {
    autoViews[path] = path.replace(/^\//, '');
    return res.render(autoViews[path]);
  }
  next();
});

var port = 80

app.listen(port, () => {
    console.log('listening on ' + port);
});
