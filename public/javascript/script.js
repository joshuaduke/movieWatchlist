if("serviceWorker" in navigator){
    navigator.serviceWorker.register("https://moviepwa.herokuapp.com/service-worker.js").then(registration =>{
        console.log("SW Registered! ");
        console.log(registration);
    }).catch(err => {
        console.log("SW registration failed");
        console.log(err);
    })
}