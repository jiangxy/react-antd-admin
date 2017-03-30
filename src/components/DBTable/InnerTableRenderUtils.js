import React from 'react';
import TableUtils from './TableUtils.js';
import Logger from '../../utils/Logger';
import Utils from '../../utils';

const logger = Logger.getLogger('InnerTableRenderUtils');

// 自定义操作字段, 在dataSchema中是用一个特殊的key来标识的
const ACTION_KEY = 'singleRecordActions';

/**
 * 表格的render函数有个比较蛋疼的问题, 就是this绑定, 专门写个工具类去处理
 */
const RenderUtils = {

  // 这个utils是有状态的
  // 用一个set保存目前已经处理过哪些表的render, 已经处理过的就不用再处理了
  tableNameSet: new Set(),

  /**
   * 重置状态, InnerTable组件unmount时调用
   * 因为只有组件unmount后才可能需要重新绑定this
   */
  reset() {
    this.tableNameSet.clear();
  },

  /**
   * 处理表格的schema, 根据情况赋值render函数
   *
   * @param tableSchema 表格的schema
   * @param tableName 表名
   * @param innerTableComponent 对应的InnerTable组件, 换句话说, 要绑定的this对象
   * @returns {*}
   */
  bindRender(tableSchema, tableName, innerTableComponent) {
    const {onClickImage, onSingleRecordUpdate, onSingleRecordDelete, onSingleRecordComponent, fieldMap, primaryKey} = innerTableComponent;
    // 命中缓存
    if (this.tableNameSet.has(tableName)) {
      return tableSchema;
    }

    tableSchema.forEach(col => {
      const field = fieldMap.get(col.key);
      if (!field) {  // 这种情况理论上不会出现
        logger.warn('unknown tableSchema col: %o', col);
        return;
      }

      // 用户自己配置的render最优先
      if (field.render) {
        logger.debug('bind user-defined render for field %o', field);
        col.render = field.render.bind(innerTableComponent);  // 绑定this
      }
      // 对于某些showType我会给个默认的render
      else if (field.showType === 'image') {
        logger.debug('bind image render for field %o', field);
        col.render = this.getImageRender()(onClickImage);
      } else if (field.showType === 'file') {
        logger.debug('bind file render for field %o', field);
        col.render = this.getFileRender;
      } else if (field.key === ACTION_KEY && field.actions && field.actions.length > 0) {
        logger.debug('bind actions render for field %o', field);
        col.render = this.getActionRender(field, primaryKey)(onSingleRecordUpdate, onSingleRecordDelete, onSingleRecordComponent);
      }
    });

    const ignoreCache = TableUtils.shouldIgnoreSchemaCache(tableName);
    if (!ignoreCache) {
      this.tableNameSet.add(tableName);
    }
    return tableSchema;
  },

  /**
   * 针对image字段的render方法
   *
   * @returns {function(): function()}
   */
  getImageRender() {
    return onClickImagePreview => text => {
      if (Utils.isString(text)) {
        return <img src={text} alt="图片加载失败" style={{width: '100%'}} onClick={e => onClickImagePreview(text)}/>
      } else if (text instanceof Array) {
        // 如果是多张图片, 只取第一张图片在表格中显示
        return <img src={text[0]} alt="图片加载失败" style={{width: '100%'}} onClick={e => onClickImagePreview(text)}/>
      }

      return null;
    }
  },

  /**
   * 针对file字段的render方法
   *
   * @param text
   * @returns {*}
   */
  getFileRender(text) {
    if (Utils.isString(text) && text.length > 0) {
      // 单个文件, 显示为超链接
      return <a href={text} target="_blank">{text.substr(text.lastIndexOf('/') + 1)}</a>;
    } else if (text instanceof Array) {
      if (text.length === 0) {
        return null;
      }
      // 多个文件, 显示为一组超链接
      const urlArray = [];
      urlArray.push(<a key={0} href={text[0]} target="_blank">{text[0].substr(text[0].lastIndexOf('/') + 1)}</a>);
      for (let i = 1; i < text.length; i++) {
        urlArray.push(<br key={ -1 - i }/>);
        urlArray.push(<a key={i} href={text[i]} target="_blank">{text[i].substr(text[i].lastIndexOf('/') + 1)}</a>);
      }
      return <div>{urlArray}</div>;
    }

    return null;
  },

  /**
   * 渲染自定义操作列
   *
   * @param field
   * @param primaryKey
   * @returns {function(): function()}
   */
  getActionRender(field, primaryKey) {
    // 返回一个高阶函数, 输入是3个函数
    // 1. singleRecordUpdate用于更新单条记录的函数, 参数是(record:记录本身, updateKeys:要更新哪些字段)
    // 2. singleRecordDelete用于删除单条记录, 参数是record
    // 3. singleRecordComponent用于自定义组件实现单条记录的更新, 参数是(record:记录本身, component:要渲染的组件, name:在modal中显示时的标题)

    return (singleRecordUpdate, singleRecordDelete, singleRecordComponent) => (text, record) => {
      const actions = field.actions;
      const actionArray = [];

      // 最后一个push到array中的元素是否是分割符? 为了排版好看要处理下
      let lastDivider = false;
      for (let i = 0; i < actions.length; i++) {
        const action = actions[i];
        // visible函数用于控制当前行是否显示某个操作
        if (action.visible && !action.visible(record)) {
          continue;
        }

        // 如果没有定义主键, 不允许更新/删除
        if (!primaryKey && (action.type === 'update' || action.type === 'delete')) {
          continue;
        }

        // 换行符, 单纯为了美观
        if (action.type === 'newLine') {
          // 是否要去掉上一个分隔符
          if (lastDivider) {
            actionArray.pop();
          }
          actionArray.push(<br key={i}/>);
          lastDivider = false;
          continue;
        }

        // 要push到actionArray的元素
        let tmp;
        switch (action.type) {
          // 更新单条记录, 可以控制更新哪些字段
          case 'update':
            tmp = <a href="#" key={i}
                     onClick={e => {e.preventDefault();singleRecordUpdate(record, action.keys);}}>
              {action.name}
            </a>;
            break;
          // 删除单条记录
          case 'delete':
            tmp = <a href="#" key={i}
                     onClick={e => {e.preventDefault();singleRecordDelete(record);}}>
              {action.name}
            </a>;
            break;
          // 自定义组件
          case 'component':
            tmp = <a href="#" key={i}
                     onClick={e => {e.preventDefault();singleRecordComponent(record, action.component, action.name);}}>
              {action.name}
            </a>;
            break;
          default:
            // 如果type不是预定义的几种, 就看用户是否自定义了render函数
            if (action.render) {
              tmp = <span key={i}>{action.render(record)}</span>;
            }
        }

        // 如果还是不行, 那就说明用户定义的action格式有问题, 忽略
        if (!tmp) {
          continue;
        }

        actionArray.push(tmp);
        actionArray.push(<span key={ -1 - i } className="ant-divider"/>);  // 分隔符
        lastDivider = true;
      }
      // 去除最后一个分隔符, 为了美观
      if (lastDivider) {
        actionArray.pop();
      }
      return <span>{actionArray}</span>
    }
  },

};

export default RenderUtils;
export {ACTION_KEY};
