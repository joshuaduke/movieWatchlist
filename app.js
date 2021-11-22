const express = require("express");
const https = require("https");
const axios = require("axios");
const ejs = require("ejs");
const app = express();
const apiKey = "k_7893g9qe";
const apikeyTMDB = "16c3a911dbc1dfc97fc092d38dba2b03";
// const moviePoster = require(__dirname + '/public/javascript/getPosters.js')
// let data = moviePoster();

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

app.get("/", (req, res) => {
  /* WORKING API CALL FOR LOW QUALITY POSTERS */

  const comingSoon = axios.get(
    `https://api.themoviedb.org/3/movie/upcoming?api_key=${apikeyTMDB}&language=en-US&page=1&region=US`
  );
  const inTheatres = axios.get(
    `https://api.themoviedb.org/3/movie/now_playing?api_key=${apikeyTMDB}&language=en-US&page=1`
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
});

// app.get('/', (req, res)=>{

//     /* WORKING API CALL FOR LOW QUALITY POSTERS */

//     const comingSoon = axios.get(`https://imdb-api.com/en/API/ComingSoon/${apiKey}`);
//     const inTheatres = axios.get(`https://imdb-api.com/en/API/InTheaters/${apiKey}`);

//     axios.all([comingSoon, inTheatres])
//         .then(
//             axios.spread((...responses) => {
//                 const comingSoonData = responses[0];
//                 const inTheatresData = responses[1];

//                 console.log(comingSoonData.data, inTheatresData.data);

//                 res.render('home', {comingSoon : comingSoonData.data.items, theatres: inTheatresData.data.items})
//             })
//         )
//         .catch(errors => {
//             console.error(errors)
//         })
// })

app.get("/home/:option", (req, res) => {
  let pageOption = req.params.option;

  if (pageOption == "comingSoon") {
    let title = "Coming Soon";
    const url = `https://api.themoviedb.org/3/movie/upcoming?api_key=${apikeyTMDB}&language=en-US&region=US`;

    axios
      .get(url)
      .then((response) => {
        let data = response.data;
        console.log("Coming Soon:");
        console.log(data);
        res.render("homeOptions", { data: data.results, title: title });
      })
      .catch((err) => console.error(err));
  } else if (pageOption == "inTheatres") {
    let title = "In Theatres";
    const url = `https://api.themoviedb.org/3/movie/now_playing?api_key=${apikeyTMDB}&language=en-US&region=US`;

    async function getUser() {
      try {
        const response = await axios.get(url);
        let data = response.data;
        console.log(data.total_pages);
        return data.total_pages;
      } catch (error) {
        console.error(error);
      }
    }

    getUser()
      .then((data) => {
        console.log("inside get user");
        console.log(data);
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
          `https://api.themoviedb.org/3/movie/now_playing?api_key=${apikeyTMDB}&language=en-US&page=${page}region=US`
        );
        page++;
        pagesDataArr[i] = pageData;
      }

      console.log("Pages data");
      pagesDataArr.forEach((element) => {
        console.log(element);
      });

      axios
        .all(pagesDataArr)
        .then(
          axios.spread((...responses) => {
            let data = [];
            console.log(responses[0].data);
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
  }
});

app.get("/search", (req, res) => {
  let data = false;
  let inputvalue = "";
  res.render("search", {
    searchedData: false,
    data: data,
    inputvalue: inputvalue,
  });
});

app.post("/search", (req, res) => {
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

  // axios.get(urlTMDB)
  //     .then( (response) =>{
  //         let data = response.data;
  //         // console.log(data);
  //         res.render('search', {searchedData: data, data : true , inputvalue: searchedValue})
  //     })
});

app.get("/search/:option", (req, res) => {
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
});

app.get("/movie/:selected", (req, res) => {
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
          console.log(movieData.data);
          // let data = movieData.data;
          // res.render("selectedMovie", { data: data });

          if (movieData.data.title == null) {
            console.log("No information on this is available");
            res.redirect("/search");
          } else {
            let data = movieData.data;
            res.render("selectedMovie", { data: data });
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
});

app.get("/watchlist", (req, res) => {
  res.render("watchlist");
});

app.get("/watched", (req, res) => {
  res.render("watched");
});

app.get("/addNew", (req, res) => {
  res.render('addReview');
});

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
