const express = require('express');
const https = require('https')
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
    const url = `https://imdb-api.com/en/API/ComingSoon/${apiKey}`;

    let comingSoonData = '';

    // https.get(url, (response)=>{
    //     response.on('data', (data)=>{
    //         comingSoonData += data;
    //     });

    //     response.on('end', ()=>{
    //         // console.log(comingSoonData);
    //         let data = JSON.parse(comingSoonData)
    //         console.log(typeof data);
            
    //         res.render('home', {data : data.items});
    //     })
        
    // }).on('error', (err)=>{
    //     console.log("ERROR" + err.message);
    // })

    //API CALL FOR HIGH QUALITY PICTURES
    // let data = moviePoster();

    // console.log('Task 1: ')
    // console.log(data)
    res.render('home')
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
    let selected = req.params.option;
    res.render('selectedMovie');
})



app.listen(process.env.PORT || 3000, ()=>{
    console.log('Server has started...')
})