gulp-css
=========

>A gulp plugin for css transport and concat

>[![Dependencies][david-image]][david-url]

[david-image]: http://img.shields.io/david/nuintun/gulp-css.svg?style=flat-square
[david-url]: https://david-dm.org/nuintun/gulp-css

###Usage
```js
var gulp = require('gulp');
var css = require('gulp-css');

// Task
gulp.task('default', function (){
  gulp.src('assets/css/**/*.css')
    .pipe(css({
      onpath: function (path){
        return path.replace('assets/', 'online/')
      }
    }))
    .pipe(gulp.dest('online/css'))
});
```

###API
####css(options)
#####  *options* 

- prefix ```String|Function```
  
  对样式文件中的类名添加前缀类名。

- onpath ```Function```
  
  样式文件中的资源文件路径处理回调。

- cache ```Boolean```
  
  文件内存缓存，转换完成的文件会暂时存储在内存中以便提升转换效率。

- wwwroot ```String```
  
  网站根目录配置，路径相对于 ```gulpfile.js``` 目录。

- rename ```Object|Function```
  
  重命名文件，有 ```debug``` 和 ```min``` 两个配置可选，打开后文件名会自动添加 -debug 和 -min 后缀，debug 打开时 min 配置无效。当 rename 是函数的时候要返回 ```{ prefix: '', suffix: '' }``` 格式的对象，分别对应前缀和后缀。

- compress ```Boolean```
  
  是否压缩样式代码。

>注意事项：*样式路径以 ```/``` 结尾会默认用 ```index.css``` 补全*， 样式 import 规则和原生一致，需要注意的是尽量不要引入远程资源。
