const express = require('express');
const https = require('https')
const axios = require('axios');
const ejs = require('ejs');
const app = express();

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
    const apiKey = "k_7893g9qe"
    const comingSoon = axios.get(`https://imdb-api.com/en/API/ComingSoon/${apiKey}`);
    const inTheatres = axios.get(`https://imdb-api.com/en/API/InTheaters/${apiKey}`);

    axios.all([comingSoon, inTheatres])
        .then(
            axios.spread((...responses) => {
                const comingSoonData = responses[0];
                const inTheatresData = responses[1];

                console.log(comingSoonData.data, inTheatresData.data);

                res.render('home', {comingSoon : comingSoonData.data.items, theatres: inTheatresData.data.items})
            })
        )
        .catch(errors => {
            console.error(errors)
        })

    // const url = `https://imdb-api.com/en/API/ComingSoon/${apiKey}`;

    // let comingSoonData = '';

    // https.get(url, (response)=>{
    //     response.on('data', (data)=>{
    //         comingSoonData += data;
    //     });

    //     response.on('end', ()=>{
    //         // console.log(comingSoonData);
    //         let data = JSON.parse(comingSoonData)
    //         // console.log(data);
            
    //         res.render('home', {data : data.items});
    //     })
        
    // }).on('error', (err)=>{
    //     console.log("ERROR" + err.message);
    // })

    //API CALL FOR HIGH QUALITY PICTURES
    // let data = moviePoster();

    // console.log('Task 1: ')
    // console.log(data)
    // res.render('home')
})

app.get('/home/:option', (req, res)=> {
    let title = req.params.option;
    res.render('homeOptions', {title : title});
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

    let movieData = '';

    https.get(url, (response)=>{
        response.on('data', (data)=>{
            movieData += data;
        });

        response.on('end', ()=>{
            // console.log(movieData);
            let data = JSON.parse(movieData)
            console.log(data);
            
            res.render('selectedMovie', {data : data});
        })
        
    }).on('error', (err)=>{
        console.log("ERROR" + err.message);
    })
    // res.render('selectedMovie');
});

app.get('/watchlist', (req, res)=>{
    res.render('watchlist')
});

app.get('/watched', (req, res)=>{
    res.render('watched')
});



app.listen(process.env.PORT || 3000, ()=>{
    console.log('Server has started...')
})