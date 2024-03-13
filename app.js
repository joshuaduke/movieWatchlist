require('dotenv').config();
const express = require("express");
const https = require("https");
const axios = require("axios");
const ejs = require("ejs");
const URL = require("url").URL;
const _ = require("lodash");
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const app = express();
const apiKey = process.env.API_KEY;
const apikeyTMDB = process.env.TMDB_API_KEY;

//configuring express session
app.use(session({
  secret: process.env.PASSPORT_SECRET,
  resave: false,
  saveUninitialized:false,
}))

//configuring passport 
app.use(passport.initialize());
app.use(passport.session()); //informs passport to use our configured session

//setting up mongoose
mongoose.connect(`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.nt3rk.mongodb.net/movieDB`);

const userSchema = new mongoose.Schema({
  username: String,
  fullname: String,
  password: String,
  googleId: String,
  watchlist: [{type: mongoose.Schema.Types.ObjectId, ref: "Watchlist"}],
  moviesWatched: [{type: mongoose.Schema.Types.ObjectId, ref: "Watched"}],
})

//configuring passport local mongoose
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

//schema 
const watchlistSchema = {
  imdbID: String,
  movieTitle: String,
  movieGenre: String,
  movieRating: Number,
  movieReleaseYear: String,
  movieLength: String,
  moviePoster: String,
  users: [{type: mongoose.Schema.Types.ObjectId, ref: "User"}],
}

const watchedSchema = {
  imdbID: String,
  movieTitle: String,
  movieGenre: String,
  movieRating: String,
  movieReleaseYear: String,
  movieLength: String,
  moviePoster: String,
  userRating: Number,
  userWatchedDate: String,
  userReview: String,
  recommended: Boolean,
  rewatch: Boolean,
  users: [{type: mongoose.Schema.Types.ObjectId, ref: "User"}],
}

//models
const Watchlist = new mongoose.model('Watchlist', watchlistSchema);
const Watched = new mongoose.model('Watched', watchedSchema);
const User = new mongoose.model('User', userSchema);

passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "https://movie-watchlist-7bdfc2fa57d2.herokuapp.com/auth/google/home"
},
function(accessToken, refreshToken, profile, cb) {
  console.log(profile);
  User.findOrCreate({ googleId: profile.id}, {fullname: profile.displayName, username: profile._json.email}, function (err, user) {
    return cb(err, user);
  });
}
));

app.set("view engine", "ejs");

//retrieve form data : req.body.data
app.use(express.urlencoded({ extended: true }));
//locate static files in the public folder
app.use(express.static("public"));
app.use(
  "/dist",
  express.static(__dirname + "/node_modules/@glidejs/glide/dist/")
);

app.get('/', (req, res) => {
  if(req.isAuthenticated()){

  const comingSoon = axios.get(
    `https://api.themoviedb.org/3/movie/upcoming?api_key=${apikeyTMDB}&language=en-US&page=1&region=US`
  );
  const inTheatres = axios.get(
    `https://api.themoviedb.org/3/movie/now_playing?api_key=${apikeyTMDB}&language=en-US&page=1&region=US`
  );

  User.findOne({_id: req.user._id}).populate(['watchlist', 'moviesWatched']).exec((err, user)=>{
    if (err) {
      console.log(err);
    } else {
      axios
      .all([comingSoon, inTheatres])
      .then(
        axios.spread((...responses) => {
          const comingSoonData = responses[0];
          const inTheatresData = responses[1];
  
          res.render("home", {
            comingSoon: comingSoonData.data.results,
            theatres: inTheatresData.data.results,
            user: user
          });
        })
      )
      .catch((errors) => {
        console.error(errors);
      });
    }
  })

  } else {
    res.redirect('/login');
  }
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/home', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  });

app.route('/register')
    .get((req, res)=>{
      res.render('register')
    })
    .post((req, res)=>{
      User.register({username: req.body.username, fullname: req.body.fullName}, req.body.password, (err, user)=>{
        if (err) {
          console.log(err);
          res.redirect('/register');
        } else {
          if (req.body.password === req.body.confirmPassword) {
            passport.authenticate("local", {failureRedirect: '/register'}) (req, res, ()=>{
              res.redirect('/');
            })
          } else {
            res.redirect('/');
          }
        }
      })
    });


app.route('/login')
    .get((req, res)=>{
      res.render('login')
    })
    .post((req, res)=>{
      const user = new User({
        username: req.body.username,
        password: req.body.password
      })

      req.login(user, (err)=>{
        if(err) {
          console.log(err);
          res.redirect('/login')
        } else {
          passport.authenticate('local', {failureRedirect: '/login'}) (req, res, ()=>{
            res.redirect('/');
          })
        }
      })
    });

app.post('/tester', (req, res)=>{
  const user = new User({
    username: process.env.ADMIN_USER,
    password: process.env.ADMIN_PASS
  })

  console.log('user', user)

  req.login(user, (err)=>{
    if(err) {
      console.log(err);
      res.redirect('/login')
    } else {
      passport.authenticate('local', {failureRedirect: '/login'}) (req, res, ()=>{
        res.redirect('/');
      })
    }
  })
})

app.get('/logout', (req, res)=>{
  req.logout();
  res.redirect('/login');
})

app.get("/home/:option", (req, res) => {
  if(req.isAuthenticated()){
    let pageOption = req.params.option;
    let title = '';
    let url = '';

    if (pageOption == "comingSoon") {
        title = 'Coming Soon'
        url = `https://api.themoviedb.org/3/movie/upcoming?api_key=${apikeyTMDB}&language=en-US&region=US`;

        async function getUser() {
            try {
              const response = await axios.get(url);
              let data = response.data;
              return data.total_pages;

            } catch (error) {
              console.error(error);
            }
          }

        getUser()
      .then((data) => {
        return getPageData(data);
      })
      .catch((err) => console.log(err));

    //replace with 'data'
    // 2 is for testing
    async function getPageData(data) {
      let pagesDataArr = [];
      let page = 1;
      for (let i = 0; i < data; i++) {
        let pageData = axios.get(
          `https://api.themoviedb.org/3/movie/upcoming?api_key=${apikeyTMDB}&language=en-US&page=${page}&region=US`
        );
        page++;
        pagesDataArr[i] = pageData;
      }

      console.log("Pages data");
      pagesDataArr.forEach((element) => {
        // console.log(element);
      });

      axios
        .all(pagesDataArr)
        .then(
          axios.spread((...responses) => {
            let data = [];

            responses.forEach((element) => {
              data.push(element.data.results);
            });

            res.render("homeOptions", { data: data, title: title });
          })
        )
        .catch((errors) => {
          console.error(errors);
        });
    }

    } else if (pageOption == 'inTheatres'){
        title = 'In Theatres'
        url = `https://api.themoviedb.org/3/movie/now_playing?api_key=${apikeyTMDB}&language=en-US&region=US`;

        async function getUser() {
            try {
              const response = await axios.get(url);
              let data = response.data;
              // console.log(data.total_pages);
              return data.total_pages;
            } catch (error) {
              console.error(error);
            }
          }

        getUser()
      .then((data) => {
        return getPageData(data);
      })
      .catch((err) => console.log(err));

    //replace with 'data'
    // 2 is for testing
    async function getPageData(data) {
      let pagesDataArr = [];
      let page = 1;
      for (let i = 0; i < data; i++) {
        let pageData = axios.get(
          `https://api.themoviedb.org/3/movie/now_playing?api_key=${apikeyTMDB}&language=en-US&page=${page}&region=US`
        );
        page++;

        pagesDataArr[i] = pageData;
      }

      console.log("Pages data");
      pagesDataArr.forEach((element) => {
        // console.log(element);
      });

      axios
        .all(pagesDataArr)
        .then(
          axios.spread((...responses) => {
            let data = [];

            responses.forEach((element) => {
              data.push(element.data.results);
            });

            res.render("homeOptions", { data: data, title: title });
          })
        )
        .catch((errors) => {
          console.error(errors);
        });
    }
    }

  } else {
    res.redirect('/login')
  }

});

app.get("/search", (req, res) => {
  if(req.isAuthenticated()){
    let data = false;
    let inputvalue = "";
    res.render("search", {
      searchedData: false,
      data: data,
      inputvalue: inputvalue,
    });
  } else {
    res.redirect('/login')
  }
});

app.post("/search", (req, res) => {
  if(req.isAuthenticated()){
    const searchedValue = _.escape(req.body.movieTitle);
    const page = 1;
    console.log("Input value " + searchedValue);
  
    const urlTMDB = new URL(`https://api.themoviedb.org/3/search/movie?api_key=${apikeyTMDB}&language=en-US&query=${searchedValue}&page=${page}&include_adult=false&region=US`);
  
    if (searchedValue == "") {
      res.redirect("/search");
    } else {
      axios.get(urlTMDB.href).then((response) => {
        let data = response.data;

        res.render("search", {
          searchedData: data,
          data: true,
          inputvalue: searchedValue,
        });
      }).catch(err => {
        console.log(err);
        res.redirect('/search');
      });
    }
  } else {
    res.redirect('/login')
  }

});

app.get("/search/:option", (req, res) => {
  if(req.isAuthenticated()){
    let option = req.params.option;
    let url = '';
    let title = '';
    console.log(option);
  
    switch (option) {
      case "topMovies":
        url = `https://imdb-api.com/en/API/Top250Movies/${apiKey}`;
        axios.get(url).then((response) => {
          let data = response.data;
          title = "Top 250 Movies"  

          res.render("searchOptions", { data: data, option: title });
        });
        break;
  
      case "allTimeBo":
        url = `https://imdb-api.com/en/API/BoxOfficeAllTime/${apiKey}`;
        axios.get(url).then((response) => {
          let data = response.data;
          title = "All Time Box Office"  

          res.render("searchOptions", { data: data, option: title });
        });
        break;
  
        case "mostPopular":
          url = `https://imdb-api.com/en/API/MostPopularMovies/${apiKey}`;
          axios.get(url).then((response) => {
            let data = response.data;
            title = "Most Popular Movies"  

            res.render("searchOptions", { data: data, option: title });
          });
          break;
  
          case "topBoxOffice":
              url = `https://imdb-api.com/en/API/BoxOffice/${apiKey}`;
              axios.get(url).then((response) => {
                let data = response.data;
                title = "Box Office"  

                res.render("searchOptions", { data: data, option: title });
              });
              break;
  
      default:
        break;
    }

  } else {
    res.redirect('/login')
  }
});

app.get("/movie/:selected", (req, res) => {
  if(req.isAuthenticated()){
    let selectedId = req.params.selected;

    const urlTMDB = `https://api.themoviedb.org/3/movie/${selectedId}/external_ids?api_key=${apikeyTMDB}`;
    const url = `https://imdb-api.com/en/API/Title/${apiKey}/${selectedId}`;
  
    axios
      .get(urlTMDB)
      .then((response) => {
        let movieId = response.data.imdb_id;
  
        axios
          .get(`https://imdb-api.com/en/API/Title/${apiKey}/${movieId}`)
          .then((movieData) => {
  
            if (movieData.data.title == null) {
              console.log("No information on this is available");
              res.redirect("/search");
            } else {
              let data = movieData.data;
              
              Watchlist.findOne({imdbID: data.id, users: req.user._id}, (err, result)=>{
                if (!result) {
                  res.render("selectedMovie", { data: data, exists: false });
                } else{
                  res.render("selectedMovie", { data: data, exists: true });
                }
              })
              
            }
          })
          .catch((err) => console.error(err));
      })
      .catch((err) => console.error(err));
  
  } else {
    res.redirect('/login')
  }
});

app.post("/movie/:selected", (req, res)=>{
  const currentMovie = req.body.currentMovie;
  console.log(`Current Movie is: ${currentMovie}`);

  if(req.isAuthenticated()){

    User.findOne({_id : req.user._id}).populate('watchlist').exec((err, user)=>{
      if (err) {
        console.log(err);
      } else {
        Watchlist.findOneAndDelete({users: req.user._id, imdbID: currentMovie}, (err, result)=>{
          if (!result) {
            axios.get(`https://imdb-api.com/en/API/Title/${apiKey}/${currentMovie}`)
            .then((movieData)=>{
      
              const newMovie = new Watchlist({
                imdbID: currentMovie,
                movieTitle: movieData.data.title,
                movieGenre: movieData.data.genres,
                movieRating: movieData.data.imDbRating,
                movieReleaseYear: movieData.data.year,
                movieLength: movieData.data.runtimeStr,
                moviePoster: movieData.data.image,
                users: req.user._id,
              });
      
              newMovie.save()
              user.watchlist.push(newMovie)
              user.save(()=>{
                console.log('Watchlist saved to user DB');
              })
              console.log('Save to the watchlist DB');

              res.redirect(`/watchlist`);
            })
            .catch((err) => console.error(err));
      
          } else{
            console.log('Does Exist and has been deleted');
            let obj = user.watchlist.findIndex(findWatchlistMovie)

            function findWatchlistMovie(movie){
                let movieID = JSON.stringify(movie._id);
                let resultID = JSON.stringify(result._id);

                if (movieID === resultID) {
                  return movieID === resultID;
                } else {
                  console.log('Not same');
                }
            }

            if(obj >= 0){

                user.watchlist.splice(obj, 1);
                user.save(()=>{
                  console.log('Item removed');
                })
                
            }
            res.redirect(`/watchlist`);
          }
        })
      }
    })
  } else {
    res.redirect('/');
  }
})

app.get("/watchlist", (req, res) => {
  if(req.isAuthenticated()){

    User.findOne({_id: req.user._id}).populate('watchlist').exec((err, user)=>{
      res.render("watchlist", {data: user.watchlist});
    })

  } else {
    res.redirect('/login');
  }
});

app.get("/watched", (req, res) => {
  if(req.isAuthenticated()){
    Watched.find({users: req.user._id}, (err, results)=>{
      if(err){
        console.log(err);
  
      } else {
        console.log('Watched: Results');
        // console.log(results);
        res.render("watched", {data: results});
      }
    })
  } else {
    res.redirect('/login')
  }
});

app.get('/watched/:selected', (req, res)=>{
  if(req.isAuthenticated()){
    const userReview = req.params.selected;

    Watched.findOne({_id: userReview}, (err, data)=>{
      Watchlist.findOne({imdbID: data.imdbID, users: req.user._id}, (err, result)=>{
        if(!result){
          res.render("selectedWatched", { data: data, exists: false });
        } else {
          res.render("selectedWatched", { data: data, exists: true });
          console.log('Does Exist');
        }
      })
    })
  } else {
    res.redirect('/login')
  }
})

app.post('/watched/:selected', (req, res)=>{
  if(req.isAuthenticated()){
    const currentMovie = req.params.selected;
    const currentMovieID = req.body.currentMovie;
    console.log(`Current Movie is: ${currentMovieID}`);

    User.findOne({_id: req.user._id}, (err, user)=>{
      if (err) {
        console.log(err);
      } else {
        Watchlist.findOneAndDelete({imdbID: currentMovieID}, (err, result)=>{
          if (!result) {
            axios.get(`https://imdb-api.com/en/API/Title/${apiKey}/${currentMovieID}`)
            .then((movieData)=>{
      
              const newMovie = new Watchlist({
                imdbID: currentMovieID,
                movieTitle: movieData.data.title,
                movieGenre: movieData.data.genres,
                movieRating: movieData.data.imDbRating,
                movieReleaseYear: movieData.data.year,
                movieLength: movieData.data.runtimeStr,
                moviePoster: movieData.data.image
              });
      
              newMovie.save()
              console.log('Save to the watchlist DB');
              res.redirect(`/watched/${currentMovie}`);
            })
            .catch((err) => console.error(err));
      
          } else{
            console.log('Does Exist and has been deleted');
            let obj = user.watchlist.findIndex(findWatchlistMovie)

            function findWatchlistMovie(movie){
                let movieID = JSON.stringify(movie._id);
                let resultID = JSON.stringify(result._id);

                if (movieID === resultID) {
                  return movieID === resultID;
                } else {
                  console.log('Not same');
                }
            }

            if(obj >= 0){
                user.watchlist.splice(obj, 1);
                user.save(()=>{
                  console.log('Item removed');
                })
            }

            res.redirect(`/watched`);
          }
        })
      }
    })
  

  } else {
    res.redirect('/login')
  }

})

app.post('/delete/:selected', (req, res)=>{
  const currentMovie = req.params.selected;
  console.log(`Current Movie is: ${currentMovie}`);

  if(req.isAuthenticated()){
    User.findOne({_id: req.user._id}, (err, user)=>{
      if (err) {
        console.log(err);
      } else {
        Watched.findOneAndDelete({users: req.user._id, imdbID: currentMovie}, (err, result)=>{
          if(!result){
            console.log('not found');
            res.redirect('/watched');
          } else {
            console.log('Deleted from Watched db');

            let resultID = result._id;
            console.log(resultID);
            let obj = user.moviesWatched.findIndex(findWatchedMovie)

            function findWatchedMovie(movie){
                let movieID = JSON.stringify(movie._id);
                let resultID = JSON.stringify(result._id);

                if (movieID === resultID) {
                  return movieID === resultID;
                } else {
                  console.log('Not same');
                }
            }

            if(obj >= 0){
                user.moviesWatched.splice(obj, 1);
                user.save(()=>{
                  console.log('Item removed');
                })
            }
            res.redirect('/watched')

          }
        })
      }
    })
  } else {
    res.redirect('/login');
  }
})
 
app.get("/addNew/:movieId", (req, res) => {
  if(req.isAuthenticated()){
    let movieId = req.params.movieId;

    User.findOne({_id: req.user._id}).populate('moviesWatched').exec((err, user)=>{
      if(err){
        console.log(err);
      }else {
        let obj = user.moviesWatched.find(found => found.imdbID === movieId)
        if(obj){
          res.render("addReview", { data: obj });
        } else {
          console.log('not found');

          axios.get(`https://imdb-api.com/en/API/Title/${apiKey}/${movieId}`)
          .then((movieData) => {
              let data = movieData.data;
              res.render("addReview", { data: data });
          })
          .catch((err) => console.error(err));
        }
      }
    })
  } else {
    res.redirect('/login')
  }  
});

app.post("/addNew/:movieId", (req, res) => {
  if(req.isAuthenticated()){
    let movieId = req.params.movieId;

    /* check if movieID exists within the watched database
      if it does run the findOne and update Command if it doesn't, run the insertMany Code
    */

      Watched.findOne({_id: movieId, users: req.user._id}, (err, results)=>{

        if(!results){
          console.log('Not in the DB');
          axios.get(`https://imdb-api.com/en/API/Title/${apiKey}/${movieId}`)
          .then((movieData) => {      
              const userReview = 
                {
                imdbID: req.params.movieId,
                movieTitle: movieData.data.title,
                movieGenre: movieData.data.genres,
                movieRating: movieData.data.imDbRating,
                movieReleaseYear: movieData.data.releaseDate,
                movieLength: movieData.data.runtimeStr,
                moviePoster: movieData.data.image,
                userRating: req.body.userRating,
                userWatchedDate: req.body.dateWatched,
                userReview: req.body.userReview,
                recommended: req.body.recommend,
                rewatch: req.body.rewatch,
                users: req.user._id
                }
              

              const newReview = new Watched(userReview);
              newReview.save();
              console.log('Added review ');

              User.findOne({_id: req.user._id}, (err, user)=>{
                user.moviesWatched.push(newReview._id);
                user.save();
                console.log('Added review to the user');
              })


              res.redirect('/watched');

          })
          .catch((err) => console.error(err));
        } else {

          const userReview = 
          {
            userRating: req.body.userRating,
            userWatchedDate: req.body.dateWatched,
            userReview: req.body.userReview,
            recommended: req.body.recommend,
            rewatch: req.body.rewatch,
          }

          Watched.updateOne({_id : results._id}, userReview, (err)=>{
            console.log(err);
          })
          res.redirect('/watched');
        }
      })

  } else {
    res.redirect('/login')
  }
})

app.get('/account', (req, res)=>{
  if(req.isAuthenticated()){
    
    User.findOne({_id: req.user._id}).populate(['watchlist', 'moviesWatched']).exec((err, user)=>{
      if (err) {
        console.log(err);
      } else {
        let avgRating = 0;

        user.moviesWatched.forEach(element => {
          avgRating += Number(element.userRating)
        });
        
        if (user.moviesWatched.length > 0) {
          avgRating = (avgRating / user.moviesWatched.length) * 10;
        } else {
          avgRating = 0;
        }
  
        let data = {
          amountWatched: user.moviesWatched.length,
          avgRating: avgRating,
          fullName: user.fullname,
          email: user.username
        }
        res.render('account', {data: data});
      }

    })
    
  } else {
    res.redirect('/login')
  }
})

//route to delete account
app.post('/account', (req, res)=>{
  if(req.isAuthenticated()){
      User.findOneAndDelete({_id: req.user.id}, (err, user)=>{
        if (err) {
          console.log('User not found', err);
        } else {

          Watchlist.deleteMany({users: user._id}, (err, count)=>{
            if (err) {
              console.log('Error while deleting', err);
            } else {
              
              console.log(`${count} items have been deleted from Watchlist DB`);
            }
          });

          Watched.deleteMany({users: user._id}, (err, count)=>{
            if (err) {
              console.log('Error while deleting');
            } else {
              
              console.log(`${count} items have been deleted from Watched DB`);
            }
          });

          console.log("Deleted User: ", user);
          res.redirect('/logout')
        }
      })
} else {
  res.redirect('/login') 
}
})

app.get('*', (req, res)=>{
  res.redirect('/login');
})

app.listen(process.env.PORT || 3000, () => {
  console.log("Server has started...");
});

/*
   Joshua Duke
*/