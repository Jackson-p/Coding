const fetch = require('node-fetch')

fetch("https://api.github.com/repos/Jackson-p/Jackson-p.github.io/issues").then(res => res.json()).then(data => console.log(data))
