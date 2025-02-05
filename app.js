"use strict";

let express = require('express');
let flash = require('connect-flash-plus');
let session = require('express-session');
let bp = require('body-parser');
let passport = require('passport');
let morgan = require('morgan');
let device = require('express-device');
let fs = require('fs');
let db = require('./scripts/database');
let pgSession = require('connect-pg-simple')(session);

let Auth = require('./config/auth');
let Keys = require('./config/keys');

let app = express();

app.use(bp.urlencoded({extended: true}));
app.use(bp.json());
app.use(flash());
app.use(express.static(__dirname));
app.use(device.capture());
device.enableDeviceHelpers(app)
app.use(morgan('dev'));
app.use(session({
  store: new pgSession({
    pool : db.pool,                // Connection pool
  }),
  secret: Keys.cookieKey,
  name: 'BeCommercecookies',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 30 minutes
}));
app.use(passport.initialize());
app.use(passport.session());
app.set('view engine', 'pug');
app.set('views', './views');
app.locals.pretty = true;

app.use('/auth', Auth);
require('./routes/utilities')(app, passport);
require('./routes/routes')(app, passport);
let mw = require('./config/middleware')

let autoViews = {};
const reg = /(login|signup)/;

app.use( (req, res, next) => {
  let path = req.path.toLowerCase();
  if (reg.test(path) && req.isAuthenticated())
    return res.redirect('/');
  if (autoViews[path]) return res.render(autoViews[path]);
  if (fs.existsSync(__dirname + '/views' + path + '.pug')) {
    autoViews[path] = path.replace(/^\//, '');
    return res.render(autoViews[path]);
  }
  next();
});

let port = 80

app.listen(port, () => {
    console.log('listening on ' + port);
});
