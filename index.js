const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const userRoutes = require('./routes/userRoutes');
const passport = require('passport');
const session = require('express-session');
require('dotenv').config();

const app = express();

/// CORS configuration
const corsOptions = {
 origin: 'http://localhost:3000',
 credentials: true,
 methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
 allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight requests


app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


app.use(session({ secret: process.env.FB_CLIENT_SECRET, resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

// Route handling user-related requests
app.use('/api/users', userRoutes);
app.use('/', userRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
 console.log(`Server is running on port ${PORT}`);
});