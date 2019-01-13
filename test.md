# React-blog在webpack上的优化

其实就是自己写的这个个人网站加载起来实在是有一些慢的，核心应该就是webpack打包的bundle.js实在是太大了。webpack4.0生产者模式自带代码压缩的情况下，还有2.5M，再加上从gitpage请求资源本就稍慢真的是。。。。

## 先拆包

我先想的就是这样一个bundle.js首先需要有一个分析的工具，看看各个包哪个占的地方相对比较大。而查阅官网指南后大体上发现了工具和解决的思路。

### 分析工具

官网推荐的webpack-bundle-analyzer

安装:

```js
npm install --save-dev webpack-bundle-analyzer
```

webpack配置：

```js
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
 
module.exports = {
    plugins: [new BundleAnalyzerPlugin()]
}
```

可配置对象参数：

```js
new BundleAnalyzerPlugin({
  //  可以是`server`，`static`或`disabled`。
  //  在`server`模式下，分析器将启动HTTP服务器来显示软件包报告。
  //  在“静态”模式下，会生成带有报告的单个HTML文件。
  //  在`disabled`模式下，你可以使用这个插件来将`generateStatsFile`设置为`true`来生成Webpack Stats JSON文件。
  analyzerMode: 'server',
  //  将在“服务器”模式下使用的主机启动HTTP服务器。
  analyzerHost: '127.0.0.1',
  //  将在“服务器”模式下使用的端口启动HTTP服务器。
  analyzerPort: 8888, 
  //  路径捆绑，将在`static`模式下生成的报告文件。
  //  相对于捆绑输出目录。
  reportFilename: 'report.html',
  //  模块大小默认显示在报告中。
  //  应该是`stat`，`parsed`或者`gzip`中的一个。
  //  有关更多信息，请参见“定义”一节。
  defaultSizes: 'parsed',
  //  在默认浏览器中自动打开报告
  openAnalyzer: true,
  //  如果为true，则Webpack Stats JSON文件将在bundle输出目录中生成
  generateStatsFile: false, 
  //  如果`generateStatsFile`为`true`，将会生成Webpack Stats JSON文件的名字。
  //  相对于捆绑输出目录。
  statsFilename: 'stats.json',
  //  stats.toJson（）方法的选项。
  //  例如，您可以使用`source：false`选项排除统计文件中模块的来源。
  //  在这里查看更多选项：https：  //github.com/webpack/webpack/blob/webpack-1/lib/Stats.js#L21
  statsOptions: null,
  logLevel: 'info' 日志级别。可以是'信息'，'警告'，'错误'或'沉默'。
})

```

看了之后大体心里有数了，有以下几个想法来搞

* cdn外部引入,external
* 按需加载不引入整块(如antd)
* split coding : vendor公共模块 and splitChunks
* tree shaking
* 各种细节插件处理比如ModuleConcatenationPlugin

因为流程中bundle.js的减少体积忘记录了，只有个大概值

#### external

这个是官网上提供的分离静态库的一种方法，一开始我想的是把React、React-dom、React-router-dom等全都分发到cdn或者本地上，但后来发现这样在分离前三者的时候会有问题（尚未解决），所以主要分离了marked、highlight、axios等也占有比较大体积的库到cdn上（同时也保存了对应版本的代码到本地）分出去这些库就已经少了几百k了，剩下的React相关库在一系列treeshaking等优化之后其实只占90多k，到后期再看看怎么把React三者也弄到external上，这样还能减少90多k。

写法上比较简单，在entry同级加入

```js
externals:{
        axios: 'axios',
        highlight: 'hljs',
        marked: 'marked'
        // ,
        // react: 'react',
        // ReactDOM: 'react-dom',
        // ReactRouter: 'react-router-dom'
}
```

然后在html文件中通过script标签引入和你package.json中同样版本库的cdn就可以了（bootcdn）。

* 补充：这里要注意下的是externals的含义，属性代表着项目工程中引入的包的名如：

```js
import hljs from 'hightlight'
```

而右侧的值则填写这个库所暴露出的模块名

#### 按需加载

人们常提到的，只用人家一个函数却硬生生拉进来一个库。比如

```js
should
import _ from 'lodash/core'
not
import _ from 'lodash'
```

然而这个功能我在这里并没有用得很好，其实也是一个可改进的空间，只是不会改了，于是照着antd的官方指引

```js
["import", { "libraryName": "antd", "libraryDirectory": "es", "style": "css" }]
```

实现按需加载，也就是不用再import antd/antd.css这种行为了。。。。这样一来有小了几百k

#### split coding

其实核心意思就是把业务代码和库代码实现分离，看过以前一个文章，一个饿了么大佬专门讲了如何合理分离，而现在webpack4已经自己实现了。。。。因为前面并未把React三者的库提出去，所以保留在了依赖库中

```js
optimization: {
    splitChunks: {
        cacheGroups: {
            vendor: {
              // 抽离第三方插件
              test: /node_modules/, // 指定是node_modules下的第三方包
              chunks: 'initial',
              name: 'vendor', // 打包后的文件名，任意命名
              // 设置优先级，防止和自定义的公共代码提取时被覆盖，不进行打包
              priority: 10
            }
        }
	}
}
```

这样一提emmmm，少了50多k。

#### tree shaking

也是官网提到的尽量清除没有用到的代码,也就是dead code 。官网说得很清除，因为他总会变，这里就不贴了，我这个版本的几个步骤就是

* import的引入方式（es6)
* mode:production
* package.json中sideEffects:[*.css],注意css是有副作用的（全局）
* 禁止Babel将ES6编译到CommonJS：在babel-presets部分设置"modules":false,我的配置

```js
.babelrc中
"presets": [
    ["es2015",{"modules":false}],"react"
],
```
减完之后又少了100多k

#### 各种细节插件处理比如ModuleConcatenationPlugin

字面意思，treeshaking也有提到过这个插件，所以正好也用了，核心原理应该就是把多个闭包中的可整合内容整合到同一个闭包中了

plugin中加入

```js
new webpack.optimize.ModuleConcatenationPlugin()
```

## 再考虑ie兼容性

用ie访问的时候一片空白，连个报错都没有。。。。。打开bundle.js后发现尚有Promise，这个ie可是看不懂的。。。。能引入这个的肯定就是axios了。。。。所以需要polyfill。babel-ployfill又大，又污染全局变量，是造了整个的一个环境，所以这里用babel-runtime来进行分散的polyfill,缺点是不能转码实例方法（因为不动原型链），所以"liaoliao".laugh()这样的不可以。然后和这个配套使用的还有一个配件babel-plugin-transform-runtime来完成自动转化。

```js
 npm install --save-dev babel-plugin-transform-runtime
 npm install --save babel-runtime
```
写入.babelrc

```js
{
  "plugins": ["transform-runtime"]
}
```

光是这样还没有解决问题，为啥呢？因为babel这个ployfill是在webpack打包时调用的，我们并没有明确地"抛出"Promise,他只是包在axios里的，所以打包时未被解析。于是通过

```js
window.Promise = Promise
```

让他被解析出来。

ps:在ie上还碰到过图片不识别显示的奇葩问题，把图片后缀从png改成jpg就好了，可能ie不太识别png。。。吧

参考过的网址：

[大全1](https://blog.csdn.net/weixin_40817115/article/details/80992301)

[大全2](https://www.jianshu.com/p/a64735eb0e2b)

[大全3](https://blog.csdn.net/fortunegrant/article/details/79534790)

[高端地引入所需包的固定内容](https://www.cnblogs.com/vajoy/p/5225843.html)

[避免重复使用相同代码的打包](https://segmentfault.com/q/1010000011198549/a-1020000011286950)

[按需加载之babel](https://segmentfault.com/q/1010000007998999)

[兼容](https://blog.csdn.net/qq_39985511/article/details/80887041)

[webpack全面配置](https://juejin.im/post/5bb089e86fb9a05cd84935d0)

[tree shaking](https://juejin.im/post/5b7381c0f265da27dd66c6fd)

[Promise的抛出](http://www.php.cn/js-tutorial-380204.html)

[babel-runtime解决兼容性](http://www.mamicode.com/info-detail-2289719.html)

[babel-runtime解决兼容性2](https://www.jianshu.com/p/a16a34eb597e)

