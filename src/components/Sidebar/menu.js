// 定义sidebar中的菜单项
// 一些约定: 1.菜单最多3层; 2.只有顶层的菜单可以带图标;
module.exports = [
  {
    key: 1,
    name: '首页',
    icon: 'home',
    link: '/',
  },
  {
    key: 2,
    name: '导航二',
    icon: 'laptop',
    child: [
      {
        key: 21,
        name: '选项1',
        link: '/hello',
      },
      {
        key: 22,
        name: '选项2',
        link: 'hello2',
      },
      {
        key: 23,
        name: '选项3',
      },
      {
        key: 24,
        name: '选项4',
      },
    ],
  },
  {
    key: 3,
    name: '导航三',
    icon: 'appstore',
    child: [
      {
        key: 31,
        name: '选项5',
      },
      {
        key: 32,
        name: '三级导航',
        child: [
          {
            key: 321,
            name: '选项6',
          },
          {
            key: 322,
            name: '选项7',
          },
        ],
      },
    ],
  },
]
