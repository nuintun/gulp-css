# gulp-css

> A gulp plugin for css transport and concat
>
> [![NPM Version][npm-image]][npm-url]
> [![Download Status][download-image]][npm-url]
> [![Dependencies][david-image]][david-url]

### Usage

```js
const gulp = require('gulp');
const css = require('@nuintun/gulp-css');
const { join, relative } = require('path');

// Fixed css resource path
function onpath(path, property, file, wwwroot) {
  if (/^[^./\\]/.test(path)) {
    path = './' + path;
  }

  if (path.startsWith('.')) {
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

- root `String`

  网站根目录。

- map `Function`

  配置模块 `ID` 映射（返回的映射字符串必须符合文件路径规则，会同步更新模块 `ID` 和 输出文件名）。

- combine `Boolean|Function`

  是否合并样式。

- onpath `Function`

  样式文件中的资源文件路径处理回调函数。

- onbundle `Function`

  模块合并完成后回调函数。

- plugins `Array[Object]`

  自定义模块转换插件，有 `moduleDidLoad, moduleDidParse, moduleWillBundle` 三个生命周期提供调用处理。

[npm-image]: http://img.shields.io/npm/v/@nuintun/gulp-css.svg?style=flat-square
[npm-url]: https://www.npmjs.org/package/@nuintun/gulp-css
[download-image]: http://img.shields.io/npm/dm/@nuintun/gulp-css.svg?style=flat-square
[david-image]: http://img.shields.io/david/nuintun/gulp-css.svg?style=flat-square
[david-url]: https://david-dm.org/nuintun/gulp-css
