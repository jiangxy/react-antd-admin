import React from 'react';
import {message, notification} from 'antd';
import Error from '../Error';
import InnerForm from './InnerForm.js';
import InnerTable from './InnerTable.js';
import InnerPagination from './InnerPagination.js';
import './index.less';
import ajax from '../../utils/ajax';
import Utils from '../../utils';
import globalConfig from '../../config.js';
import Logger from '../../utils/Logger';

const logger = Logger.getLogger('DBTable');

/**
 * 操作数据库中的一张表的组件, 又可以分为3个组件: 表单+表格+分页器
 */
class DBTable extends React.PureComponent {

  // 每个表的默认配置
  static DEFAULT_CONFIG = {
    showExport: true,  // 显示导出按钮, 默认true
    showImport: true,  // 显示导入按钮, 默认true
    showInsert: true,  // 显示新增按钮, 默认true
    showUpdate: true,  // 显示修改按钮, 默认true
    showDelete: true,  // 显示删除按钮, 默认true
  };

  // 父组件要保存子组件的状态...非常蛋疼...
  // 破坏了子组件的"封闭"原则
  // 但这是官方推荐的做法: https://facebook.github.io/react/docs/lifting-state-up.html

  // 注意: 向父组件传状态, 通过回调函数的形式
  // 从父组件接收状态, 通过props的形式

  state = {
    // 表单组件的状态
    queryObj: {},  // 表单中的查询条件

    // 表格组件的状态
    data: [],  // 表格中显示的数据
    tableLoading: false,  // 表格是否是loading状态

    // 分页器的状态
    currentPage: 1,  // 当前第几页, 注意页码是从1开始的, 以前总是纠结页码从0还是1开始, 这里统一下, 跟显示给用户的一致
    pageSize: globalConfig.DBTable.pageSize || 50,  // pageSize默认值50, 这个值一旦初始化就是不可变的
    total: 0,  // 总共有多少条数据
  };

  // 代替componentWillMount
  constructor(props) {
    super(props);
    // 处理url参数
    this.processQueryParams();
    // 组件初始化时尝试获取schema
    this.tryFetchSchema(props);
  }

  /**
   * 刚进入页面时触发一次查询
   */
  componentDidMount() {
    this.refresh();
  }

  // 在react router中切换时, 组件不会重新mount, 只有props会变化
  componentWillReceiveProps(nextProps) {
    // 普通模式下, 所有的CRUD操作都是通过同一个DBTable组件进行的, 只是传入的tableName不同而已
    // 但是在tab模式下, 为了防止不同tab之间的干扰, 每个tab下都必须是一个"独立"的组件, 换句话说有很多不同DBTable组件的实例
    // 类似单例和多实例的区别
    if (globalConfig.tabMode.enable === true) {
      logger.debug('ignore props update under tabMode');
      return;
    }

    logger.debug('receive new props and try to render, nextProps = %o', nextProps);
    // 应该只有react router会触发这个方法
    if (nextProps.routes) {
      // 如果表名不变的话, 没必要重新加载schema/refresh, 直接return
      const routes = nextProps.routes;
      const nextTableName = routes[routes.length - 1].tableName;
      if (nextTableName === this.tableName) {
        return;
      }
    }

    // 在表名切换后要做什么?
    // 1. 根据新的表名重新获取schema
    // 2. 还原初始状态
    // 3. 调用一次refresh(), 重新查询数据

    this.tryFetchSchema(nextProps);  // 根据新的props重新获取配置
    // 下面两种写法有啥区别? setState vs 直接修改state
    // 似乎setState后的render不是"立即"发生的, 会导致下面refresh时有bug

    // this.setState({
    //   queryObj: {},
    //   data: [],
    //   tableLoading: false,
    //   currentPage: 1,
    //   pageSize: 50,
    //   total: 0,
    // });
    this.state.queryObj = {};
    this.state.data = [];
    this.state.tableLoading = false;
    this.state.currentPage = 1;
    // this.state.pageSize = 50;  // 这个pageSize不可变, 保持初始值
    this.state.total = 0;

    // 处理url参数
    this.processQueryParams();

    // 切换时也要重新查询一次数据
    this.refresh();
  }

  /**
   * 尝试获取某个表的querySchema和dataSchema
   * 无论是从远端获取还是从本地配置读取, 这个方法必须是同步的
   *
   * @param dbName
   * @param tableName
   */
  tryFetchSchema(props) {
    const routes = props.routes;
    // 这个tableName是路由表配置中传过来的
    // 可以用这个方法向组件传值
    const tableName = routes.pop().tableName;
    if (tableName) {
      logger.info('init component DBTable with tableName = %s', tableName);
    } else {
      logger.error('can not find tableName, check your router config');
      this.inited = false;  // 是否成功获取schema
      this.errorMsg = '找不到表名, 请检查路由配置';  // 如果没能成功获取schema, 错误信息是什么?
      return;
    }

    // 其实很多这种this.xxx变量也可以做成状态, 看情况了
    // 关键是这些变量变化时, 是否要触发重新render?
    this.tableName = tableName;

    // 尝试加载querySchema
    try {
      this.querySchema = require(`../../schema/${tableName}.querySchema.js`);
    } catch (e) {
      logger.error('load query schema error: %o', e);
      this.inited = false;
      this.errorMsg = `加载${tableName}表的querySchema出错, 请检查配置`;
      return;
    }

    // 尝试加载dataSchema
    try {
      this.dataSchema = require(`../../schema/${tableName}.dataSchema.js`);
    } catch (e) {
      logger.error('load data schema error: %o', e);
      this.inited = false;
      this.errorMsg = `加载${tableName}表的dataSchema出错, 请检查配置`;
      return;
    }

    // 尝试加载个性化配置, 加载失败也没影响
    try {
      const tableConfig = require(`../../schema/${tableName}.config.js`);
      this.tableConfig = Object.assign({}, DBTable.DEFAULT_CONFIG, tableConfig);   // 注意合并默认配置
    } catch (e) {
      logger.warn('can not find config for table %s, use default instead', tableName);
      this.tableConfig = DBTable.DEFAULT_CONFIG;
    }

    this.inited = true;
  }

  /**
   * 可以在url上加参数, 改变查询条件
   */
  processQueryParams() {
    // 这个方法可以算作一个后门, 甚至可以传入一些querySchema中没配置的参数, 只要后端能处理就可以
    const params = Utils.getAllQueryParams();
    // 如果url上有参数
    if (Object.keys(params).length > 0) {
      this.state.queryObj = Object.assign({}, this.state.queryObj, params);
    }
  }

  /**
   * 按当前的查询条件重新查询一次
   */
  refresh = async() => {
    const res = await this.select(this.state.queryObj, this.state.currentPage, this.state.pageSize);
    //message.success('查询成功');
    if (res.success) {
      this.setState({
        data: res.data,
        total: res.total,
        tableLoading: false,
      });
    } else {
      this.error(res.message);
    }
  };

  /**
   * 弹出错误信息
   *
   * @param errorMsg
   */
  error = (errorMsg) => {
    // 对于错误信息, 要很明显的提示用户, 这个通知框要用户手动关闭
    notification.error({
      message: '出错啦!',
      description: `请联系管理员, 错误信息: ${errorMsg}`,
      duration: 0,
    });
    this.setState({tableLoading: false});
  };

  /**
   * 向服务端发送select请求
   *
   * @param queryObj 包含了form中所有的查询条件, 再加上page和pageSize, 后端就能拼成完整的sql
   * @param page
   * @param pageSize
   * @returns {Promise}
   */
  async select(queryObj, page, pageSize) {
    // 为啥这个方法不用箭头函数, 但也不会有this的问题呢? 我猜测是因为这个方法都是被其他箭头函数调用的, 所以也会自动bind this
    // 同理上面的error函数似乎也不需要是箭头函数
    const tmpObj = Object.assign({}, queryObj);  // 创建一个新的临时对象, 其实直接修改queryObj也可以
    tmpObj.page = page;
    tmpObj.pageSize = pageSize;

    // 每次查询时, 要显示一个提示, 同时table组件也要变为loading状态
    const hide = message.loading('正在查询...', 0);
    try {
      const CRUD = ajax.CRUD(this.tableName);
      this.setState({tableLoading: true});
      const res = await CRUD.select(tmpObj);
      // 请求结束后, 提示消失, 但不要急着还原tableLoading的状态, 让上层调用的方法去还原
      hide();
      return res;
    } catch (ex) {  // 统一的异常处理, 上层方法不用关心
      logger.error('select exception, %o', ex);
      hide();
      const res = {};  // 手动构造一个res返回
      res.success = false;
      res.message = `网络请求出错: ${ex.message}`;
      return Promise.resolve(res);  // 还是要返回一个promise对象
    }
  }

  /**
   * 切换分页时触发查询
   *
   * @param page
   */
  handlePageChange = async(page) => {
    logger.debug('handlePageChange, page = %d', page);
    const res = await this.select(this.state.queryObj, page, this.state.pageSize);
    if (res.success) {
      this.setState({
        currentPage: page,
        data: res.data,
        total: res.total,
        tableLoading: false,
      });
    } else {
      this.error(res.message);
    }
  };

  /**
   * 点击提交按钮时触发查询
   *
   * @param queryObj
   */
  handleFormSubmit = async(queryObj) => {
    logger.debug('handleFormSubmit, queryObj = %o', queryObj);
    // 这时查询条件已经变了, 要从第一页开始查
    const res = await this.select(queryObj, 1, this.state.pageSize);
    if (res.success) {
      this.setState({
        currentPage: 1,
        data: res.data,
        total: res.total,
        tableLoading: false,
        queryObj: queryObj,
      });
    } else {
      this.error(res.message);
    }
  };

  render() {
    // 如果没能成功加载schema, 显示错误信息
    if (!this.inited) {
      return (
        <Error errorMsg={this.errorMsg}/>
      );
    }

    // 1. 之前传props是直接{...this.state}, 感觉会影响效率, 传很多无用的属性
    // 2. 父组件传进去的方法名都是parentHandleXXX
    // 3. InnerForm和InnerPagination都是无状态的, 但InnerTable还是要维护自己的一些状态

    return (
      <div>
        <InnerForm parentHandleSubmit={this.handleFormSubmit} schema={this.querySchema} tableConfig={this.tableConfig}
                   tableName={this.tableName}/>
        <InnerTable data={this.state.data} tableLoading={this.state.tableLoading}
                    schema={this.dataSchema} refresh={this.refresh}
                    tableConfig={this.tableConfig} tableName={this.tableName}/>
        <InnerPagination currentPage={this.state.currentPage} total={this.state.total} pageSize={this.state.pageSize}
                         parentHandlePageChange={this.handlePageChange} tableConfig={this.tableConfig}
                         tableName={this.tableName}/>
      </div>
    );
  }

}

export default DBTable;
