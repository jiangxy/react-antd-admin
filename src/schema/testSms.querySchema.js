// 定义某个表的querySchema
// schema的结构和含义参考下面的例子
// 注意: 所有的key不能重复

module.exports = [
  {
    key: 'id',  // 传递给后端的字段名
    title: 'ID',  // 前端显示的名称
    dataType: 'int',
  },
  {
    key: 'content',
    title: '内容',
    dataType: 'varchar',
  },
  {
    key: 'phoneModel',
    title: '手机型号',
    dataType: 'varchar',
  },
  {
    key: 'experience',
    title: '使用经验',
    dataType: 'varchar',
  },
  {
    key: 'frequency',
    title: '使用频率',
    dataType: 'varchar',
  },
  {
    key: 'isNative',
    title: '是否母语',
    dataType: 'varchar',
    showType: 'radio',
    options: [{key: 'yes', value: '是'}, {key: 'no', value: '否'}],
  },
  // 级联选择, 和select很类似
  // 同样支持placeholder/defaultValue等属性
  {
    key: 'location',
    title: '地理位置',
    dataType: 'varchar',  // 一般而言dataType是字符串, 但也可以是数字
    showType: 'cascader',
    defaultValue: ['zhejiang', 'hangzhou', 'xihu'],
    options: [{
      value: 'zhejiang',   // option的value必须是字符串, 和select类似
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
