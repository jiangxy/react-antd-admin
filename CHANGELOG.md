## 1.2.0

主要是优化DBTable组件

* 所有ajax请求换成async/await语法
* 完全重写DBTable组件
  * 使用了一些[HOC](https://facebook.github.io/react/docs/higher-order-components.html)之类的技巧, 将parse schema的过程独立出来, 效率应该会好很多
  * 优化querySchema, 可以配置图标/默认值等, 参考[test.querySchema.js](src/schema/test.querySchema.js)
  * 优化dataSchema, 支持showType属性, 支持配置默认值/校验规则/disabled等, 参考[test.dataSchema.js](src/schema/test.dataSchema.js)
  * 优化tableConfig, 新增showInsert/showUpdate/showDelete配置, 参考[test.config.js](src/schema/test.config.js)和[DBTable.DEFAULT_CONFIG](/src/components/DBTable/index.js#L20)
  * insert/update/delete后, 不再刷新整个表格
  * 其他用户体验上的优化
* 重写mock数据的逻辑
* 更新了[react-java-goos](https://github.com/jiangxy/react-java-goos)
* 一些bugfix

详见[DEMO](http://jiangxy.github.io/react-antd-admin)
  
## 1.1.1

一些小的优化

* 修复windows下的一些问题 [#6](https://github.com/jiangxy/react-antd-admin/issues/6)
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
