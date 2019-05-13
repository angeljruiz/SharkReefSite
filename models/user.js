var fs = require('fs');
var bcrypt = require('bcrypt-nodejs');
var db = require('../scripts/database.js');
var sync = require('async');

class User {
    constructor(input, fn) {
      this.username = 0;
      this.email = 0;
      this.password = 0;
      this.id = -1;
      this.profilePicture = 0;
      if (input) {
        if (input.username) {
          this.username = input.username;
        } else if (input.email) {
          this.email = input.email;
        } else if (input.id) {
          this.id = input.id;
        }
        return User.findOne(this, fn);
      }
    }
    static findOne(id, fn) {
        let user = new User();
        let lPictures = false;
        db.selectUser(id, (error, data) => {
            if(error)
                return fn(error);
            if(data) {
                user.username = data.username;
                user.password = data.password;
                user.id = data.id;
                if(data.pp) {
                    user.profilePicture = data.pp;
                } else {
                  lPictures = 'media/df.png';
                }
                user.loadData({ path: lPictures }).then( () => {
                  return fn(null, user);
                });
            } else {
                return fn(false, false);
            }
        });
    }
    pageify(req) {
      if (req.isAuthenticated())
        this.loggedIn = true;
      if (req.query.id === req.user.id)
        this.owner = true;
      else
        this.owner = false;
      return this;
    }
    loadData(input, fn) {
      let stack = [];
      if (input.path)
        stack.push(this.loadPicture(input.path));
      return Promise.all(stack, fn);
    }
    loadPicture(pic) {
      return new Promise( (resolve, reject) => {
        fs.readFile(pic, (err, data) => {
            if(err)
                return reject(err);
            this.profilePicture = data;
            resolve();
        });
      });
    }
    generateHash(password) {
        this.password = bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
    }
    validPassword(password) {
        return bcrypt.compareSync(password, this.password);
    }
    save(fn) {
        db.createUser(this.username, this.email, this.password, fn);
    }

}

module.exports = User;
