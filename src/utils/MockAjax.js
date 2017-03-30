import Logger from './Logger';
import {ACTION_KEY} from '../components/DBTable/InnerTableRenderUtils';

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
      // 对于自定义操作列, 无需mock数据
      if (column.key === ACTION_KEY) {
        return;
      }
      // 生成mock数据还是挺麻烦的, 要判断showType和dataType
      switch (column.showType) {
        case 'select':
          record[column.key] = mockOption(column);
          break;
        case 'radio':
          record[column.key] = mockOption(column);
          break;
        case 'checkbox':
          record[column.key] = mockOptionArray(column);
          break;
        case 'multiSelect':
          record[column.key] = mockOptionArray(column);
          break;
        case 'textarea':
          record[column.key] = `mock page=${queryObj.page} ${i}`;
          break;
        case 'image':
          record[column.key] = mockImage(column);
          break;
        case 'file':
          record[column.key] = mockFile(column);
          break;
        case 'cascader':
          record[column.key] = mockCascader(column);
          break;
        default:
          switch (column.dataType) {
            case 'int':
              record[column.key] = 1000 * queryObj.page + i;
              break;
            case 'float':
              record[column.key] = parseFloat(new Number(2.0 * queryObj.page + i * 0.1).toFixed(2));  // toFixed返回的是个string
              break;
            case 'varchar':
              record[column.key] = `mock page=${queryObj.page} ${i}`;
              break;
            case 'datetime':
              record[column.key] = new Date().plusDays(i).format('yyyy-MM-dd HH:mm:ss');
              break;
            default:
              logger.error('unsupported dataType %s', column.dataType);
          }
      }
    });
    tmp.push(record);
  }

  result.success = true;
  result.data = tmp;
};

// 模拟radio/select的数据
const mockOption = (field) => {
  const rand = Math.floor(Math.random() * field.options.length);
  return field.options[rand].key;
};

// 模拟checkbox/multiSelect的数据
const mockOptionArray = (field) => {
  const rand = Math.floor(Math.random() * field.options.length);
  const mockResult = [];
  for (let i = 0; i <= rand; i++) {
    mockResult.push(field.options[i].key);
  }
  return mockResult;
};

// 测试用的图片, 生成数据时会随机从这里面挑选
const testAvatarArray = [
  'http://jxy.me/about/avatar.jpg',
  'http://imgtu.5011.net/uploads/content/20170207/4051451486453572.jpg',
  'http://dynamic-image.yesky.com/600x-/uploadImages/upload/20140912/upload/201409/322l3se203jjpg.jpg',
];
const testImageArray = [
  'http://img.51ztzj.com/upload/image/20140506/dn201405074019_670x419.jpg',
  'http://img.51ztzj.com/upload/image/20170311/2017031104_670x419.jpg',
  'http://img.51ztzj.com//upload/image/20170311/2017031107_670x419.jpg',
  'http://img.51ztzj.com//upload/image/20130218/20130218011_670x419.jpg',
  'http://img.51ztzj.com//upload/image/20130218/2013021802_670x419.jpg'
];
// 模拟图片数据
const mockImage = (field) => {
  // 返回的是array还是string?
  if (field.max > 1) {
    const mockResult = [];
    const rand = Math.floor(Math.random() * field.max);
    for (let i = 0; i <= rand; i++) {
      mockResult.push(testImageArray[Math.floor(Math.random() * testImageArray.length)]);
    }
    return mockResult;
  } else {
    return testAvatarArray[Math.floor(Math.random() * testAvatarArray.length)];
  }
};
// 三驾马车啊, 虽然是十多年前的...
const testFileArray = [
  'https://static.googleusercontent.com/media/research.google.com/zh-CN//archive/gfs-sosp2003.pdf',
  'https://static.googleusercontent.com/media/research.google.com/zh-CN//archive/mapreduce-osdi04.pdf',
  'http://xpgc.vicp.net/course/svt/TechDoc/storagepaper/bigtable-osdi06.pdf',
];
// 模拟文件
const mockFile = (field) => {
  // 返回的是array还是string?
  if (field.max > 1) {
    const mockResult = [];
    const rand = Math.floor(Math.random() * field.max);
    for (let i = 0; i <= rand; i++) {
      mockResult.push(testFileArray[Math.floor(Math.random() * testFileArray.length)]);
    }
    return mockResult;
  } else {
    return testFileArray[Math.floor(Math.random() * testFileArray.length)];
  }
};

// 模拟级联选择的数据
const mockCascader = (field) => {
  const mockResult = [];
  const tmp = options => {
    const rand = Math.floor(Math.random() * options.length);
    mockResult.push(options[rand].value);
    if (options[rand].children) {
      tmp(options[rand].children);
    }
  };

  tmp(field.options);
  return mockResult;
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

  getRemoteSchema() {
    // 这个counter用于测试ignoreSchemaCache选项, 每次请求得到的服务端schema都是不同的
    if (!this.counter) {
      this.counter = 0;
    }
    this.counter++;
    return mockPromise(resolve => {
      if (this.tableName === 'testAction') {
        resolve({
          success: true,
          data: {
            querySchema: [
              {
                key: 'keyFromServer',
                title: `服务端key ${this.counter}`,
              },
              // 理论上来说服务端可以返回任意schema, 覆盖本地js的配置
              {
                key: 'type',
                options: [{key: '1', value: '来自服务端1'}, {key: '2', value: '来自服务端2'}, {key: '3', value: '来自服务端3'}],
                defaultValue: '2',
              },
            ],
            dataSchema: [
              // 服务端甚至可以修改showType
              {
                key: 'name',
                title: `选择姓名  ${this.counter}`,
                showType: 'radio',
                options: [{key: 'a', value: 'AA'}, {key: 'b', value: 'BB'}, {key: 'c', value: 'CC'}],
              },
            ],
          },
        });
      } else {
        resolve({success: true, data: {}});
      }
    });
  }
}

export default MockAjax;
