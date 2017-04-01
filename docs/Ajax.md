# 后端接口定义

## 基本格式

```java
{
  "success" : true/false,  // 本次请求是否成功
  "code" : 0,  // 返回码, 默认是0表示成功
  "message" : "xxx",  // 请求失败时, 返回错误信息; 请求成功时, 可以没有这个字段或为空
  "data" : {
    ...  // 具体的数据, 格式是根据前端约定好的, 不一定是个对象, 也可能是数组/字符串之类的
  },
  "total" : 11  // 服务端返回的数据数量, 用于分页之类的, 如果没用的话可以不返回
}
```

我有强迫症...各个字段都想用小写字母...

注意:
* 服务端接口在任何情况下都返回200, 通过success字段判断是否成功, 不要返回4xx/5xx之类的错误
* 一般禁止3xx重定向
* 所有请求, 如果要传参数的, 一般用post, 否则用get
* 如果没有特殊说明，请求的`Content-Type`默认是`application/json`

## 用户相关接口

### 获取当前登录用户

* 接口名：`/api/getCurrentUser`
* 说明：获得当前登录的用户名，是否登录完全由后端判断
* 是否必需：是
* 输入：不需要任何参数
* 输出：如果当前用户未登录则返回success=false，例如`{"code":10,"data":null,"message":"not login yet","success":false,"total":null}`；已登录则返回登录的用户名，例如`{"code":0,"data":"guest","message":"","success":true,"total":null}`

### 登录

* 接口名：`/api/login`
* 说明：校验用户的登录信息，成功的话返回当前登录的用户名
* 是否必需：是
* 输入：request body是一个表单(`Content-Type=application/x-www-form-urlencoded`)，包含两个参数`username`/`password`，后端拿到这两个参数去校验
* 输出：成功的话返回登录后的用户名，例如：`{"code":0,"data":"guest","message":"","success":true,"total":null}`，否则返回错误信息。

### 登出

* 接口名：`/api/logout`
* 说明：注销当前用户，用户点击注销时浏览器会直接跳转到这个地址，由服务端控制后续的重定向等等。这样设计是因为使用SSO时logout逻辑很难统一，还是让后端自己去实现比较好。
* 是否必需：是
* 输入：无
* 输出：无

## CRUD相关接口

对于CRUD接口，每个表要分别实现，跟schema对应。

### select-查询

* 接口名：`/api/{tableName}/select`
* 说明：查询数据，传入查询条件，返回查询的结果。
* 是否必需：是
* 输入：request body是一个object，和querySchema中配置的查询条件对应，例如`{"page":1,"pageSize":50,"name":"guest","id:100"}`
* 输出：返回的data是一个数组，包含查询出来的数据（数据格式和dataSchema对应），例如`{"code":0,"data":[{"experience":"Less than 1 year","frequency":"2 to 5 SMS daily","id":6,"isNative":"no","phoneModel":"Nokia"}],"message":"","success":true,"total":31461}`，注意必须返回total字段，表示符合查询条件的记录共有多少条，用于分页。

### insert-插入

* 接口名：`/api/{tableName}/insert`
* 说明：插入数据，返回插入后的完整记录
* 是否必需：可选，如果不使用插入功能可以忽略这个接口
* 输入：request body是一个object，代表要插入的数据，和dataSchema对应，例如：`{"content":"fasdf","phoneModel":"jxy"}`
* 输出：返回的data是一个object，是插入后的完整数据（主要是为了获得插入后的主键），例如：`{"code":0,"data":{"content":"fasdf","id":31471,"phoneModel":"jxy"},"message":"","success":true,"total":null}`。

### update-更新

* 接口名：`/api/{tableName}/update?keys=`
* 说明：更新数据，只能按主键更新，url中要带上keys参数表明要更新哪些记录，可以单条更新也可以批量更新，多个key逗号分隔，返回更新成功的记录数
* 是否必需：可选，如果不使用更新功能可以忽略这个接口
* 输入：请求的url例子：`/api/{tableName}/update?keys=5488,5489`，body是和dataSchema对应的一个object，例如：`{"phoneModel":"jxyjxy","isNative":"yes"}`
* 输出：返回的data是一个数字，表示更新成功的记录数，例如：`{"code":0,"data":1,"message":"","success":true,"total":null}`

### delete-删除

* 接口名：`/api/{tableName}/delete?keys=`
* 说明：删除数据，跟更新数据类似，也是只能按主键删除，url中要带上keys参数，多个key逗号分隔，返回删除成功的记录数
* 是否必需：可选，如果不使用删除功能可以忽略这个接口
* 输入：请求url例子：`/api/{tableName}/delete?keys=31471`
* 输出：返回的data是一个数字，表示删除成功的记录数，例如：`{"code":0,"data":1,"message":"","success":true,"total":null}`

### import-导入

* 接口名：`/api/{tableName}/import`
* 说明：导入数据，返回一个string的提示信息
* 是否必需：可选，如果不使用导入功能可以忽略这个接口
* 输入：一个文件上传请求，参数名为file
* 输出：返回的data是一个string，用于提示用户，例如：`{"data":"导入成功XX条，导入失败YY条，导入失败的行：1,2,3","message":"","success":true,"total":null}`

### export-导出

* 接口名：`/api/{tableName}/export?q=`
* 说明：导出数据。这个接口比较特殊。跟select接口类似，也是传入一个querySchema的查询条件。不同之处在于select时查询条件是通过request body传入的，而export时查询条件通过url中的q参数传入。而且这个接口不是通过ajax请求的，用户导出时会直接打开一个新窗口请求这个url。
* 是否必需：可选，如果不使用导出功能可以忽略这个接口
* 输入：请求url例子：`/api/{tableName}/export?q={"name":"jxy"}`，传入的q是一个string，代表查询条件，后端要拿到这个string再反序列化。
* 输出：不要返回json了。返回一个`Content-Disposition=attachment; filename=xxx`的下载请求，浏览器会自动处理这种请求并下载文件。

### schema-异步schema

* 接口名：`/api/{tableName}/schema`
* 说明：返回服务端schema，前端拿到结果后会和本地schema合并作为最终的schema
* 是否必需：可选，如果不使用异步schema可以忽略这个接口
* 输入：不需要任何参数
* 输出：返回的data是一个json，包含`querySchema`/`dataSchema`两个可选的key，value是对应的schema，参考[异步schema相关配置](AsyncSchema.md)。

## 上传相关接口

上传图片和上传文件是非常类似的。但上传图片时往往要做一些特殊的处理，所以我分为两个接口。

### uploadImage-上传图片

* 接口名：`/api/uploadImage`
* 说明：上传图片，返回上传后的url
* 是否必需：可选，如果不使用图片上传可以忽略这个接口
* 输入：文件上传请求，参数名为file
* 输出：返回的data是一个string，是图片上传后的url，例如：`{"data":"http://jxy.me/about/avatar.jpg","message":"","success":true,"total":null}`。

### uploadFile-上传文件

* 接口名：`/api/uploadFile`
* 说明：上传文件，返回上传后的url
* 是否必需：可选，如果不使用文件上传可以忽略这个接口
* 输入：文件上传请求，参数名为file
* 输出：返回的data是一个string，是文件上传后的url，例如：`{"data":"https://static.googleusercontent.com/media/research.google.com/zh-CN//archive/mapreduce-osdi04.pdf","message":"","success":true,"total":null}`。

## 关于上传的一些说明

导入/上传图片/上传文件接口都很类似，输入是一个`Content-Type=multipart/form-data`的上传请求，参数名为file。

不太好给出例子，如果用标准的html表单来实现上传，大概是这样：
```
<form action="/api/uploadImage" method="post" enctype="multipart/form-data">
	<input type="file" name="file" />
	<button type="submit">提交</button>
</form>
```
只要接口能处理这种上传请求就可以了。
