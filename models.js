const mongoose = require('mongoose');
const { stringify } = require('uuid');
const bcrypt = require('bcrypt');

let movieSchema = mongoose.Schema({
  Title: { type: String, required: true },
  Description: { type: String, required: true },
  Genre: {
    Name: String,
    Description: String,
  },
  Director: {
    Name: String,
    Bio: String,
    Birth: Date,
    Death: Date,
  },
  //   Actors: [String],
  ImagePath: String,
  Featured: Boolean,
});

let userSchema = mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  email: { type: String, required: true },
  birthday: Date,
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }],
});

userSchema.statics.hashPassword = (password) => {
  return bcrypt.hashSync(password, 10);
};

userSchema.methods.validatePassword = function (password) {
  return bcrypt.compareSync(password, this.password);
};

let Movie = mongoose.model('Movie', movieSchema);
let User = mongoose.model('User', userSchema);

module.exports.Movie = Movie;
module.exports.User = User;


mongoimport --uri mongodb+srv://woodama2:OnvBvm9lsB5FjDt5@myflixdb.ovs9xd3.mongodb.net/myFlixDB --collection movies --type json --file /Users/mandy/Desktop/movies.json

mongoimport --uri mongodb+srv://woodama2:OnvBvm9lsB5FjDt5@myflixdb.ovs9xd3.mongodb.net/myFlixDB --collection movies --type json --file movies.json

mongoimport --uri mongodb+srv://woodama2:OnvBvm9lsB5FjDt5@myflixdb.ovs9xd3.mongodb.net/myFlixDB --collection users --type json --file users.json