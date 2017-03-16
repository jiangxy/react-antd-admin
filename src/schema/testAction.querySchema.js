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
    key: 'haha',
    title: '测试',
    dataType: 'varchar',
  },
];
