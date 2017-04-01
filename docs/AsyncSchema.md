# 异步schema相关配置

在之前的DBTable实现中，单选/下拉框/多选等表单项的option都是写死的，换句话说可选的项目是固定的。而现实情况中下拉框之类的内容往往是要动态加载的。

之前我一直思考着该如何实现下拉框数据的动态加载，如果给schema新增一个属性应该也能做到，比如新增一个`url`字段，表示这个输入项的数据要从某个接口动态获取。但后来又一想，为啥不干脆做的彻底一点呢，整个schema都可以从远程加载。这样不但可以实现下拉框的动态加载，所有字段都可以动态加载，比如服务端可以动态增加字段，每次刷新页面都显示不同的内容，甚至修改已有字段的showType/defaultValue之类的，非常灵活。以后有新需求的时候，直接修改后端接口就可以了，不用重新编译bundle.js了。

按这个思路，服务端需要新增一个接口`/api/{tableName}/schema`，返回的数据类似：
```java
{
    "success": true,
    "code": 0,
    "message": "xxx",
    "data": {
        querySchema: [  // 可选，如果返回这个字段，说明服务端要更新querySchema
           // 结构跟{tableName}.querySchema.js中定义的是完全一样的
        ],
        dataSchema: [  // 可选，如果返回这个字段，说明服务端要更新dataSchema
           // 结构跟{tableName}.dataSchema.js完全一样
        ],
    },
    "total": null
}
```

注意querySchema/dataSchema不是要求必须返回的，服务端甚至可以返回一个空的对象：`data: {}`，参考[MockAjax.js](../src/utils/MockAjax.js#L265)里的例子，也可以参考[后端接口规范](Ajax.md)。

剩下的问题就是，如何将本地的schema（本地的`{tableName}.querySchema.js`文件）和远程的schema合并。大概的逻辑如下：

1. 如果找不到本地schema，就以远程schema为准；
2. 如果本地schema和远程schema都不存在，报错；
3. 如果本地schema和远程schema都存在，要将二者合并作为最终的schema。合并时以本地schema为基准，以key为标识，相同key的字段会被合并
	* 某个key如果在远程和本地都存在，远程的配置会覆盖本地的配置，合并逻辑类似`newField = Object.assign{{}, local, remote}`
	* 某个key如果只在远程存在，认为是服务端要新增一个字段，新的key会被加到最终的schema末尾
	* 某个key如果只在本地存在，就保持原样

本地schema和远程schema合并后，就可以正常渲染DBTable组件了。

对于异步schema，我提供了两个配置，可以在`{tableName}.config.js`中对每个表格分别配置，用户也可以修改[DBTable的全局配置](../src/config.js#L68)：

## asyncSchema

对当前表是否开启异步加载schema的特性，默认值false。只有开启这个特性后，才会去尝试请求服务端的`/api/{tableName}/schema`接口并合并schema。

## ignoreSchemaCache

出于性能考虑，异步schema模式下，我只会在刚初始化某个表时请求一次服务端并合并schema，然后将schema缓存起来。后续再访问这个表的时候（比如在侧边栏菜单中切换）会直接读取缓存的schema。这样有个问题就是服务端接口变化后，要刷新下页面才能看到效果，在某些情况下可能不太方便。所以提供了一个ignoreSchemaCache配置，默认值false。当ignoreSchemaCache=true时，每次DBTable组件初始化/切换都会重新请求后端接口并合并schema。服务端接口变化时，侧边栏中切换下就能看到效果了，不用刷新整个页面。

# 其他

异步schema可以做到很多有意思的事情，也许以后可以考虑把menu.js、路由等都做成异步的。。。我也一直在想，也许可以做成云端服务，用户只要提供配置和接口就好了，不用自己去编译js。
