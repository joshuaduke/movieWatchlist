require('dotenv').config();
const express = require("express");
const https = require("https");
const axios = require("axios");
const ejs = require("ejs");
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const app = express();
const apiKey = process.env.API_KEY;
const apikeyTMDB = process.env.TMDB_API_KEY;
// const moviePoster = require(__dirname + '/public/javascript/getPosters.js')
// let data = moviePoster();

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
//connection
// mongoose.connect('mongodb://localhost:27017/watchlist');
mongoose.connect('mongodb://localhost:27017/movieDB ');

const userSchema = new mongoose.Schema({
  email: String,
  fullname: String,
  password: String,
  watchlist: [{type: mongoose.Schema.Types.ObjectId, ref: "Watchlist"}],
  moviesWatched: [{type: mongoose.Schema.Types.ObjectId, ref: "Watched"}],
})

//configuring passport local mongoose
userSchema.plugin(passportLocalMongoose);

// watchlist: [{type: mongoose.Schema.Types.ObjectId, ref: "Watchlist"}],
// moviesWatched: [{type: mongoose.Schema.Types.ObjectId, ref: "Watched"}],

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

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

const watchedTest = new Watched({
  imdbID: "tt1375666",
  movieTitle: 'Inception',
  movieGenre: 'Test genre',
  movieRating: '8.8',
  movieReleaseYear: '2010',
  movieLength: 'Long',
  moviePoster: 'https://imdb-api.com/images/original/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_Ratio0.6762_AL_.jpg',
  userRating: 90,
  userWatchedDate: '2021-12-01',
  userReview: 'Fantastic movie, my mind is bended, maybe that\' because im high but who knows :)',
  recommended: true,
  rewatch: true
});

// watchedTest.save();

//create a new document
const newMovie = new Watchlist({
  imdbID: 123,
  movieTitle: 'This is a test',
  movieGenre: "Action",
  movieRating: 86,
  movieReleaseYear: "2021",
  movieLength: "20h45"
});

// newMovie.save();


app.set("view engine", "ejs");

//retrieve form data : req.body.data
app.use(express.urlencoded({ extended: true }));
//locate static files in the public folder
app.use(express.static("public"));
// app.use('/css', express.static(__dirname + '/node_modules/@glidejs/glide/dist/css'))
app.use(
  "/dist",
  express.static(__dirname + "/node_modules/@glidejs/glide/dist/")
);

app.get('/', (req, res) => {
  //check if user is authenticated
  if(req.isAuthenticated()){
    // we need to use a promise in order to store the data in a variable
    // Watchlist.find({}, (err, wacthlistMovies)=>{

    // })

  const comingSoon = axios.get(
    `https://api.themoviedb.org/3/movie/upcoming?api_key=${apikeyTMDB}&language=en-US&page=1&region=US`
  );
  const inTheatres = axios.get(
    `https://api.themoviedb.org/3/movie/now_playing?api_key=${apikeyTMDB}&language=en-US&page=1&region=US`
  );

  axios
    .all([comingSoon, inTheatres])
    .then(
      axios.spread((...responses) => {
        const comingSoonData = responses[0];
        const inTheatresData = responses[1];

        // console.log(comingSoonData.data, inTheatresData.data);

        res.render("home", {
          comingSoon: comingSoonData.data.results,
          theatres: inTheatresData.data.results,
        });
      })
    )
    .catch((errors) => {
      console.error(errors);
    });
  } else {
    res.redirect('/login');
  }
});

app.route('/register')
    .get((req, res)=>{
      res.render('register')
    })
    .post((req, res)=>{
      User.register({username: req.body.username}, req.body.password, (err, user)=>{
        if (err) {
          console.log(err);
          res.redirect('/register');
        } else {
          passport.authenticate("local") (req, res, ()=>{
            res.redirect('/');
          })
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
          passport.authenticate('local') (req, res, ()=>{
            res.redirect('/');
          })
        }
      })
    });

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
              // console.log(data.total_pages);
              return data.total_pages;
            } catch (error) {
              console.error(error);
            }
          }

        getUser()
      .then((data) => {
        console.log("inside get user coming soon");
        // console.log(data);
        return getPageData(data);
      })
      .catch((err) => console.log(err));

    //replace with 'data'
    // 2 is for testing
    async function getPageData(data) {
      let pagesDataArr = [];
      let page = 1;
      for (let i = 0; i < 2; i++) {
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
            // console.log(responses[0].data);
            responses.forEach((element) => {
              // console.log('LOOP');
              // console.log(element.data.results);
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
        console.log("inside get user");
        // console.log(data);
        return getPageData(data);
      })
      .catch((err) => console.log(err));

    //replace with 'data'
    // 2 is for testing
    async function getPageData(data) {
      let pagesDataArr = [];
      let page = 1;
      for (let i = 0; i < 2; i++) {
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
            // console.log(responses.data);
            responses.forEach((element) => {
              // console.log('LOOP');
              // console.log(element.data.results);
              data.push(element.data.results);
            });
            console.log('DATA:')
            // console.log(data)
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
    const searchedValue = req.body.movieTitle;
    const page = 1;
    console.log("Input value " + searchedValue);
  
    const urlTMDB = `https://api.themoviedb.org/3/search/movie?api_key=${apikeyTMDB}&language=en-US&query=${searchedValue}&page=${page}&include_adult=true&region=US`;
  
    if (searchedValue == "") {
      res.redirect("/search");
    } else {
      axios.get(urlTMDB).then((response) => {
        let data = response.data;
        // console.log(data);
        res.render("search", {
          searchedData: data,
          data: true,
          inputvalue: searchedValue,
        });
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
          // console.log(data);
          res.render("searchOptions", { data: data, option: title });
        });
        break;
  
      case "allTimeBo":
        url = `https://imdb-api.com/en/API/BoxOfficeAllTime/${apiKey}`;
        axios.get(url).then((response) => {
          let data = response.data;
          title = "All Time Box Office"  
          // console.log(data);
          res.render("searchOptions", { data: data, option: title });
        });
        break;
  
        case "mostPopular":
          url = `https://imdb-api.com/en/API/MostPopularMovies/${apiKey}`;
          axios.get(url).then((response) => {
            let data = response.data;
            title = "Most Popular Movies"  
            // console.log(data);
            res.render("searchOptions", { data: data, option: title });
          });
          break;
  
          case "topBoxOffice":
              url = `https://imdb-api.com/en/API/BoxOffice/${apiKey}`;
              axios.get(url).then((response) => {
                let data = response.data;
                title = "Box Office"  
                // console.log(data);
                res.render("searchOptions", { data: data, option: title });
              });
              break;
  
      default:
        break;
    }
    //   res.render("searchOptions", { option: option });
  } else {
    res.redirect('/login')
  }
});

app.get("/movie/:selected", (req, res) => {
  if(req.isAuthenticated()){
    let selectedId = req.params.selected;

    //   const apiKey = "k_7893g9qe";
    const urlTMDB = `https://api.themoviedb.org/3/movie/${selectedId}/external_ids?api_key=${apikeyTMDB}`;
    const url = `https://imdb-api.com/en/API/Title/${apiKey}/${selectedId}`;
  
    axios
      .get(urlTMDB)
      .then((response) => {
        let movieId = response.data.imdb_id;
  
        axios
          .get(`https://imdb-api.com/en/API/Title/${apiKey}/${movieId}`)
          .then((movieData) => {
            // console.log(movieData.data);
            // let data = movieData.data;
            // res.render("selectedMovie", { data: data });
  
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
                  console.log('Does Exist');
                }
              })
              
            }
          })
          .catch((err) => console.error(err));
        //   let data = response.data;
        //   console.log("Movie Data:");
        //   console.log(data);
        //   res.render("selectedMovie", { data: data });
      })
      .catch((err) => console.error(err));
  
    //   axios
    //     .get(url)
    //     .then((response) => {
    //       let data = response.data;
    //       console.log("Movie Data:");
    //       console.log(data);
    //       res.render("selectedMovie", { data: data });
    //     })
    //     .catch((err) => console.error(err));
  } else {
    res.redirect('/login')
  }
});

app.post("/movie/:selected", (req, res)=>{
  const currentMovie = req.body.currentMovie;
  console.log(`Current Movie is: ${currentMovie}`);



  if(req.isAuthenticated()){
    console.log(req.user._id);
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
              res.redirect(`/movie/${currentMovie}`);
            })
            .catch((err) => console.error(err));
      
          } else{
            console.log('Does Exist and has been deleted');
            res.redirect(`/movie/${currentMovie}`);
          }
        })
      }
    })
  } else {
    res.redirect('/');
  }



  // Watchlist.findOneAndDelete({imdbID: currentMovie}, (err, result)=>{
  //   if (!result) {
  //     axios.get(`https://imdb-api.com/en/API/Title/${apiKey}/${currentMovie}`)
  //     .then((movieData)=>{

  //       const newMovie = new Watchlist({
  //         imdbID: currentMovie,
  //         movieTitle: movieData.data.title,
  //         movieGenre: movieData.data.genres,
  //         movieRating: movieData.data.imDbRating,
  //         movieReleaseYear: movieData.data.year,
  //         movieLength: movieData.data.runtimeStr,
  //         moviePoster: movieData.data.image
  //       });

  //       newMovie.save()
  //       console.log('Save to the watchlist DB');
  //       res.redirect(`/movie/${currentMovie}`);
  //     })
  //     .catch((err) => console.error(err));

  //   } else{
  //     console.log('Does Exist and has been deleted');
  //     res.redirect(`/movie/${currentMovie}`);
  //   }
  // })
})

app.get("/watchlist", (req, res) => {
  if(req.isAuthenticated()){
    User.findOne({_id: req.user._id}).populate('watchlist').exec((err, user)=>{
      console.log(user.watchlist);
      res.render("watchlist", {data: user.watchlist});
    })
    // Watchlist.find({}, (err, results)=>{
    //   if (err) {
    //       console.log(err);
    //   } else {
    //     // results.forEach(element => {
    //     //   console.log(element);
    //     // });
    //     res.render("watchlist", {data: results});
    //   }
    // })

  } else {
    res.redirect('/login');
  }


});

// app.post()

app.get("/watched", (req, res) => {
  if(req.isAuthenticated()){
    Watched.find({users: req.user._id}, (err, results)=>{
      if(err){
        console.log(err);
  
      } else {
        console.log('Watched: Results');
        console.log(results);
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
    const movieId = req.body.currentMovie;
    console.log(userReview);
    console.log(movieId);

    Watched.findOne({_id: userReview}, (err, data)=>{
      Watchlist.findOne({imdbID: data.imdbID}, (err, result)=>{
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
    console.log("currentMovie");
    console.log(currentMovie);
    const currentMovieID = req.body.currentMovie;
    console.log(`Current Movie is: ${currentMovieID}`);
  
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
        res.redirect(`/watched/${currentMovie}`);
      }
    })
  } else {
    res.redirect('/login')
  }

})

 

app.get("/addNew/:movieId", (req, res) => {
  if(req.isAuthenticated()){
    let movieId = req.params.movieId;

    User.findOne({_id: req.user._id}).populate('moviesWatched').exec((err, user)=>{
      if(err){
        console.log(err);
      }else {
        // console.log(user.moviesWatched);
        let obj = user.moviesWatched.find(found => found.imdbID === movieId)
        if(obj){
          console.log(obj);
          res.render("addReview", { data: obj });
        } else {
          console.log('not found');

          axios.get(`https://imdb-api.com/en/API/Title/${apiKey}/${movieId}`)
          .then((movieData) => {
              console.log('Not watched yet');
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
    console.log(movieId);
    // console.log(movieId);
    console.log('POST ADD NEW');
    console.log(req.user);
    /* check if movieID exists within the watched database
      if it does run the findOne and update Command if it doesn't run the insertMany Code
    */

      Watched.findOne({_id: movieId, users: req.user._id}, (err, results)=>{
        console.log('Add new Results');
        console.log(results);

        if(!results){
          console.log('Not in the DB');
          axios.get(`https://imdb-api.com/en/API/Title/${apiKey}/${movieId}`)
          .then((movieData) => {
              // console.log(movieData.data);
              let data = movieData.data;
              // res.render("addReview", { data: data });
      
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
          console.log("results");
          console.log(results);

          const userReview = 
          {
            userRating: req.body.userRating,
            userWatchedDate: req.body.dateWatched,
            userReview: req.body.userReview,
            recommended: req.body.recommend,
            rewatch: req.body.rewatch
          }

          Watched.updateOne({_id : results._id}, userReview, (err)=>{
            console.log(err);
          })
          res.redirect('/watched');
        }
      })

    // User.findOne({_id : req.user._id}).populate('moviesWatched').exec((err, user)=>{
    //   if (err) {
    //     console.log(err);
    //   } else {
    //     // if(user.moviesWatched.find((movie) => movie._id)){
    //     //   console.log(movie);
    //     // }
    //     // console.log('USER');
    //     // console.log(user);

    //     let result = Watched.find({ $where: function() { 
    //         return users == req.user._id && imdbID == movieId
    //       }
      

    //     })

    //     console.log(result);

    //     // let obj = user.moviesWatched.find(found => found.imdbID == movieId);
    //     // console.log('OBJ');
    //     // console.log(obj);

    //     // if(obj){
    //     //   console.log(obj);
    //     //   //if the movie is in the database update the fields
          
    //     //   const userReview = 
    //     //     {
    //     //       userRating: req.body.userRating,
    //     //       userWatchedDate: req.body.dateWatched,
    //     //       userReview: req.body.userReview,
    //     //       recommended: req.body.recommend,
    //     //       rewatch: req.body.rewatch
    //     //     }

    //     //     user.updateMany(userReview);
    //     //     user.save((err)=>{
    //     //       if (err) {
    //     //         console.log(err);
    //     //       } else {
    //     //         console.log('This movie has been updated');
    //     //       }
    //     //     })
            
    //     //     //      console.log('It is in the DB');
    //     //     //      Watched.findByIdAndUpdate({_id: movieId}, userReview, (err)=>{
    //     //     //        if(err){
    //     //     //          console.log(err);
    //     //     //        }
    //     //     //      });
    //     //     //      res.redirect('/watched');
    //     // } else {
    //     //   //if the movie is not in the database add it
    //     // }

    //     // console.log(user.moviesWatched);
    //     // console.log('MOVIE');
    //     // console.log(user.moviesWatched.find(movie => movie.imdbID == movieId));

    //     // axios.get(`https://imdb-api.com/en/API/Title/${apiKey}/${movieId}`)
    //     //     .then((movieData) => {
    //     //       // console.log(movieData.data);
    //     //       let data = movieData.data;
    //     //       // res.render("addReview", { data: data });
      
    //     //       const userReview = 
    //     //         {
    //     //           imdbID: req.params.movieId,
    //     //           movieTitle: movieData.data.title,
    //     //           movieGenre: movieData.data.genres,
    //     //           movieRating: movieData.data.imDbRating,
    //     //           movieReleaseYear: movieData.data.releaseDate,
    //     //           movieLength: movieData.data.runtimeStr,
    //     //           moviePoster: movieData.data.image,
    //     //           userRating: req.body.userRating,
    //     //           userWatchedDate: req.body.dateWatched,
    //     //           userReview: req.body.userReview,
    //     //           recommended: req.body.recommend,
    //     //           rewatch: req.body.rewatch,
    //     //           users: req.user._id
    //     //         }
              
    //     //       const newMovieWatched = new Watched(userReview);
    //     //       newMovieWatched.save(()=>{
    //     //         console.log('New movie watched saved to WATCHED DB');
    //     //       })
    //     //       user.moviesWatched.push(newMovieWatched)

    //     //       user.save(()=>{
    //     //         console.log('New movie watched saved to USER DB');
    //     //       })
    //     //       res.redirect('/watched');
    //     //   })
    //     //   .catch((err) => console.error(err));
    //   }

        
    //   })
  

  //   Watched.findOne({_id: movieId}, (err, result)=>{
    
  //    if(!result){
  //     console.log('Not in the DB');
  //     axios.get(`https://imdb-api.com/en/API/Title/${apiKey}/${movieId}`)
  //     .then((movieData) => {
  //         // console.log(movieData.data);
  //         let data = movieData.data;
  //         // res.render("addReview", { data: data });
  
  //         const userReview = [
  //           {imdbID: req.params.movieId,
  //           movieTitle: movieData.data.title,
  //           movieGenre: movieData.data.genres,
  //           movieRating: movieData.data.imDbRating,
  //           movieReleaseYear: movieData.data.releaseDate,
  //           movieLength: movieData.data.runtimeStr,
  //           moviePoster: movieData.data.image,
  //           userRating: req.body.userRating,
  //           userWatchedDate: req.body.dateWatched,
  //           userReview: req.body.userReview,
  //           recommended: req.body.recommend,
  //           rewatch: req.body.rewatch
  //           }
  //         ]
  
  //         Watched.insertMany(userReview, (err, docs)=>{
  //           if (err) {
  //             console.log(err);
  //           } else {
  //             console.log('Watched: Docs');
  //             console.log(docs);  
  //             res.redirect('/watched');
  //           }
  //         })
  //     })
  //     .catch((err) => console.error(err));
  
  //    } else {
  //       const userReview = 
  //         {
  //           userRating: req.body.userRating,
  //           userWatchedDate: req.body.dateWatched,
  //           userReview: req.body.userReview,
  //           recommended: req.body.recommend,
  //           rewatch: req.body.rewatch
  //         }
  
  //      console.log('It is in the DB');
  //      Watched.findByIdAndUpdate({_id: movieId}, userReview, (err)=>{
  //        if(err){
  //          console.log(err);
  //        }
  //      });
  //      res.redirect('/watched');
  //    }
  
  //  })

  } else {
    res.redirect('/login')
  }
})

app.get('/account', (req, res)=>{
  if(req.isAuthenticated()){
    res.render('account');
  } else {
    res.redirect('/login')
  }
})

app.listen(process.env.PORT || 3000, () => {
  console.log("Server has started...");
});

/*
    Call tmdb api for coming soon and in theatres
    once clicked on an option
    call the external ids api to retrieve IMDB api

    use imdb api to retrieve movie details for the selected
    movie page

*/

// if(req.isAuthenticated()){

// } else {
//   res.redirect('/login') 
// }