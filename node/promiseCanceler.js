//circles-0
//写一个可以中途abort的promise
const fetch = require('node-fetch')

const makepromiseCanceler = (promise) => {
    let hascanceled = false
    const wrappedpromise = new Promise((resolve, reject) =>{
        promise.then((val) => {
            hascanceled? reject({hascanceled:true}): resolve(val)
        })
        promise.catch((err) => {
            hascanceled? reject({hascanceled:true}):reject(err)
        })
    }).catch(ans => console.log(ans))
    return {
        promise: wrappedpromise,
        cancel(){
            hascanceled = true
        }
    }
}

const miniFetch = fetch('https://www.baidu.com/search/error.html')
//miniFetch()
cancelableFetch = makepromiseCanceler(miniFetch)
function sendcancelableFetch(){
    cancelableFetch.promise.then((val) => {
        if(typeof(val) !== "undefined"){
            console.log(val.status)
        }
    }).catch(ans => console.log(ans))
}
setTimeout(sendcancelableFetch, 1000)
//cancelableFetch.cancel()
