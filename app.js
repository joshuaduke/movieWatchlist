const express = require('express');
const https = require('https')
const ejs = require('ejs');
const app = express();

app.set('view engine', 'ejs');

//retrieve form data : req.body.data
app.use(express.urlencoded({extended: true}));
//locate static files in the public folder
app.use(express.static('public'))
// app.use('/css', express.static(__dirname + '/node_modules/@glidejs/glide/dist/css'))
app.use('/dist', express.static(__dirname + '/node_modules/@glidejs/glide/dist/'))

app.get('/', (req, res)=>{
    const apiKey = "k_7893g9qe"
    const url = `https://imdb-api.com/en/API/ComingSoon/${apiKey}`;

    // let comingSoonData = ''

    // https.get(url, (response)=>{
    //     response.on('data', (data)=>{
    //         comingSoonData += data;
    //     });

    //     response.on('end', ()=>{
    //         console.log(comingSoonData);
    //         comingSoonData = JSON.parse(comingSoonData)
    //         console.log(comingSoonData);
            
    //         res.render('home', {data : comingSoonData.item});
    //     })
        
    // }).on('error', (err)=>{
    //     console.log("ERROR" + err.message);
    // })

    let comingSoonData = '';

    https.get(url, (response)=>{
        response.on('data', (data)=>{
            comingSoonData += data;
        });

        response.on('end', ()=>{
            // console.log(comingSoonData);
            let data = JSON.parse(comingSoonData)
            console.log(typeof data);
            
            res.render('home', {data : data.items});
        })
        
    }).on('error', (err)=>{
        console.log("ERROR" + err.message);
    })

    // let data = [true, false]
    // res.render('home', {data: data})
})

app.get('/:option', (req, res)=> {
    let title = req.params.option;
    res.render('homeOptions', {title : title});
})

app.get('/search', (req, res)=>{
    res.render('search')
})




app.listen(process.env.PORT || 3000, ()=>{
    console.log('Server has started...')
})