const express = require('express');
const https = require('https')
const axios = require('axios');
const ejs = require('ejs');
const app = express();
const apiKey = "k_7893g9qe";
const apikeyTMDB = '16c3a911dbc1dfc97fc092d38dba2b03';
// const moviePoster = require(__dirname + '/public/javascript/getPosters.js')
// let data = moviePoster();

app.set('view engine', 'ejs');

//retrieve form data : req.body.data
app.use(express.urlencoded({extended: true}));
//locate static files in the public folder
app.use(express.static('public'))
// app.use('/css', express.static(__dirname + '/node_modules/@glidejs/glide/dist/css'))
app.use('/dist', express.static(__dirname + '/node_modules/@glidejs/glide/dist/'))


app.get('/', (req, res)=>{
    
    /* WORKING API CALL FOR LOW QUALITY POSTERS */

    const comingSoon = axios.get(`https://api.themoviedb.org/3/movie/upcoming?api_key=${apikeyTMDB}&language=en-US&page=1&region=US`);
    const inTheatres = axios.get(`https://api.themoviedb.org/3/movie/now_playing?api_key=${apikeyTMDB}&language=en-US&page=1`);

    axios.all([comingSoon, inTheatres])
        .then(
            axios.spread((...responses) => {
                const comingSoonData = responses[0];
                const inTheatresData = responses[1];

                console.log(comingSoonData.data, inTheatresData.data);

                res.render('home', {comingSoon : comingSoonData.data.results, theatres: inTheatresData.data.results})
            })
        )
        .catch(errors => {
            console.error(errors)
        })
})

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

app.get('/home/:option', (req, res)=> {
    let pageOption = req.params.option;

    if(pageOption == 'comingSoon'){
    let title = 'Coming Soon';
    const url = `https://api.themoviedb.org/3/movie/upcoming?api_key=${apikeyTMDB}&language=en-US&region=US`;

    axios.get(url)
        .then((response)=>{
            let data = response.data;
            console.log('Coming Soon:');
            console.log(data);
            res.render('homeOptions', {data: data.results, title: title})
        })
        .catch(err => console.error(err));

    } else if(pageOption == 'inTheatres') {
        let title = 'In Theatres';
        const url = `https://api.themoviedb.org/3/movie/now_playing?api_key=${apikeyTMDB}&language=en-US&region=US`;
    
        // let totalPages = data;

        // axios.get(url)
        //     .then((response)=>{
        //         let data = response.data;
        //         console.log('In Theatres:');

        //         totalPages = data.totalPages;

        //         // for (let i = 0; index < totalPages; index++) {
               
                    
        //         // }
        //         res.render('homeOptions', {data: data.results, title:title})
        //     })
        //     .catch(err => console.error(err));

            // console.log(totalPages);

            async function getUser() {
                try {
                  const response = await axios.get(url);
                  let data = response.data;
                  console.log(data.total_pages)
                  return data.total_pages;
                } catch (error) {
                  console.error(error);
                }
              }

            getUser()
                .then(data =>{
                    console.log('inside get user');
                    console.log(data);
                    return getPageData(data)
                    // async function getPageData() {
                    //     let pagesData = [];

                    //     for (let index = 1; index < data; index++) {
                    //         try {
                    //             const response = await axios.get(`https://api.themoviedb.org/3/movie/now_playing?api_key=${apikeyTMDB}&language=en-US&page=${index}region=US`);
      
                    //             let data = response.data;
                    //             pagesData.push(data);
                    //             // console.log(data.total_pages)
                    //             // return data.total_pages;
                    //           } catch (error) {
                    //             console.error(error);
                    //           }
                    //     }
                    //     return pagesData;
                    //   }   


                })  
                .catch(err => console.log(err))

                async function getPageData(data) {
                    let pagesDataArr = [];

                    for (let i = 0; i < 3; i++) {
                        let pageData = axios.get(`https://api.themoviedb.org/3/movie/now_playing?api_key=${apikeyTMDB}&language=en-US&page=${i}region=US`);
                        pagesDataArr[i] = pageData;
                        
                    }


                    axios.all(pagesDataArr)
                    .then(
                        axios.spread((...responses) => {
                            let data = [];
                            responses.forEach(element => {
                                // console.log(element.data)
                                data.push(element.data.results);
                            });

                            // console.log(data[0])
                            // console.log(typeof data)
                            // const comingSoonData = responses[0];
                            // const inTheatresData = responses[1];
            
                            // console.log(comingSoonData.data, inTheatresData.data);
            
                            res.render('homeOptions', {data: data, title:title})
                            //     })
                        })
                    )
                    .catch(errors => {
                        console.error(errors)
                    })

                    // try {
                    //     console.log('Inside get page data function')
                    //     console.log(data);
                    //   return data;
                    // } catch (error) {
                    //   console.error(error);
                    // }
                  }

            //for each object store in array
            // getPageData()
            //     .then(data => {
            //         console.log('Inside get page data')
            //         console.log(data);
            //     })
            //     .catch(err => console.log(err))


            //   console.log(totalPages);

        // axios.get(url)
        //     .then((response)=>{
        //         let data = response.data;
        //         console.log('In Theatres:');
        //         console.log(data.total_pages);
        //         res.render('homeOptions', {data: data.results, title:title})
        //     })
        //     .catch(err => console.error(err));
    }

    // res.render('homeOptions', {title : title});
})

app.get('/search', (req, res)=>{
    res.render('search')
})

app.get('/search/:option', (req, res)=>{
    let option = req.params.option;
    res.render('searchOptions', {option : option});
})

app.get('/movie/:selected', (req, res)=>{
    let selectedId = req.params.selected;

    const apiKey = "k_7893g9qe"
    const url = `https://imdb-api.com/en/API/Title/${apiKey}/${selectedId}`;

    axios.get(url)
        .then((response)=>{
            let data = response.data;
            console.log('Movie Data:');
            console.log(data);
            res.render('selectedMovie', {data: data})
        })
        .catch(err => console.error(err));

    
});

app.get('/watchlist', (req, res)=>{
    res.render('watchlist')
});

app.get('/watched', (req, res)=>{
    res.render('watched')
});

app.get('/addNew', (req, res)=>{
    res.render()
})



app.listen(process.env.PORT || 3000, ()=>{
    console.log('Server has started...')
})

/*
    Call tmdb api for coming soon and in theatres
    once clicked on an option
    call the external ids api to retrieve IMDB api

    use imdb api to retrieve movie details for the selected
    movie page

*/