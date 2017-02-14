## 1.1.1

一些小的优化

* 修复windows下的一些问题 #6
* 引入HtmlWebpackPlugin，不用区分`index.html`和`index-prod.html`了
* 顶部菜单样式一些调整
* 想各种办法解决bundle size过大的问题
  * css单独提取出来
  * 将原来的bundle.js分为vendor和bundle两部分
  * 使用动态路由，见[index.js](src/index.js)
  
## 1.1.0

主要是一些样式、交互上的优化

* 侧边栏可以折叠了，子菜单也支持图标
* header菜单可以配置
* 修复Login组件样式上的一些问题
* antd升级到2.6.1；react/babel的版本也升级了下；引入redux

详见[DEMO](http://jiangxy.github.io/react-antd-admin)
