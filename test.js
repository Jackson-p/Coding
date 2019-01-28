//circles-0
//写一个可以中途abort的promise
const fetch = require('node/node_modules/node-fetch')

const makepromiseCanceler = (promise) => {
    let hascanceled = false
    const wrappedpromise = new Promise((resolve, reject) =>{
        promise.then((val) => {
            hascanceled?reject({hascanceled:true}): resolve(val)
        })
        promise.catch((err) => {
            hascanceled?reject({hascanceled:true}):reject(err)
        })
    })
    return {
        promise: wrappedpromise,
        cancel(){
            hascanceled = true
        }
    }
}

const miniFetch = fetch('https://www.baidu.com/search/error.html').then((res) =>{
    console.log(res.text())
})
miniFetch()