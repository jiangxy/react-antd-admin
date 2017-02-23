module.exports = [
  {
    key: 'id',
    title: 'ID',
    dataType: 'int',
    primary: true,
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
  {
    key: 'frequency',
    title: '使用频率',
    dataType: 'varchar',
  },
  {
    key: 'isNative',
    title: '是否母语',
    dataType: 'varchar',
    placeholder: '字符串yes/no',
    validator: [{required: true, message: '必填'}],
  },
];
