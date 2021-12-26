if("serviceWorker" in navigator){
    navigator.serviceWorker.register("./service-worker.js").then(registration =>{
        console.log("SW Registered! ");
        console.log(registration);
    }).catch(err => {
        console.log("SW registration failed");
        console.log(err);
        console.log(window.location.href);
        var script = document.currentScript;
        var fullUrl = script.src;
        console.log(fullUrl);
    })
}