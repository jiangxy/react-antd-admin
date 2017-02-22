import Logger from './Logger';

const logger = new Logger('mockAjax');

const result = {  // 暂存mock的ajax返回, 总共有5个字段
  success: true,
  code: 0,
  message: 'just a mock ;) ',
  total: 10000,
  data: {},
};

// 模拟统一的延迟, 返回promise对象
const mockPromise = (callback) => {
  return new Promise(resolve => {
    setTimeout(callback, 2000, resolve);
  });
};

// 根据某个表的dataSchema创造mock数据
const mockResult = (tableName, queryObj) => {
  logger.debug('begin to mock data for table %s', tableName);

  // 尝试加载schema文件
  let schema;
  try {
    schema = require(`../schema/${tableName}.dataSchema.js`);
  } catch (e) {
    logger.error('can not find dataSchema file for table %s', tableName);
    // 设置返回结果为失败
    result.success = false;
    result.code = 200;
    result.message = `can not find dataSchema file for table ${tableName}`;
    return;
  }

  // 一般来说, 传入的查询条件都是肯定会有page/pageSize的, 以防万一
  if (!queryObj.page) {
    queryObj.page = 1;
  }
  if (!queryObj.pageSize) {
    queryObj.pageSize = 50;
  }

  const tmp = [];
  for (let i = 0; i < queryObj.pageSize; i++) {
    const record = {};
    // 为了让mock的数据有些区别, 把page算进去
    schema.forEach((column) => {
      if (column.dataType === 'int') {
        record[column.key] = 1000 * queryObj.page + i;
      } else if (column.dataType === 'float') {
        record[column.key] = 2.0 * queryObj.page + i * 0.01;
      } else if (column.dataType === 'varchar') {
        record[column.key] = `page=${queryObj.page} num=${i}`;
      } else if (column.dataType === 'datetime') {
        record[column.key] = new Date().plusDays(i).format('yyyy-MM-dd HH:mm:ss');
      } else {
        logger.error('unsupported dataType %s', column.dataType);
      }
    });
    tmp.push(record);
  }

  result.success = true;
  result.data = tmp;
};

/**
 * 模拟ajax请求用于调试, 一般而言只需mock业务相关方法
 */
class MockAjax {
  tableCache = new Map();

  getCurrentUser() {
    return mockPromise(resolve => {
      result.success = true;
      result.data = 'guest';
      resolve(result);
    });
  }

  login(username, password) {
    return mockPromise(resolve => {
      if (username === 'guest' && password === 'guest') {
        result.success = true;
        result.data = 'guest';
        resolve(result);
      } else {
        result.success = false;
        result.code = 100;
        result.message = 'invalid username or password';
        resolve(result);
      }
    });
  }

  CRUD(tableName) {
    if (this.tableCache.has(tableName)) {
      return this.tableCache.get(tableName);
    }

    const util = new MockCRUDUtil(tableName);
    this.tableCache.set(tableName, util);
    return util;
  }
}

class MockCRUDUtil {
  constructor(tableName) {
    this.tableName = tableName;
  }

  select(queryObj) {
    return mockPromise(resolve => {
      mockResult(this.tableName, queryObj);
      resolve(result);
    });
  }

  insert(dataObj) {
    return mockPromise(resolve => {
      mockResult(this.tableName, {page: Math.floor(Math.random() * 10000), pageSize: 1});  // 为了生成一个主键, 反正是测试用的
      const tmpObj = result.data[0];
      Object.assign(tmpObj, dataObj);
      result.success = true;
      result.data = tmpObj;
      resolve(result);
    });
  }

  update(keys = [], dataObj) {
    return mockPromise(resolve => {
      result.success = true;
      result.data = keys.length;
      resolve(result);
    });
  }

  delete(keys = []) {
    return mockPromise(resolve => {
      result.success = true;
      result.data = keys.length;
      resolve(result);
    });
  }
}

export default MockAjax;
