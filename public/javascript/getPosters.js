const https = require('https');

module.exports = getIds;
/*
    call the coming soon api
    retrieve IDs for each item and store in an movieids array

    for each movie in the array call poster api 
    store link and id attribute as an object in another array
    return final array

*/
const apiKey = "k_7893g9qe"

function getPosters(ids){

    console.log("IDS")
    console.log(ids)
    var movieItem = [];

    ids.forEach(element => {
        // console.log(`Get posters element: ${element}`)
        posterUrl = `https://imdb-api.com/en/API/Posters/${apiKey}/${element}`;
        let posterData = '';

        https.get(posterUrl, (response)=>{
            response.on('data', (data)=>{
                posterData += data;
            });
    
            response.on('end', ()=>{
                let data = JSON.parse(posterData)
                // console.log('DATA');
                // console.log(data);

                if(typeof data.posters[0] == 'undefined'){
                    console.log('undefined')
                } else{
                    let obj = 
                    {
                        id: data.imDbId,
                        image: data.posters[0].link,
                    }

                    console.log('Task 2');
                    console.log(obj)
                    movieItem.push(obj);

                    console.log('TASK 3');
                    console.log(movieItem);
                    movieItem.push(obj);

                }
            })
            
        }).on('error', (err)=>{
            console.log("ERROR" + err.message);
        })
    });

    // posterUrl = `https://imdb-api.com/en/API/Posters/${apiKey}/tt11214590`;
    //     let posterData = '';

    //     https.get(posterUrl, (response)=>{
    //         response.on('data', (data)=>{
    //             posterData += data;
    //         });
    
    //         response.on('end', ()=>{
    //             let data = JSON.parse(posterData)
    //             // console.log('DATA');
    //             // console.log(data);

    //             if(typeof data.posters[0] == 'undefined'){
    //                 console.log('undefined')
    //             } else{
    //                 let obj = 
    //                 {
    //                     id: data.imDbId,
    //                     img: data.posters[0].link,
    //                 }

    //                 console.log('Task 2');
    //                 console.log(obj)
    //                 movieItem.push(obj);

    //                 console.log('TASK 3');
    //                 console.log(movieItem);
    //             }
    //         })
            
    //     }).on('error', (err)=>{
    //         console.log("ERROR" + err.message);
    //     })

        console.log('TASK 5');
        console.log(movieItem);
        return movieItem;
}

function getIds(){
    const url = `https://imdb-api.com/en/API/ComingSoon/${apiKey}`;

    let movieIds = [];

    let comingSoonData = '';

    //call coming soon api
    https.get(url, (response)=>{
        response.on('data', (data)=>{
            comingSoonData += data;
        });

        response.on('end', ()=>{
            // console.log(comingSoonData);
            let data = JSON.parse(comingSoonData)

            data.items.forEach(element => {
                //push ids into the movie ids array
                movieIds.push(element.id)
            });

            // console.log(typeof data);
            console.log('movie ids')
            console.log(movieIds);
            return getPosters(movieIds);
            // posters = getPosters(movieIds);
            // console.log('Task 4');
            // console.log(posters);
        })
        
    }).on('error', (err)=>{
        console.log("ERROR" + err.message);
    })

    console.log('movie ids x2')
    console.log(movieIds);

}

//returns undefined