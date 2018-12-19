var total = 60000;
var interval = 1000;
var t = setInterval(function(){
    total -= interval;
    postMessage(total/1000);
    if(t <= 0){
        clearInterval(t);
        return;
    }
},1000)