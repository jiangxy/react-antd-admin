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
  {
    key: 'type',
    title: '类型',
    dataType: 'int',
    showType: 'select',
    options: [{key: '1', value: '类型1'}, {key: '2', value: '类型2'}],
    defaultValue: '1',
  },
];
