## 校验规则

前端和后端都必须对数据做校验, 不能完全丢给后端去做.

前端还要额外加一层schema校验.

### schema校验

后端返回的querySchema和dataSchema是否正确?

### 数据校验

校验类型:
* 通用: 是否必须
* 字符串: 长度/email
* 数字: 最小/最大
* 日期: 最小/最大

只有用户自由输入的框才需要校验, select/radio之类的, 校验毛线.