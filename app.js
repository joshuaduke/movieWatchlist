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
    res.render('home')
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