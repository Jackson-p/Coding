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
