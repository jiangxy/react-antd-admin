## 1.4.0

* 新增“TAB模式”, 可以平行显示多个菜单项了, 参考[DEMO](http://jiangxy.github.io/react-antd-admin/tabMode)
    * 使用TAB模式有一些注意事项, 相关说明见[关于TAB模式](docs/TabMode.md)
* DBTable组件的querySchema/dataSchema可以异步加载了, 可以对每个表分别配置, 例子: [testAction.config.js](src/schema/testAction.config.js#L7)
    * 更详细的配置请参考[异步schema相关配置](docs/AsyncSchema.md), 
* DBTable新增`cascader`的showType, 用于级联选择, 例子: [testSms.querySchema.js](src/schema/testSms.querySchema.js#L38)
* DBTable的默认配置移到[config.js](src/config.js#L68)中, 可按需修改
* 更新[react-java-goos](https://github.com/jiangxy/react-java-goos)到1.3.0
* 更新后端接口文档, 新增异步schema相关API说明, 见[后端接口规范](docs/Ajax.md)

## 1.3.0

继续优化DBTable组件

* dataSchema支持showType=image/file, 用于上传图片/文件, 相关配置参考[testSms.dataSchema.js](src/schema/testSms.dataSchema.js#L27)
  * 图片支持预览
  * 支持设置图片/文件上传的数量和类型
* dataSchema支持配置对单行数据的自定义操作, 参考[testAction.dataSchema.js](src/schema/testAction.dataSchema.js#L52)
  * 支持配置普通的update/delete/跳转等操作
  * 更复杂的操作可以使用自定义组件
* 表单初始化时支持从url中获取参数, 比如访问`/index/option3?id=1`会自动将id=1加入查询条件
* 表格的列支持自定义宽度和排序属性, 对应dataSchema的width和sorter属性
* 更新[react-java-goos](https://github.com/jiangxy/react-java-goos)到1.2.0, 新增`UploadController`等
* 更新文档, 新增上传相关API说明, 见[后端接口规范](docs/Ajax.md)

详见[DEMO](http://jiangxy.github.io/react-antd-admin)

## 1.2.0

主要是优化DBTable组件

* 所有ajax请求换成async/await语法
* 完全重写DBTable组件
  * 使用了一些[HOC](https://facebook.github.io/react/docs/higher-order-components.html)之类的技巧, 将parse schema的过程独立出来, 效率应该会好很多
  * 优化querySchema, 可以配置图标/默认值等, 参考[test.querySchema.js](src/schema/test.querySchema.js)
  * 优化dataSchema, 支持showType属性, 支持配置默认值/校验规则/disabled等, 参考[test.dataSchema.js](src/schema/test.dataSchema.js)
  * 优化tableConfig, 新增showInsert/showUpdate/showDelete配置, 参考[test.config.js](src/schema/test.config.js)和[DBTable.DEFAULT_CONFIG](src/config.js#L68)
  * insert/update/delete后, 不再刷新整个表格
  * 其他用户体验上的优化
* 重写mock数据的逻辑
* 更新[react-java-goos](https://github.com/jiangxy/react-java-goos)到1.1.0
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
