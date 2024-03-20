let http = require('http');
http.createServer(function (request, response) {
  response.writeHead(200, { 'Content-Type': 'text/plain' });
  response.end('Hello Node!\n');
});

const express = require('express'),
  morgan = require('morgan'),
  bodyParser = require('body-parser'),
  uuid = require('uuid');
(fs = require('fs')), // import built in node modules fs and path
  (path = require('path'));

const app = express();
//create a srite stream (in append mode)
// a 'log.txt' file is created in root directory
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {
  flags: 'a',
});

// setup the logger
app.use(morgan('combined', { stream: accessLogStream }));

app.use(bodyParser.json());

let users = [
  {
    id: 1,
    name: 'Mandy',
    favoriteMovies: [],
  },
  {
    id: 2,
    name: 'Kim',
    favoriteMovies: [],
  },
  {
    id: 3,
    name: 'Mike',
    favoriteMovies: ['The_Fountain'],
  },
];

let movies = [
  {
    Title: 'Pulp Fiction',
    Description:
      'The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.',
    Genre: {
      Name: 'Drama',
      Description:
        'In film and television, drama is a category or genre of narrative fiction (or semi-fiction) intended to be more serious than humorous in tone.[1] The drama of this kind is usually qualified with additional terms that specify its particular super-genre, macro-genre, or micro-genre,[2] such as soap opera, police crime drama, political drama, legal drama, historical drama, domestic drama, teen drama, and comedy-drama (dramedy).',
    },
    Director: {
      Name: 'Quentin Tarantino',
      Bio: 'An American film director, screenwriter, and actor. His films are characterized by stylized violence, extended dialogue including a pervasive use of profanity, and references to popular culture.',
      Birth: 1963,
    },
    ImageURL:
      'https://en.wikipedia.org/wiki/File:Pulp_Fiction_(1994)_poster.jpg#/media/File:Pulp_Fiction_(1994)_poster.jpg',
    Featured: false,
  },
  {
    Title: 'Back to the Future',
    Description:
      'Marty McFly, a 17-year-old high school student, is accidentally sent 30 years into the past in a time-traveling DeLorean invented by his close friend, the maverick scientist Doc Brown.',
    Genre: {
      Name: 'Sci-Fi',
      Description:
        'Science fiction (sometimes shortened to SF or sci-fi) is a genre of speculative fiction, which typically deals with imaginative and futuristic concepts such as advanced science and technology, space exploration, time travel, parallel universes, and extraterrestrial life.',
    },
    Director: {
      Name: 'Robert Zemeckis',
      Bio: 'An American film director, producer, and screenwriter. He first came to public attention as the director of the action-adventure romantic comedy Romancing the Stone (1984), the science-fiction comedy Back to the Future trilogy (1985–1990), and the live-action/animated comedy Who Framed Roger Rabbit (1988). He subsequently directed the satirical black comedy Death Becomes Her (1992) and then diversified into more dramatic fare, including Forrest Gump (1994),[4] for which he won the Academy Award for Best Director. The film also won the Best Picture.',
      Birth: 1952,
    },
    ImageURL:
      'https://en.wikipedia.org/wiki/File:Back_to_the_Future.jpg#/media/File:Back_to_the_Future.jpg',
    Featured: false,
  },
];

let topMovies = [
  {
    title: 'Back to the Future',
    boxOffice: '388.8 million USD',
  },
  {
    title: 'Pulp Fiction',
    boxOffice: '213.9 million USD',
  },
  {
    title: '2001: A Space Odyssey',
    boxOffice: '146 million USD',
  },
  {
    title: 'The Dark Night',
    boxOffice: '1.006 billion USD',
  },
  {
    title: 'The Wizard of Oz',
    boxOffice: '29.7 million USD',
  },
  {
    title: 'Titanic',
    boxOffice: '2.264 billion USD',
  },
  {
    title: 'The Shawshank Redemption',
    boxOffice: '73.3 million USD',
  },
  {
    title: 'Citizen Kane',
    boxOffice: '1.8 million USD',
  },
  {
    title: 'Psycho',
    boxOffice: '50 million USD',
  },
  {
    title: 'Forrest Gump',
    boxOffice: '678.2 million USD',
  },
];

// CREATE
// Allow new users to register
app.post('/users', (req, res) => {
  const newUser = req.body;

  if (newUser.name) {
    newUser.id = uuid.v4();
    users.push(newUser);
    res.status(201).json(newUser);
  } else {
    res.status(400).send('users need names');
  }
});

// CREATE
// Allow users to add a movie to their list of favorites (showing only a text that a movie has been added)
app.post('/users/:id/:movieTitle', (req, res) => {
  const { id, movieTitle } = req.params;

  let user = users.find((user) => user.id == id);

  if (user) {
    user.favoriteMovies.push(movieTitle);
    res.status(200).send(`${movieTitle} has been added to ${id}'s array`);
  } else {
    res.status(400).send('no such user');
  }
});

// READ
// Return a list of ALL movies to the user
app.get('/movies', (req, res) => {
  res.status(200).json(movies);
});

// READ
// Return data (description, genre, director, image URL, whether it's featured or not) about a single movie by title to the user
app.get('/movies/:title', (req, res) => {
  const { title } = req.params;
  const movie = movies.find((movie) => movie.Title === title);

  if (movie) {
    res.status(200).json(movie);
  } else {
    res.status(400).send('no such movie');
  }
});

// READ
// Return data about a genre (description) by name/title (e.g. "Thriller")
app.get('/movies/genre/:genreName', (req, res) => {
  const { genreName } = req.params;
  const genre = movies.find((movie) => movie.Genre.Name === genreName).Genre;

  if (genre) {
    res.status(200).json(genre);
  } else {
    res.status(400).send('no such genre');
  }
});

// READ
// Return data about a director (bio, birth year, death year) by name;
app.get('/movies/directors/:directorName', (req, res) => {
  const { directorName } = req.params;
  const director = movies.find(
    (movie) => movie.Director.Name === directorName
  ).Director;

  if (director) {
    res.status(200).json(director);
  } else {
    res.status(400).send('no such director');
  }
});

// UPDATE
// Allow users to update their user info (username, password, email, date of birth)
app.put('/users/:id', (req, res) => {
  const { id } = req.params;
  const updatedUser = req.body;

  let user = users.find((user) => user.id == id);

  if (user) {
    user.name = updatedUser.name;
    res.status(200).json(user);
  } else {
    res.status(400).send('no such user');
  }
});

// DELETE
// Allow users to remove a movie from their list of favorites (showing only a text that a movie has been removed)
app.delete('/users/:id/:movieTitle', (req, res) => {
  const { id, movieTitle } = req.params;

  let user = users.find((user) => user.id == id);

  if (user) {
    user.favoriteMovies = user.favoriteMovies.filter(
      (title) => title !== movieTitle
    );
    res.status(200).send(`${movieTitle} has been removed from ${id}'s array`);
  } else {
    res.status(400).send('no such user');
  }
});

// DELETE
// Allow existing users to deregister (showing only a text that a user email has been removed)
app.delete('/users/:id', (req, res) => {
  const { id } = req.params;

  let user = users.find((user) => user.id == id);

  if (user) {
    users = users.filter((user) => user.id != id);
    res.status(200).send(`user ${id} has been deleted`);
  } else {
    res.status(400).send('no such user');
  }
});

// Welcome route
app.get('/', (req, res) => {
  res.send('Welcome to myFLix!');
});

//Static file
app.use(
  '/documentation',
  express.static('public', { index: 'documentation.html' })
);

// JSON movie route
app.get('/movies', (req, res) => {
  res.json(topMovies);
});

// Super secret route...just for fun
app.get('/secreturl', (req, res) => {
  res.send('This is a secret url with super top-secret content.');
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
