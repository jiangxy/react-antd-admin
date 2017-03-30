import React from 'react';
import {Link} from 'react-router';

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
      // render应该尽量是一个纯函数, 不要有副作用
      // console.log(this.props.tableName);
      return text;
    },
    // 表格中根据这一列排序, 排序规则可以配置
    sorter: (a, b) => a.id - b.id,
  },
  {
    key: 'avatar',
    title: '头像',
    dataType: 'varchar',
    showType: 'image',
    sizeLimit: 500,  // 限制图片大小, 单位kb, 如果不设置这个属性, 就使用默认配置, 见config.js中相关配置
    max: 1,  // 最多可以上传几张图片? 默认1
    // 默认值, 可以是string也可以是string array, 跟max有关
    defaultValue: 'http://jxy.me/about/avatar.jpg',
    width: 100,  // 图片在表格中显示时会撑满宽度, 为了美观要自己调整下
    accept: '.jpg',  // 允许上传的文件类型, 可以省略, 默认值是".jpg,.png,.gif,.jpeg"
    placeholder: '请上传jpg格式, 分辨率不要超过200x200',  // 提示语
  },
  {
    key: 'photos',
    title: '风景照',
    dataType: 'varchar',
    showType: 'image',
    max: 5,
    // 图片的上传接口, 可以针对每个上传组件单独配置, 如果不单独配置就使用config.js中的默认值
    // 如果这个url是http开头的, 就直接使用这个接口; 否则会根据config.js中的配置判断是否加上host
    url: 'http://hahaha/uploadImage',
    // max>1时, 默认值是string array
    defaultValue: ['http://jxy.me/about/avatar.jpg', 'http://jxy.me/about/avatar.jpg'],
    width: 150,
    placeholder: '药药切克闹',
  },
  {
    // 文件上传和图片上传其实是很类似的
    key: 'jianli',
    title: '个人简历',
    dataType: 'varchar',
    showType: 'file',
    accept: '.pdf',
    sizeLimit: 20480,
    placeholder: '请上传pdf格式, 大小不要超过20M',
    validator: [{required: true, message: '必填'}],
  },
  {
    key: 'guanshui',
    title: '科研成果',
    dataType: 'varchar',
    showType: 'file',
    accept: '.pdf',
    max: 3,
    placeholder: '请上传论文, pdf格式, 最多3个',
    sorter: (a, b) => a.guanshui.length - b.guanshui.length,
  },
  {
    key: 'url',
    title: '个人主页',
    dataType: 'varchar',
    validator: [{type: 'url', message: '主页有误'}],
    // 跳转到外部链接例子, 会打开一个新窗口
    // 我本来想要不要加个showType=url, 但考虑了下还是用render去实现吧
    // 对于某些showType(比如image)我会有默认的render, 但用户自定义的render是最优先的
    render: (text, record) => <a href={`/index/option1?name=${record.id}`}>{text}</a>,
  },
  {
    key: 'mail',
    title: '邮箱',
    dataType: 'varchar',
    validator: [{type: 'email', required: true, message: '邮箱地址有误'}],
    // 跳转邮箱地址例子
    render: (text) => <a href="mailto:foolbeargm@gmail.com" target="_blank">{'foolbeargm@gmail.com'}</a>,
  },
  {
    key: 'phoneModel',
    title: '手机型号',
    dataType: 'varchar',
    // 跳转其他组件的例子, 可以带参数, 一般用于关联查询之类的
    // 其实就是react-router的配置
    render: (text, record) => <Link to={`/index/option1?name=${record.id}`}>{'跳转其他组件'}</Link>,
    validator: [{type: 'string', pattern: /^[a-zA-Z0-9]+$/, message: '只能是数字+字母'}],
  },
  {
    key: 'experience',
    title: '使用经验',
    dataType: 'varchar',
    validator: [{type: 'string', max: 10, message: '最多10个字符!'}],
  },
  {
    key: 'location',
    title: '地理位置',
    dataType: 'varchar',
    showType: 'cascader',
    options: [{
      value: 'zhejiang',
      label: '浙江',
      children: [{
        value: 'hangzhou',
        label: '杭州',
        children: [{
          value: 'xihu',
          label: '西湖',
        }],
      }],
    }, {
      value: 'yuzhou',
      label: '宇宙中心',
      children: [{
        value: 'wudaokou',
        label: '五道口',
      }],
    }],
  },
];
