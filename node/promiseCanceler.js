const fetch = require('node-fetch')

fetch(`https://api.github.com/search/issues?q=+state:open+repo:bingoogolapple/bingoogolapple.github.io+label:设计模式&sort=created&order=desc&page=1&per_page=6`).then(res => res.json()).then(data => console.log(data))
