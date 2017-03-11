import React from 'react';

module.exports = [
  {
    key: 'id',
    title: 'ID',
    dataType: 'int',
    primary: true,
    // 当前列如何渲染
    render(text) {
      // 只是一个例子, 说明下render函数中可以用this, 甚至可以this.setState之类的
      // 我会把this绑定到当前的InnerTable组件上
      // 但需要注意, 如果要使用this, render必须是普通的函数, 不能是箭头函数, 因为箭头函数不能手动绑定this
      // this不要滥用, 搞出内存泄漏就不好了
      // console.log(this.props.tableName);
      return text;
    },
  },
  {
    key: 'avatar',
    title: '头像',
    dataType: 'varchar',
    showType: 'image',
    sizeLimit: 500,  // 限制图片大小, 单位kb, 如果不设置这个属性, 就使用默认配置, 见config.js中相关配置
    // 默认值, 可以是string也可以是string array
    defaultValue: 'http://jxy.me/about/avatar.jpg',
    width: 100,  // 图片在表格中显示时会撑满宽度, 为了美观要自己调整下
  },
  {
    key: 'photos',
    title: '风景照',
    dataType: 'varchar',
    showType: 'image',
    max: 5,  // 最多可以上传几张图片? 默认1
    // 图片的上传接口, 可以针对每个上传组件单独配置, 如果不单独配置就使用config.js中的默认值
    // 如果这个url是http开头的, 就直接使用这个接口; 否则会根据config.js中的配置判断是否加上host
    url: 'http://remoteHost/uploadImage',
    // max>1时, 默认值是string array
    defaultValue: ['http://jxy.me/about/avatar.jpg', 'http://jxy.me/about/avatar.jpg'],
    width: 150,
  },
  {
    key: 'isNative',
    title: '是否母语',
    dataType: 'varchar',
    placeholder: '字符串yes/no',
    validator: [{required: true, message: '必填'}],
  },
  {
    key: 'mail',
    title: '邮箱',
    dataType: 'varchar',
    validator: [{type: 'email', required: true, message: '邮箱地址有误'}],
  },
  {
    key: 'url',
    title: '个人主页',
    dataType: 'varchar',
    validator: [{type: 'url', message: '主页有误'}],
    // 我本来想要不要加个showType=url, 但考虑了下还是用render去实现跳转吧
    // 对于某些showType(比如image)我会有默认的render, 但用户自定义的render是最优先的
    render: (text) => <a href={text} target="_blank">{text}</a>,
  },
  {
    key: 'phoneModel',
    title: '手机型号',
    dataType: 'varchar',
    validator: [{type: 'string', pattern: /^[a-zA-Z0-9]+$/, message: '只能是数字+字母'}],
  },
  {
    key: 'experience',
    title: '使用经验',
    dataType: 'varchar',
    validator: [{type: 'string', max: 10, message: '最多10个字符!'}],
  },
];
