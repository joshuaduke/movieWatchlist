const express = require('express');
const https = require('https')
const ejs = require('ejs');
const app = express();

app.set('view engine', 'ejs');

//retrieve form data : req.body.data
app.use(express.urlencoded({extended: true}));
//locate static files in the public folder
app.use(express.static('public'))

app.get('/', (req, res)=>{
    res.render('home')
})




app.listen(process.env.PORT || 3000, ()=>{
    console.log('Server has started...')
})