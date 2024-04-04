// SETUP
const express = require('express'),
  bodyParser = require('body-parser'),
  uuid = require('uuid'),
  morgan = require('morgan'),
  app = express();
(fs = require('fs')), (path = require('path'));

//create a write stream (in append mode)
// a 'log.txt' file is created in root directory
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {
  flags: 'a',
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(bodyParser.json());

let auth = require('./auth')(app);
const passport = require('passport');
require('./passport');

const mongoose = require('mongoose');
const Models = require('./models.js');
const Movies = Models.Movie;
const Users = Models.User;

mongoose.connect('mongodb://localhost:27017/cfDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// setup the logger
app.use(morgan('combined', { stream: accessLogStream }));

// (fs = require('fs')), // import built in node modules fs and path
//   (path = require('path'));

// FILE PATHS

// default text response when at /
app.get('/', (req, res) => {
  res.send('Welcome to MyFlix!');
});

// return JSON object when at /movies
app.get(
  '/movies',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    Movies.find()
      .then((movies) => {
        res.status(201).json(movies);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  }
);

// return JSON object when at /users
app.get(
  '/users',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    await Users.find()
      .then((users) => {
        res.status(201).json(users);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  }
);

//Static file
app.use(
  '/documentation',
  express.static('public', { index: 'documentation.html' })
);

// Super secret route...just for fun
app.get('/secreturl', (req, res) => {
  res.send('This is a secret url with super top-secret content.');
});

// CRUD

// CREATE
// Add a user
/* We'll expect JSON in this format
{
  ID: Integer,
  username: String,
  password: String,
  email: String,
  birthday: Date,
  favorites: Array
}*/
app.post('/users', async (req, res) => {
  await Users.findOne({ username: req.body.username })
    .then((user) => {
      if (user) {
        return res.status(400).send(req.body.username + ' already exists');
      } else {
        Users.create({
          username: req.body.username,
          password: req.body.password,
          email: req.body.email,
          birthday: req.body.birthday,
          favorites: req.body.favorites,
        })
          .then((user) => {
            res.status(201).json(user);
          })
          .catch((error) => {
            console.error(error);
            res.status(500).send('Error: ' + error);
          });
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send('Error: ' + error);
    });
});

// CREATE
// Add a movie to a user's list of favorites
app.post(
  '/users/:username/:MovieID',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    await Users.findOneAndUpdate(
      { username: req.params.username },
      {
        $push: { favorites: req.params.MovieID },
      },
      { new: true }
    ) // This line makes sure that the updated document is returned
      .then((updatedUser) => {
        res.json(updatedUser);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  }
);

// READ
// Return a list of ALL movies to the user
app.get(
  '/movies',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Movies.find()
      .then((movies) => {
        res.status(200).json(movies);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  }
);

// READ
// Get all users
app.get(
  '/users',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    await Users.find()
      .then((users) => {
        res.status(201).json(users);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  }
);

// READ
// Get a user by username
app.get(
  '/users/:username',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    await Users.findOne({ username: req.params.username })
      .then((user) => {
        res.json(user);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  }
);

// READ
// Return data (description, genre, director, image URL, whether it's featured or not) about a single movie by title to the user
app.get(
  '/movies/:title',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const { title } = req.params;
      const movie = await Movies.findOne({ Title: title });

      if (movie) {
        res.status(200).json(movie);
      } else {
        res.status(400).send('no such movie');
      }
    } catch (err) {
      console.error(err);
      res.status(500).send('Error: ' + err);
    }
  }
);

// READ
// Return data about a genre (description) by name/title (e.g. "Thriller")
app.get(
  '/movies/genre/:genreName',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const { genreName } = req.params;
      const moviesWithGenre = await Movies.find({ 'Genre.Name': genreName });

      if (moviesWithGenre.length > 0) {
        const genre = {
          Name: genreName,
          Description: moviesWithGenre[0].Genre.Description,
        };
        res.status(200).json(genre);
      } else {
        res.status(400).send('no such genre');
      }
    } catch (err) {
      console.error(err);
      res.status(500).send('Error: ' + err);
    }
  }
);

// READ
// Return data about a director (bio, birth year, death year) by name;
app.get(
  '/movies/directors/:directorName',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const { directorName } = req.params;
      const moviesWithDirector = await Movies.find({
        'Director.Name': directorName,
      });

      if (moviesWithDirector.length > 0) {
        const director = {
          Name: directorName,
          Bio: moviesWithDirector[0].Director.Bio,
          Birth: moviesWithDirector[0].Director.Birth,
          Death: moviesWithDirector[0].Director.Death,
        };
        res.status(200).json(director);
      } else {
        res.status(400).send('no such director');
      }
    } catch (err) {
      console.error(err);
      res.status(500).send('Error: ' + err);
    }
  }
);

// UPDATE
// Update a user's info, by username
/* We’ll expect JSON in this format
{
  username: String,
  (required)
  password: String,
  (required)
  email: String,
  (required)
  birthday: Date,
  favorites: Array
}*/
app.put(
  '/users/:username',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    // CONDITION TO CHECK ADDED HERE
    if (req.user.username !== req.params.username) {
      return res.status(400).send('Permission denied');
    }
    // CONDITION ENDS
    await Users.findOneAndUpdate(
      { username: req.params.username },
      {
        $set: {
          username: req.body.username,
          password: req.body.password,
          email: req.body.email,
          birthday: req.body.birthday,
          favorites: req.body.favorites,
        },
      },
      { new: true }
    ) // This line makes sure that the updated document is returned
      .then((updatedUser) => {
        res.json(updatedUser);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  }
);

// DELETE
// Allow users to remove a movie from their list of favorites (showing only a text that a movie has been removed)
app.delete(
  '/users/:username/:movieID',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    const username = req.params.username;
    const movieID = req.params.movieID;

    try {
      const user = await Users.findOne({ username });

      if (user) {
        const initialLength = user.favorites.length;
        user.favorites = user.favorites.filter((title) => title !== movieID);
        res
          .status(200)
          .send(`${movieID} has been removed from ${username}'s array`);
      } else {
        res.status(400).send('no such user');
      }
    } catch (error) {
      console.error(error);
      res.status(500).send('Error: ' + err);
    }
  }
);

// DELETE
// Delete a user by username
app.delete(
  '/users/:username',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    await Users.findOneAndDelete({ username: req.params.username })
      .then((user) => {
        if (!user) {
          res.status(400).send(req.params.username + ' was not found');
        } else {
          res.status(200).send(req.params.username + ' was deleted.');
        }
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  }
);

// error-handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Oops! Something broke!');
});

// listen for requests
app.listen(8080, () => {
  console.log('Your app is listening on port 8080.');
});
