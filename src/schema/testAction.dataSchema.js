import React from 'react';
import {Link} from 'react-router';
import {UpdateGPA1, UpdateGPA2} from '../components/UpdateComponentDemo';

module.exports = [
  {
    key: 'id',
    title: 'ID',
    dataType: 'int',
    primary: true,
  },
  {
    key: 'name',
    title: '姓名',
    dataType: 'varchar',
    validator: [{type: 'string', max: 10, message: '最多10个字符'}],
  },
  {
    key: 'touxiang',
    title: '头像',
    dataType: 'varchar',
    showType: 'image',
    width: 60,
  },
  {
    key: 'desc',
    title: '描述',
    dataType: 'varchar',
  },
  {
    key: 'score',
    title: '分数',
    dataType: 'int',
    max: 18,
    validator: [{required: true, message: '必填'}],
  },
  {
    key: 'gpa',
    title: 'GPA',
    dataType: 'float',
  },
  {
    key: 'birthday',
    title: '生日',
    dataType: 'datetime',
  },
  // 定义针对单条记录的操作
  // 常见的针对单条记录的自定义操作有哪些? 无非是更新和删除
  // 注意, 如果没有定义主键, 是不允许更新和删除的
  {
    // 这个key是我预先定义好的, 注意不要冲突
    key: 'singleRecordActions',
    title: '我是自定义操作',  // 列名
    width: 300,  // 宽度
    actions: [
      {
        name: '更新姓名',
        type: 'update',  // 更新单条记录
        keys: ['name'],  // 允许更新哪些字段, 如果不设置keys, 就允许更所有字段
      },
      {
        name: '更新分数和GPA',
        type: 'update',
        keys: ['score', 'gpa'],  // 弹出的modal中只会有这两个字段
      },
      {
        name: '更新生日',
        type: 'update',
        keys: ['birthday'],
        visible: (record) => record.id >= 1010,  // 所有action都可以定义visible函数, 返回false则对这行记录不显示这个操作
      },
      {
        name: '更新头像',
        type: 'update',
        keys: ['touxiang'],
      },
      {
        type: 'newLine',  // 换行, 纯粹用于排版的, 更美观一点
      },
      {
        type: 'newLine',
      },
      {
        name: '删除',
        type: 'delete',  // 删除单条记录
      },
      {
        // 如果不是预定义的type(update/delete/newLine/component), 就检查是否有render函数
        // 有render函数就直接执行
        render: (record) => <a href={`http://jxy.me?id=${record.id}`} target="_blank">{'跳转url'}</a>,
      },
      {
        // react-router的Link组件
        render: (record) => <Link to={`/index/option1?name=${record.id}`}>{'跳转其他组件'}</Link>,
      },
      {
        // 这样写似乎和Link组件是一样的效果
        render: (record) => <a href={`/#/index/option1?name=${record.id}`}>{'跳转2'}</a>,
      },
      {
        type: 'newLine',
      },
      {
        type: 'newLine',
      },
      // 如果有一些特殊的需求, 或者想要更好的交互, 可以用自定义组件实现对单条记录的更新
      // 一个常见的情况是DB中某个varchar字段存储的是json, 如果用textarea去编辑json对用户很不友好, 也容易出错, 这时候就可以用自定义组件了
      // 但自定义的组件必须遵守一些约定, 有点像java的接口, 参考我的例子
      {
        name: '自定义组件-更新gpa',
        type: 'component',
        component: UpdateGPA1,  // 要渲染哪个组件, 这个组件会被渲染到modal中
      },
      {
        name: '自定义组件2号',
        type: 'component',
        component: UpdateGPA2,
      },
    ],
  },
];
