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

const mongoose = require('mongoose');
const Models = require('./models.js');
const Movies = Models.Movie;
const Users = Models.User;

// mongoose.connect('mongodb://localhost:27017/cfDB', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });

mongoose.connect('mongodb://localhost:27017/cfDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// setup the logger
app.use(morgan('combined', { stream: accessLogStream }));

// let http = require('http');
// http.createServer(function (request, response) {
//   response.writeHead(200, { 'Content-Type': 'text/plain' });
//   response.end('Hello Node!\n');
// });

// (fs = require('fs')), // import built in node modules fs and path
//   (path = require('path'));

// FILE PATHS

// default text response when at /
app.get('/', (req, res) => {
  res.send('Welcome to MyFlix!');
});

// return JSON object when at /movies
app.get('/movies', (req, res) => {
  Movies.find()
    .then((movies) => {
      res.status(201).json(movies);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// return JSON object when at /users
app.get('/users', async (req, res) => {
  await Users.find()
    .then((users) => {
      res.status(201).json(users);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

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
        return res.status(400).send(req.body.username + 'already exists');
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
// Allow new users to register
/* We’ll expect JSON in this format
{
  ID: Integer,
  Username: String,
  Password: String,
  Email: String,
  Birthday: Date
}*/
// app.post('/users', async (req, res) => {
//   await Users.findOne({ Username: req.body.Username })
//     .then((user) => {
//       if (user) {
//         return res.status(400).send(req.body.Username + 'already exists');
//       } else {
//         Users.create({
//           Username: req.body.Username,
//           Password: req.body.Password,
//           Email: req.body.Email,
//           Birthday: req.body.Birthday,
//         })
//           .then((user) => {
//             res.status(201).json(user);
//           })
//           .catch((error) => {
//             console.error(error);
//             res.status(500).send('Error: ' + error);
//           });
//       }
//     })
//     .catch((error) => {
//       console.error(error);
//       res.status(500).send('Error: ' + error);
//     });
// });

// CREATE
// Allow users to add a movie to their list of favorites (showing only a text that a movie has been added)
// app.post('/users/:id/:movieTitle', (req, res) => {
//   const { id, movieTitle } = req.params;

//   let user = users.find((user) => user.id == id);

//   if (user) {
//     user.favoriteMovies.push(movieTitle);
//     res.status(200).send(`${movieTitle} has been added to ${id}'s array`);
//   } else {
//     res.status(400).send('no such user');
//   }
// });

// Add a movie to a user's list of favorites
app.post('/users/:username/:MovieID', async (req, res) => {
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
});

// READ
// Return a list of ALL movies to the user
app.get('/movies', (req, res) => {
  Movies.find()
    .then((movies) => {
      res.status(200).json(movies);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// Get JSON movie info when looking for a specific title
// app.get("/movies/:Title", (req, res) => {
//   Movies.findOne({Title: req.params.Title})
//   .then({movie} => {
//     res.json(movie);
//   })
//   .catch((err) => {
//     console.error(err);
//     res.status(500).send("Error: " + err);
//   });
// });

// Get JSON genre info when looking for specific genre
// app.get("/genre/:Name", (req, res) => {
//   Genres.findOne({Name: req.params.Name})
//   .then({genre} => {
//     res.json(genre.Description);
//   })
//   .catch({err} => {
//     console.error(err);
//     res.status(500).send("Error: " + err);
//   });
// });

// Get JSON director info when looking for specific director
// app.get("/directors/:Name", (req, res) => {
//   Directors.findOne({Name: req.params.Name})
//   .then({director} => {
//     res.json(director);
//     })
//     .catch((err) => {
//       console.error(err);
//       res.status(500).send("Error: " + err);
//     });
// });

// Get all users
app.get('/users', async (req, res) => {
  await Users.find()
    .then((users) => {
      res.status(201).json(users);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// Get a user by username
app.get('/users/:username', async (req, res) => {
  await Users.findOne({ username: req.params.username })
    .then((user) => {
      res.json(user);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// READ
// Return data (description, genre, director, image URL, whether it's featured or not) about a single movie by title to the user
app.get('/movies/:title', async (req, res) => {
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
});

// READ
// Return data about a genre (description) by name/title (e.g. "Thriller")
app.get('/movies/genre/:genreName', async (req, res) => {
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
});

// READ
// Return data about a director (bio, birth year, death year) by name;
app.get('/movies/directors/:directorName', async (req, res) => {
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
});

// UPDATE
// Allow users to update their user info (username, password, email, date of birth)
// app.put('/users/:id', (req, res) => {
//   const { id } = req.params;
//   const updatedUser = req.body;

//   let user = users.find((user) => user.id == id);

//   if (user) {
//     user.name = updatedUser.name;
//     res.status(200).json(user);
//   } else {
//     res.status(400).send('no such user');
//   }
// });

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
app.put('/users/:username', async (req, res) => {
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
});

// DELETE
// Allow users to remove a movie from their list of favorites (showing only a text that a movie has been removed)
app.delete('/users/:username/:movieID', async (req, res) => {
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
});

// DELETE
// Allow existing users to deregister (showing only a text that a user email has been removed)
// app.delete('/users/:id', (req, res) => {
//   const { id } = req.params;

//   let user = users.find((user) => user.id == id);

//   if (user) {
//     users = users.filter((user) => user.id != id);
//     res.status(200).send(`user ${id} has been deleted`);
//   } else {
//     res.status(400).send('no such user');
//   }
// });

// Delete a user by username
app.delete('/users/:username', async (req, res) => {
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
});

// error-handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Oops! Something broke!');
});

// listen for requests
app.listen(8080, () => {
  console.log('Your app is listening on port 8080.');
});
