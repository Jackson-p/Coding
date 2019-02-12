// 手写一个promise
// 不考虑setTimeout的低配版
// class Promise{
//     //构造器
//     constructor(executor){
//         //成功
//         this.state = 'pending'
//         this.value = undefined
//         this.reason = undefined //这里记录失败原因
//         let resolve = (value) => {
//             if(this.state == 'pending'){
//                 this.state = 'fulfilled'
//                 this.value = value
//             }
//         }
//         let reject = (reason) => {
//             if(this.state == 'pending'){
//                 this.state = 'refused'
//                 this.reason = reason
//             }
//         }
//         try {
//             executor(resolve, reject)
//         }catch(err){
//             reject(err)
//         }   
//     }
//     then(onFulfilled, onRejected){
//         if(this.state == 'fulfilled'){
//             onFulfilled(this.value)
//         }else if(this.state == 'rejected'){
//             onRejected(this.value)
//         }
//         //如果是pending状态就什么也不做，而不是抛出错误
//     }
// }
// var a = new Promise((resolve, reject) =>{
//     setTimeout(() => resolve(4),1000)//就在这里，setTimeout会加在下轮事件的开始，也就是then的时候还只是pending状态
    
// })
// a.then(val => console.log(val))//对应上条，也就是这个fulfilled状态下我们应该进行的操作给漏掉了，所以应该放在数组里存起来

// class Promise{
//     //构造器
//     constructor(executor){
//         //成功
//         this.state = 'pending'
//         this.value = undefined
//         this.reason = undefined //这里记录失败原因
//         // 存放成功事件
//         this.onResolvedCallbacks = []
//         // 存放失败事件
//         this.onRejectedCallbacks = []
//         let resolve = (value) => {
//             if(this.state == 'pending'){
//                 this.state = 'fulfilled'
//                 this.value = value
//                 this.onResolvedCallbacks.forEach((fn) => fn())
//             }
//         }
//         let reject = (reason) => {
//             if(this.state == 'pending'){
//                 this.state = 'refused'
//                 this.reason = reason
//                 this.onRejectedCallbacks.forEach(fn=>fn())
//             }
//         }
//         try {
//             executor(resolve, reject)
//         }catch(err){
//             reject(err)
//         }   
//     }
//     then(onFulfilled, onRejected){
//         if(this.state == 'fulfilled'){
//             onFulfilled(this.value)
//         }else if(this.state == 'rejected'){
//             onRejected(this.value)
//         }else if(this.state == 'pending'){
//             this.onResolvedCallbacks.push(() => {
//                 onFulfilled(this.value)
//             })
//             this.onResolvedCallbacks.push(() => {
//                 onRejected(this.value)
//             })
//         }
//     }
// }
//以上就完成了一个最基础的promise，再考虑链式等其他要求最后完整版
class Promise{
    constructor(executor){
      this.state = 'pending';
      this.value = undefined;
      this.reason = undefined;
      this.onResolvedCallbacks = [];
      this.onRejectedCallbacks = [];
      let resolve = value => {
        if (this.state === 'pending') {
          this.state = 'fulfilled';
          this.value = value;
          this.onResolvedCallbacks.forEach(fn=>fn());
        }
      };
      let reject = reason => {
        if (this.state === 'pending') {
          this.state = 'rejected';
          this.reason = reason;
          this.onRejectedCallbacks.forEach(fn=>fn());
        }
      };
      try{
        executor(resolve, reject);
      } catch (err) {
        reject(err);
      }
    }
    then(onFulfilled,onRejected) {
      onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : value => value;
      onRejected = typeof onRejected === 'function' ? onRejected : err => { throw err };
      let promise2 = new Promise((resolve, reject) => {
        if (this.state === 'fulfilled') {
          setTimeout(() => {
            try {
              let x = onFulfilled(this.value);
              resolvePromise(promise2, x, resolve, reject);
            } catch (e) {
              reject(e);
            }
          }, 0);
        };
        if (this.state === 'rejected') {
          setTimeout(() => {
            try {
              let x = onRejected(this.reason);
              resolvePromise(promise2, x, resolve, reject);
            } catch (e) {
              reject(e);
            }
          }, 0);
        };
        if (this.state === 'pending') {
          this.onResolvedCallbacks.push(() => {
            setTimeout(() => {
              try {
                let x = onFulfilled(this.value);
                resolvePromise(promise2, x, resolve, reject);
              } catch (e) {
                reject(e);
              }
            }, 0);
          });
          this.onRejectedCallbacks.push(() => {
            setTimeout(() => {
              try {
                let x = onRejected(this.reason);
                resolvePromise(promise2, x, resolve, reject);
              } catch (e) {
                reject(e);
              }
            }, 0)
          });
        };
      });
      return promise2;
    }
    catch(fn){
      return this.then(null,fn);
    }
  }
  function resolvePromise(promise2, x, resolve, reject){
    if(x === promise2){
      return reject(new TypeError('Chaining cycle detected for promise'));
    }
    let called;
    if (x != null && (typeof x === 'object' || typeof x === 'function')) {
      try {
        let then = x.then;
        if (typeof then === 'function') { 
          then.call(x, y => {
            if(called)return;
            called = true;
            resolvePromise(promise2, y, resolve, reject);
          }, err => {
            if(called)return;
            called = true;
            reject(err);
          })
        } else {
          resolve(x);
        }
      } catch (e) {
        if(called)return;
        called = true;
        reject(e); 
      }
    } else {
      resolve(x);
    }
  }
  //resolve方法
  Promise.resolve = function(val){
    return new Promise((resolve,reject)=>{
      resolve(val)
    });
  }
  //reject方法
  Promise.reject = function(val){
    return new Promise((resolve,reject)=>{
      reject(val)
    });
  }
  //race方法 
  Promise.race = function(promises){
    return new Promise((resolve,reject)=>{
      for(let i=0;i<promises.length;i++){
        promises[i].then(resolve,reject)
      };
    })
  }
  //all方法(获取所有的promise，都执行then，把结果放到数组，一起返回)
  Promise.all = function(promises){
    let arr = [];
    let i = 0;
    function processData(index,data){
      arr[index] = data;
      i++;
      if(i == promises.length){
        resolve(arr);
      };
    };
    return new Promise((resolve,reject)=>{
      for(let i=0;i<promises.length;i++){
        promises[i].then(data=>{
          processData(i,data);
        },reject);
      };
    });
  }

  var a = new Promise((resolve, reject) => {
      setTimeout(() => resolve(6), 1000)
  })
  a.then(val => console.log(val))

  //选自https://juejin.im/post/5b2f02cd5188252b937548ab