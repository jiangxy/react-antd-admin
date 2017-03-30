import React from 'react';
import {notification} from 'antd';
import globalConfig from '../../config.js';
import ajax from '../../utils/ajax';
import Logger from '../../utils/Logger';

const logger = Logger.getLogger('TableUtils');

// 缓存, key是tableName, value是{querySchema, dataSchema}
const tableMap = new Map();
// 缓存, key是tableName, value是tableConfig
const configMap = new Map();

/**
 * 用于解析表schema的工具类
 */
export default {

  // 将getSchema的函数分为3个, 分别用于不同情况
  // 其实就是从远程加载schema时比较特殊, 要显示一个loading提示给用户, 必须是async函数, 其他的就是普通的同步函数

  /**
   * 从缓存中获取schema
   *
   * @param tableName
   * @returns {V}
   */
  getCacheSchema(tableName){
    return tableMap.get(tableName);
  },

  /**
   * 从本地的js文件中读取schema, 会更新缓存
   *
   * @param tableName
   * @returns {{querySchema: *, dataSchema: *}}
   */
  getLocalSchema(tableName) {
    const ignoreCache = this.shouldIgnoreSchemaCache(tableName);
    let querySchema, dataSchema;

    try {
      querySchema = require(`../../schema/${tableName}.querySchema.js`);
      // 如果是忽略cache, 每次读取的schema都必须是全新的
      if (ignoreCache) {
        querySchema = querySchema.map(item => Object.assign({}, item));  // Object.assign是浅拷贝, 不过没啥影响
      }
    } catch (e) {
      logger.error('load query schema error: %o', e);
    }

    try {
      dataSchema = require(`../../schema/${tableName}.dataSchema.js`);
      if (ignoreCache) {
        dataSchema = dataSchema.map(item => Object.assign({}, item));
      }
    } catch (e) {
      logger.error('load data schema error: %o', e);
    }

    // 注意这里会更新缓存
    const toCache = {querySchema, dataSchema};
    if (!ignoreCache) {
      tableMap.set(tableName, toCache);
    }
    return toCache;
  },

  /**
   * 从远程获取某个表的schema, 如果有本地schema的话会合并
   * 这个方法会更新缓存
   *
   * @param tableName
   * @returns {{querySchema: *, dataSchema: *}}
   */
  async getRemoteSchema(tableName) {
    const ignoreCache = this.shouldIgnoreSchemaCache(tableName);
    const localSchema = this.getLocalSchema(tableName);

    let querySchema, dataSchema;
    try {
      const res = await ajax.CRUD(tableName).getRemoteSchema();
      logger.debug('get remote schema for table %s, res = %o', tableName, res);
      if (res.success) {
        querySchema = this.merge(localSchema.querySchema, res.data.querySchema);
        dataSchema = this.merge(localSchema.dataSchema, res.data.dataSchema);
      } else {
        logger.error('getRemoteSchema response error: %o', res);
        this.error(`请求asyncSchema失败: ${res.message}`);
      }
    } catch (e) {
      logger.error('getRemoteSchema network request error: %o', e);
      this.error(`请求asyncSchema时网络失败: ${e.message}`);
    }

    // 更新缓存
    const toCache = {querySchema, dataSchema};
    if (!ignoreCache) {
      tableMap.set(tableName, toCache);
    }
    return toCache;
  },

  /**
   * 合并本地的schema和远程的schema, 其实就是合并两个array
   *
   * @param local 本地schema
   * @param remote 远程schema
   * @returns {*}
   */
  merge(local, remote) {
    // 注意local和remote都可能是undefined
    // 只有二者都不是undefined时, 才需要merge
    if (local && remote) {
      const result = local;  // 合并后的结果

      const map = new Map();
      result.forEach(item => map.set(item.key, item));

      // 注意合并的逻辑: 如果远程的key本地也有, 就更新; 否则新增, 新增的列都放在最后
      remote.forEach(item => {
        if (map.has(item.key)) {
          // 注意传值vs传引用的区别
          Object.assign(map.get(item.key), item);
        } else {
          result.push(item);
        }
      });
      return result;
    } else {
      // 注意这个表达式
      return local || remote;
    }
  },

  /**
   * 弹出一个错误信息提示用户
   *
   * @param errorMsg
   */
  error(errorMsg) {
    notification.error({
      message: '出错啦!',
      description: `请联系管理员, 错误信息: ${errorMsg}`,
      duration: 0,
    });
  },

  /**
   * 获取某个表的个性化配置, 会合并默认配置
   *
   * @param tableName
   * @returns {*}
   */
  getTableConfig(tableName) {
    if (configMap.has(tableName)) {
      return configMap.get(tableName);
    }

    let tableConfig;
    try {
      const tmp = require(`../../schema/${tableName}.config.js`);  // 个性化配置加载失败也没关系
      tableConfig = Object.assign({}, globalConfig.DBTable.default, tmp);  // 注意合并默认配置
    } catch (e) {
      logger.warn('can not find config for table %s, use default instead', tableName);
      tableConfig = Object.assign({}, globalConfig.DBTable.default);
    }

    configMap.set(tableName, tableConfig);
    return tableConfig;
  },

  /**
   * 某个表是否应该忽略缓存
   *
   * @param tableName
   * @returns {boolean}
   */
  shouldIgnoreSchemaCache(tableName) {
    const tableConfig = this.getTableConfig(tableName);
    return tableConfig.asyncSchema === true && tableConfig.ignoreSchemaCache === true;
  },

}
