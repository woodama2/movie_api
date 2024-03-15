let http = require('http');
http.createServer(function (request, response) {
  response.writeHead(200, { 'Content-Type': 'text/plain' });
  response.end('Hello Node!\n');
});

const express = require('express'),
  morgan = require('morgan');
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
