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

## 接口定义

### 通用接口 (我kao github的表格怎么这么丑啊)

| 接口名  | 说明 | 输入例子 | 输出例子 |
| :---: | :---: | :---: | :---: |
| /api/getCurrentUser  | 获得当前登录的用户名, 是否登录完全由后端判断 | 不需要任何参数 | `{"code":10,"data":null,"message":"not login yet","success":false,"total":null}` |
| /api/login | 校验用户的登录信息, 成功的话返回当前登录的用户名 | request body是一个表单, 比如`username=guest&password=guest` | `{"code":0,"data":"guest","message":"","success":true,"total":null}` |
| /api/logout  | 注销当前用户, 用户点击注销时浏览器会直接跳转到这个地址 | 无 | 无 |

### CRUD相关接口

| 接口名  | 说明 | 输入例子 | 输出例子 |
| ------------- | ------------- | ------------- | ------------- |
| /api/{tableName}/select | 查询数据, 传入查询条件, 返回查询的数据 | request body是一个QueryVO, 例如`{"page":1,"pageSize":50,"name":"guest"}` | `{"code":0,"data":[{"experience":"Less than 1 year","frequency":"2 to 5 SMS daily","id":6,"isNative":"no","phoneModel":"Nokia"}],"message":"","success":true,"total":31461}` |
| /api/{tableName}/insert | 插入数据, 返回插入后的完整记录 | 要插入的数据: `{"content":"fasdf","phoneModel":"jxy"}` | `{"code":0,"data":{"content":"fasdf","id":31471,"phoneModel":"jxy"},"message":"","success":true,"total":null}` |
| /api/{tableName}/update | 更新数据, 只能按主键更新, url中要带上keys参数表明要更新哪些记录, 可以单条更新也可以批量更新, 返回更新成功的记录数 | 请求的url: `/api/{tableName}/update?keys=5488`, body: `{"phoneModel":"jxyjxy","isNative":"yes"}` | `{"code":0,"data":1,"message":"","success":true,"total":null}` |
| /api/{tableName}/delete | 删除数据, 也是只能按主键删除, url中要带上keys参数, 返回删除成功的记录数 | 请求url: `/api/{tableName}/delete?keys=31471` | `{"code":0,"data":1,"message":"","success":true,"total":null}` |
| /api/{tableName}/import | 导入数据, 返回一个string的提示信息 | 无 | `{"data":"导入成功XX条，导入失败YY条，导入失败的行：1,2,3","message":"","success":true,"total":null}` |
| /api/{tableName}/export | 导出数据, 跟select接口类似, 也是传入一个QueryVO, 要返回一个HTTP下载请求 | 无 | 无 |

### 上传相关接口

| 接口名  | 说明 | 输入例子 | 输出例子 |
| ------------- | ------------- | ------------- | ------------- |
| /api/uploadImage | 上传图片，返回上传后的url | 无 | `{"data":"http://jxy.me/about/avatar.jpg","message":"","success":true,"total":null}` |
| /api/uploadFile | 上传文件，跟上传图片非常类似，返回上传后的url | 无 | `{"data":"https://static.googleusercontent.com/media/research.google.com/zh-CN//archive/mapreduce-osdi04.pdf","message":"","success":true,"total":null}` |

### 上传的一些说明

导入/上传图片/上传文件都很类似，是一个`multipart/form-data`请求，参数名为file。

不太好给出例子，如果用标准的html表单来实现上传，大概是这样：
```
<form action="/api/uploadImage" method="post" enctype="multipart/form-data">
	<input type="file" name="file" />
	<button type="submit">提交</button>
</form>
```
只要接口能处理这种上传请求就可以了。
