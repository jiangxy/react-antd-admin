# TODO List

## 通用

- [x] 接入redux
- [ ] 接入Immutable.js
- [ ] 研究下shouldUpdate
- [x] 登录组件
- [x] 单点登录
- [ ] 安全/权限? 
- [ ] 把acl做成注解?
- [x] 表单项多了后输入卡顿: 研究下controlled input的render问题
- [x] 修改ajax util, 全部变成async/await
- [x] 想办法减小下bundle大小,或者分片
- [x] 自定义logger level
- [x] 增加一个"TAB模式"?? <- 这种模式下就不需要面包屑了

## 侧边栏组件

- [x] 侧边栏折叠
- [x] 侧边栏只能展开一级菜单
- [x] 升级antd解决hover的bug
- [x] 完善logo组件样式
- [ ] 增加logo图片
- [ ] 可能出现水平和垂直的滚动条
- [ ] 直接从某个url进入的话, 自动选中侧边栏相应菜单??
- [ ] 侧边栏折叠时卡顿

## Header组件

- [x] 精简header
- [x] 自定义菜单

## DBTable组件

- [ ] schema校验
- [x] 数据校验
- [x] 根据schema自动生成VO和controller
- [ ] 图形化生成schema
- [x] 导入/导出
- [x] DBTable组件可配置
- [x] 单条update时, 将原始数据填入modal
- [x] dataSchema支持showType
- [x] dataSchema支持外键约束??
- [x] dataSchema支持image/file/url的showType
- [x] 表格中根据showType渲染
- [x] modal中的表单增加placeholder
- [ ] 导出时要打开新窗口: 研究下[FileSaver.js](https://github.com/eligrey/FileSaver.js/)
- [ ] 导入时可以筛选文件类型
- [ ] 似乎可以做成云端服务, 用户只需提供配置即可, 不需要自己编译
- [x] update时不是所有字段都要填
- [x] 表单初始化时从url中获取参数
- [x] 每条记录后面增加自定义操作(按条件决定是否显示??)
- [x] 表格schema更多自定义项: width和排序
- [x] 表格modal点击蒙层不能关闭/调整下宽度

## 杂项

- [x] 面包屑导航
- [x] 拆解App/index.less
- [x] logo和footer可以做成全局配置
- [x] InputNumber组件报的warning - 不知是那个组件的版本有问题
- [x] favicon 404的问题
- [ ] add propType check
- [ ] 要请求ali cdn导致很慢, 图标加载不出来<-Icon的各种图标都可能出问题<-如果不能访问外网怎么办?
- [ ] profile工具
- [ ] React Hot Loader 3
- [ ] prod环境下屏蔽redux-logger
- [ ] npm run build是不是没啥必要了
- [x] 更新react-java-goos
