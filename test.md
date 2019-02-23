# PWA尝试

通过service-worker技术来实现网站离线缓存，也就是离线状态下同样可以访问或者说加快浏览速度？这个应该在cache-first和net-first之间有一个取舍。我们这里取google的workbox3来研究研究。

## 基础鼓捣

因为时间问题，我在这里也只是记录了一下。通过官网的入门学习，差不多写下了如下的基础代码。

先建立一个html文件。。。

```HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
</head>
<body>
    <script>
        if('serviceWorker' in navigator){
            window.addEventListener('load', () =>{
                navigator.serviceWorker.register('/sw.js');
            });
        }
        var mes = document.createElement('div');
        mes.style.color = "blue";
        mes.innerHTML = "Brelly liaoliao";
        document.body.append(mes);    
    </script>
    <script src="https://cdn.bootcss.com/lodash.js/4.17.12-pre/lodash.min.js"></script>
    <script>
      try{
         var testa = new Array(5);
         _.fill(testa, 1);
         console.log(testa);
      }catch(e){
        console.log(e);
      }
      //console.log("为啥每次都要清除历史记录啊1111")
    </script>
</body>
</html>
```

然后由官网可见，在注册service-worker的时候是通过一个js来注册的（或者说worker其实都是这样），所以在同级目录下我们写了一个sw.js

```js
importScripts('https://storage.googleapis.com/workbox-cdn/releases/3.6.1/workbox-sw.js');

if (workbox) {
  console.log(`Yay! Workbox is loaded 🎉`);
} else {
  console.log(`Boo! Workbox didn't load 😬`);
}
workbox.routing.registerRoute(
    new RegExp('.*\.js'),
    workbox.strategies.networkFirst()
);
```

然后说一下这个小测试的效果。用node包的http-server工具，通过本地服务器打开html文件之后，没啥问题的话是可以看到一行蓝字的，开发者工具里看Application就能看到现在注册的这个service-worker了，同时呢，又测试了一个比较简单的资源请求后缓存的功能。即registerRoute函数，它里面的意思就是当这个页面发起对js文件的请求时，service-worker会采用networkFirst的方式把它先存起来，这样以后离线的时候会先尝试网络，网络不通请求不到就会用worker里面提供的缓存（通过Application的cache里面能看到）


紧接着说明一个问题service-worker初学者（没错就是我）在写一些demo的时候，worker是很顽固的，有些时候我们改了index.html里的内容（比如取消html文件里注释的那一行），通过http-server再打开的时候，控制台没有对应的新输出，看下source发现代码并没有发生变化，这便是因为浏览器读取了之前的worker，这里有两种解决办法。

1、Application里的Clear storage + 浏览器清除历史记录

2、在已经打开网址的情况下，右击刷新按钮，清除缓存并重新硬启动

## 离线缓存？

其实细心的读者如意发现，刚才的html页面，如果我们把http-server关停刷新，是无法显示页面的，那么我们说好的离线缓存呢？我们刚才只是注册了service-worker，缓存了worker及请求信息等，并没有缓存这个html文件等。

按照官网的指示，一般搭建这样的一个应用是需要通过几个工具的，这里因为用webpack比较多，就研究webpack了。webpack官方给出了相关的配置的方法。在webpack中引入配置

```js
new WorkboxPlugin.GenerateSW({
    clientsClaim: true,
    skipWaiting: true
})
```

主js加入注册代码

```js
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js').then(registration => {
            console.log('SW registered: ', registration);
        }).catch(registrationError => {
            console.log('SW registration failed: ', registrationError);
        });
    });
}
```

因为写法总是会变化的，所以这里不细写，可以看官网。但是我们可以看看执行npm run build之后的dist文件夹里面，生成了service-worker.js和precache-manifest...../js文件，其实就是注册和缓存表两部分。

service-worker.js

```js
/**
 * Welcome to your Workbox-powered service worker!
 *
 * You'll need to register this file in your web app and you should
 * disable HTTP caching for this file too.
 * See https://goo.gl/nhQhGp
 *
 * The rest of the code is auto-generated. Please don't update this file
 * directly; instead, make changes to your Workbox build configuration
 * and re-run your build process.
 * See https://goo.gl/2aRDsh
 */

importScripts("https://storage.googleapis.com/workbox-cdn/releases/3.6.3/workbox-sw.js");

importScripts(
  "precache-manifest.0e059b408ac2ab2da52b7881ce011bb1.js"
);

workbox.skipWaiting();
workbox.clientsClaim();

/**
 * The workboxSW.precacheAndRoute() method efficiently caches and responds to
 * requests for URLs in the manifest.
 * See https://goo.gl/S9QRab
 */
self.__precacheManifest = [].concat(self.__precacheManifest || []);
workbox.precaching.suppressWarnings();
workbox.precaching.precacheAndRoute(self.__precacheManifest, {});

```

precache-manifest....js

```js
self.__precacheManifest = [
  {
    "revision": "867bb95d610fbaeec18b",
    "url": "print.bundle.js"
  },
  {
    "revision": "4e051cefff5301973505fa2026506a82",
    "url": "index.html"
  },
  {
    "revision": "50e77b7526d6f4173beb",
    "url": "app.bundle.js"
  }
];
```

好，那么我们想实现离线应用的入口就是webpack了，接着探索。。。。。

