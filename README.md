# gulp-css

> A gulp plugin for css transport and concat
>
> [![Dependencies][david-image]][david-url]

[david-image]: http://img.shields.io/david/nuintun/gulp-css.svg?style=flat-square
[david-url]: https://david-dm.org/nuintun/gulp-css

### Usage

```js
var path = require('path');
var join = path.join;
var relative = path.relative;
var gulp = require('gulp');
var css = require('@nuintun/gulp-css');

// Fixed css resource path
function onpath(path, property, file, wwwroot) {
  if (/^[^./\\]/.test(path)) {
    path = './' + path;
  }

  if (path.indexOf('.') === 0) {
    path = join(dirname(file), path);
    path = relative(wwwroot, path);
    path = '/' + path;
    path = path.replace(/\\+/g, '/');
  }

  path = path.replace('assets/', 'online/');

  return path;
}

// Task
gulp.task('default', function() {
  gulp
    .src('assets/css/**/*.css')
    .pipe(css({ onpath: onpath }))
    .pipe(gulp.dest('online/css'));
});
```

### API

#### css(options)

##### _options_

* map `Function`

  配置模块 `ID` 映射（返回的映射字符串必须符合文件路径规则，会同步更新模块 `ID` 和 输出文件名）。

* include `Boolean`

  是否合并引入的样式文件。

* prefix `String|Function`

  对样式文件中的类名添加前缀类名。

* onpath `Function`

  样式文件中的资源文件路径处理回调。

* cache `Boolean`

  文件内存缓存，转换完成的文件会暂时存储在内存中以便提升转换效率。

* wwwroot `String`

  网站根目录配置，路径相对于 `process.cwd()` 目录。

> 注意事项：_样式路径以 `/` 结尾会默认用 `index.css` 补全_， 样式 import 规则和原生一致，需要注意的是尽量不要引入远程资源。
