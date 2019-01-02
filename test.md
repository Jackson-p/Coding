# CSS3 稍冷知识

不得不说CSS的琐碎点实在是有点儿多，看着啥记录啥的，望不断更新。

> input 取消光圈+常规操作

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
	<div class="liao">
		<div class="liaoin">
			<input type="text">
		</div>
	</div>
</body>
<style>
.liao{
	width: 100%;
	height: 500px;
	background-color: cadetblue;
	position: relative;
}
.liaoin{
	position: absolute;
	width: 800px;
	height: 300px;
	line-height: 300px;
	margin: auto;
	top: 0;
	left: 0;
	bottom: 0;
	right: 0;
	background-color: azure;
	text-align: center;
}
.liaoin input{
	/* margin: auto; */
	outline: none;
	height: 20px;
	line-height: 20px;
	padding: 9px;
}
</style>
</html>
```

> CSS预处理语言Less

这个有时间再好好看下，只会用基础的orz

> nth-of-child和nth-of-type

p:nth-child(2) 要求该元素是p元素，且是父元素的第二个子元素

p:nth-of-type(2) 要求该元素是父元素下的第二个p元素
