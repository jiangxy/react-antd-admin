# React通用后台

可以先看下[DEMO](http://jiangxy.github.io/react-antd-admin)，用户名/密码：guest/guest。
 
* [这是个啥东西](#需求背景)
* [Quick Start](#quick-start)
* [更多文档](docs/README.md)

## 需求背景

简化后端人员的前端开发...

TBD

## Quick Start

1. 保证node版本5.3+，npm版本3.3+
2. `npm install`，安装必要的依赖
3. 参考[src/schema](src/schema)下的例子，编写自己的querySchema和dataSchema文件
4. 参考[src/menu.js](src/menu.js)，按自己的需要配置侧边栏
5. 修改[src/index.js](src/index.js)中的路由表，保证和侧边栏一致
6. `npm run prod`，编译js文件，然后将dist目录下的`bundle.min.js`和`index-prod.html`copy到自己的工程，前端的工作就完成了。
7. 开发后端接口，接口规范见[这里](docs/Ajax.md)。如果是java后端，可以使用[这个工具](https://github.com/jiangxy/react-java-goos)帮你生成。

其他命令:
1. `npm run dev`，调试用，会启动webpack-dev-server，打开浏览器`http://localhost:8080`查看效果
2. `npm run eslint`/`npm run stylelint`/`npm run lesshint`，一些lint工具。
3. `npm run clean`，删除dist目录下的bundle*.js。

## 一些说明

### 安全/权限问题

TBD
 
### 浏览器兼容性

TBD
