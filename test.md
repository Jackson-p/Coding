# ES5 实现const

## 有关于node环境中的this问题

事实证明，浏览器环境下全局this就是windows；而对于node.js环境，全局的this是空对象，实际上指代的是module.exports.而函数中或者说我们比较期待的那个this（姑且认为是nodejs运行环境？其实指的是global)

```js
this.a = 3;
console.log(this);
console.log(global.a);
function liao(){
    this.a = 4;
    console.log(global.a);
}
liao();
```

## Object.defineProperty来实现

其实这里还是拿windows环境来做测试的好。。。不过用nodejs也算学到了知识23333

```js
//这里这个有意思了，也学习到了在node环境下是没有window的
var __const = function __const(variable, value){
    if(typeof(window) === "undefined"){ // 这里的判定注意下
        console.log('运行在node环境下')
        var window = global;
        window.variable = value; //注意这里是挂载变量，不是挂载值
    }
    Object.defineProperty(window, variable, {
        /*
            这里补充一点关于js对象内置属性的知识
            https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty
        */
        enumerable:true,
        configurable:false,
        // writable:true,//这里神了，虽然默认是false，但这里无论加的是writable:true还是writable:false都会报错
        get:function(){
            return value;
        },
        set:function(newval){
            if(newval != value){
                throw new TypeError('brelly bliaoliao');
            }else{
                return value;
            }
        }
    })
}
__const('a', 5);
console.log(global.a);
delete a;//由于configurable，不可被删除
console.log(a);

for(var i in global){
    if(i == 'a'){
        console.log('此时是将enumerable设成了true');
    }
}
//a = 6 //会报错

```