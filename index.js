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

const cors = require('cors');
const { check, validationResult } = require('express-validator');

// To only allow certain origins to have access...
let allowedOrigins = [
  'http://localhost:8080',
  'http://localhost:4200',
  'http://testsite.com',
  'http://localhost:1234',
  'https://myflix-2024.netlify.app',
  'https://woodama2.github.io',
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        // If a specific origin isn't found on the list of allowed origins
        let message =
          "The CORS policy for this application doesn't allow access from origin " +
          origin;
        return callback(new Error(message), false);
      }
      return callback(null, true);
    },
  })
);

/**
 * To allow all origins...
 * app.use(cors({}));
 */

let auth = require('./auth')(app);
const passport = require('passport');
require('./passport');

const mongoose = require('mongoose');
const Models = require('./models.js');
const Movies = Models.Movie;
const Users = Models.User;

// mongoose.connect('mongodb://localhost:27017/cfDB', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });

mongoose.connect(process.env.CONNECTION_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// setup the logger
app.use(morgan('combined', { stream: accessLogStream }));

// (fs = require('fs')), // import built in node modules fs and path
//   (path = require('path'));

// FILE PATHS

/**
 * GET homepage
 * default text response when at '/'
 */

app.get('/', (req, res) => {
  res.send('Welcome to MyFlix!');
});

/**
 * GET all movies
 * return JSON object when at '/movies' endpoint
 */

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

/**
 * GET all users
 * return JSON object when at '/users' endpoint
 */

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

/**
 * We'll expect JSON in this format for data = users
 * {
 * ID: integer,
 * username: string,
 * password: string,
 * email: string,
 * birthday: date,
 * favorites: array
 * }
 */

/**
 * CREATE (i.e. POST) new user
 * return JSON object when at '/users' endpoint
 * request body = username*, password*, email*, birthday
 * response body = username*, password* (hashed), email*, birthday, favorites, _id, __v
 */

app.post(
  '/users',
  // Validation logic here for request
  //you can either use a chain of methods like .not().isEmpty()
  //which means "opposite of isEMpty" in plain english "is not empty"
  //or use .isLength({min: 5}) whyich means
  //minimum value of 5 characters are only allowed
  [
    check('username', 'username is required').isLength({ min: 5 }),
    check(
      'username',
      'username contains non alphanumeric characters - not allowed.'
    ).isAlphanumeric(),
    check('password', 'password is required').not().isEmpty(),
    check('email', 'email does not appear to be valid').isEmail(),
  ],
  async (req, res) => {
    // check the validation object for errors
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    let hashedPassword = Users.hashPassword(req.body.password);
    await Users.findOne({ username: req.body.username }) // Search to see if a user with the requested username already exists
      .then((user) => {
        if (user) {
          // If the user is found, send a response that it already exists
          return res.status(400).send(req.body.username + ' already exists');
        } else {
          Users.create({
            username: req.body.username,
            password: hashedPassword,
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
  }
);

/**
 * CREATE (i.e. POST) add a movie to a user's list of favorites
 * return JSON object when at '/users/:username/:MovieID' endpoint
 * request body = username*, MovieID
 * response body = username*, password* (hashed), email*, birthday, favorites, _id, __v
 */

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

/**
 * We'll expect JSON in this format for data = movies
 * {
 * ID: integer,
 * Title: string,
 * Description: string,
 * Genre: Object,
 *  Genre.Name: string,
 *  Genre.Description: string,
 * Director: Object,
 *  Director.Name: string,
 *  Director.Bio: string,
 *  Director.Birth: date,
 *  Director.Death: date,
 * ImagePath: string,
 * Featured: boolean,
 * }
 */

/**
 * READ (i.e. GET) all movies
 * return JSON object when at '/movies' endpoint and user logged in
 */

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

/**
 * READ (i.e. GET) all users
 * return JSON object when at '/users' endpoint and user logged in
 */

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

/**
 * READ (i.e. GET) a single user by username
 * return JSON object when at '/users/:username' endpoint and user logged in
 */

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

/**
 * READ (i.e. GET) a single movie by Title
 * return JSON object when at '/movies/:title' endpoint and user logged in
 * request body = movie.Title
 * response body = Title, Description, Genre, Genre.Name, Genre.Description, Director, Director.Name, Director.Bio, Director.Birth, Director.Death, ImagePath, Featured, _id
 */

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

/**
 * READ (i.e. GET) a single movie's genre description by Name
 * return JSON object when at '/movies/genre/:genreName' endpoint and user logged in
 * request body = movie.genre.genreName
 * response body = Genre.Name, Genre.Description
 */

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

/**
 * READ (i.e. GET) a single movie's director description by Name
 * return JSON object when at '/movies/director/:directorName' endpoint and user logged in
 * request body = movie.Director.directorName
 * response body = Director.Name, Director.Bio, Director.Birth, Director.Death
 */

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

/**
 * We'll expect JSON in this format for data = users
 * {
 * ID: integer,
 * username: string, (required)
 * password: string, (required)
 * email: string, (required)
 * birthday: date,
 * favorites: array
 * }
 */

/**
 * UPDATE (i.e. PUT) a single user's data when changed
 * return JSON object when at '/users/:username' endpoint and user logged in
 * request body = user.username, user.password, user.email, user.birthday
 * response body = user.username, user.password, user.email, user.birthday
 */

app.put(
  '/users/:username',

  // Validation logic here for request
  //you can either use a chain of methods like .not().isEmpty()
  //which means "opposite of isEmpty" in plain english "is not empty"
  //or use .isLength({min: 5}) which means
  //minimum value of 5 characters are only allowed
  [
    check('username', 'username is required').isLength({ min: 5 }),
    check(
      'username',
      'username contains non alphanumeric characters - not allowed.'
    ).isAlphanumeric(),
    // Make password optional if not provided
    check('password').optional().not().isEmpty(),
    check('email', 'email does not appear to be valid').isEmail(),
  ],

  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    // check the validation object for errors
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    let hashedPassword = Users.hashPassword(req.body.password);

    // CONDITION TO CHECK ADDED HERE
    if (req.user.username !== req.params.username) {
      return res.status(400).send('Permission denied');
    }
    // CONDITION ENDS, finds user and updates their info
    await Users.findOneAndUpdate(
      { username: req.params.username },
      {
        $set: {
          username: req.body.username,
          password: hashedPassword,
          email: req.body.email,
          birthday: req.body.birthday,
        },
      },
      { new: true }
    ) // This line makes sure that the updated document is returned
      .then((updatedUser) => {
        res.status(201).json(updatedUser);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  }
);

// DELETE

/**
 * DELETE a single user's single favorite movie
 * return JSON object when at '/users/:username/:movieID endpoint and user logged in
 * request body = user.username, movies.movieID
 * response body = username*, password* (hashed), email*, birthday, favorites, _id, __v
 */

app.delete(
  '/users/:username/:movieID',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    await Users.findOneAndUpdate(
      { username: req.params.username },
      {
        $pull: { favorites: req.params.movieID },
      },
      { new: true }
    ) //This line makes sure that the updated document is returned
      .then((updatedUser) => {
        res.json(updatedUser);
      })
      .catch((err) => {
        console.error(err), res.status(500).send('Error: ' + err);
      });
  }
);

/**
 * DELETE a single user
 * When at '/users/:username/ endpoint called and user logged in
 * request body = user.username
 * response body = 200 message that user was deleted
 */

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
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log('Listening on Port ' + port);
});

// app.listen(8080, () => {
//   console.log('Your app is listening on port 8080.');
// });

/** app.listen(8080, () => {
 * console.log('Your app is listening on port 8080.');
 * });
 */
