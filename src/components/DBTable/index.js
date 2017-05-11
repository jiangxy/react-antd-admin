import React from 'react';
import {message, notification, Spin} from 'antd';
import Error from '../Error';
import InnerForm from './InnerForm.js';
import InnerTable from './InnerTable.js';
import InnerPagination from './InnerPagination.js';
import TableUtils from './TableUtils.js';
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

  // 父组件要保存子组件的状态...非常蛋疼...
  // 破坏了子组件的"封闭"原则
  // 但这是官方推荐的做法: https://facebook.github.io/react/docs/lifting-state-up.html

  // 注意: 向父组件传状态, 通过回调函数的形式
  // 从父组件接收状态, 通过props的形式

  state = {
    // 本身的状态
    loadingSchema: false,  // 是否正在从远程加载schema

    // 表单组件的状态
    queryObj: {},  // 表单中的查询条件

    // 表格组件的状态
    data: [],  // 表格中显示的数据
    tableLoading: false,  // 表格是否是loading状态

    // 分页器的状态
    currentPage: 1,  // 当前第几页, 注意页码是从1开始的, 以前总是纠结页码从0还是1开始, 这里统一下, 跟显示给用户的一致
    pageSize: globalConfig.DBTable.pageSize || 50,  // pageSize默认值50, 这个值一旦初始化就是不可变的
    showSizeChanger: globalConfig.DBTable.showSizeChanger, // 是否显示修改每页显示数量的选项
    pageSizeOptions: globalConfig.DBTable.pageSizeOptions, // 每页面显示数量选项
    total: 0,  // 总共有多少条数据
  };


  // 这里有个很有意思的问题, 就是异步操作的局限性, 你没办法控制callback何时被调用
  // 我本来的写法是这样的:
  // async componentWillMount() {
  //   // tryFetchSchema方法可能是同步也可能是异步, 跟tableConfig.asyncSchema有关
  //   // 如果是同步调用, 会直接返回一个resolved状态的promise
  //   // 如果是异步调用, 会返回一个pending状态的promise
  //   // 注意, 所有async方法, 直接调用的话, 必然会返回promise, 这是语言特性决定的
  //   const res = await this.tryFetchSchema(this.props);
  //   this.updateTableState(res);
  //   if (this.state.loadingSchema) {
  //     this.setState({loadingSchema: false}, this.refresh);
  //   }
  // }
  // 注意其中的tryFetchSchema可能同步也可能异步
  // 我本来期望着如果是同步调用的话, 下面的updateTableState语句会立刻执行, 如果是异步调用, 就等异步操作结束后再执行updateTableState
  // 但实际情况是, 即使是同步调用(直接返回一个resolved状态的promise), 下面的代码也不会立刻执行
  // 这可能和async函数的特性有关, 即使直接return一个常量, 也会被当作异步操作对待
  // async/await语义只保证语句的"执行顺序", 而不保证执行的"间隔"
  // 同理, 各种回调都是不能保证事件发生后"立即"被执行的, 这是js event loop的局限, 也许应该说是"特性"?

  // 于是我只能改成下面这种普通的callback方式, 手动控制何时执行callback, 不能用async/await了
  // 如果是同步操作就立刻执行callback, 否则等异步操作结束再执行callback

  // 另一个有意思的问题就是, 如果将react的生命周期方法做成async的会怎样?
  // 关键要了解async函数的执行逻辑, 尤其是多个async函数嵌套时, 了解代码执行权的交换过程
  // 如果知道async/await的本质就是生成器, 而生成器的本质就是协程, 那就很好理解了


  componentWillMount() {
    // 处理url参数
    this.processQueryParams();
    // 组件初始化时尝试获取schema
    this.tryFetchSchema(this.props, (res) => {
      this.updateTableState(res);
      // 这个参数用于判断获取schema是同步还是异步
      if (this.state.loadingSchema) {
        this.setState({loadingSchema: false}, this.refresh);
      }
    });
  }

  /**
   * 刚进入页面时触发一次查询
   */
  componentDidMount() {
    // 如果是异步获取schema的话, 后面有callback会调用refresh的, 这里就不用调了
    if (!this.state.loadingSchema) {
      this.refresh();
    }
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

    // FIXME: hack, 和App组件中componentWillReceiveProps方法类似
    const action = this.props.location.action;
    if (action === 'PUSH') {
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

    // 和组件挂载时类似, 同样注意区分同步/异步
    this.tryFetchSchema(nextProps, (res) => {
      this.updateTableState(res);
      // 处理url参数
      this.state.queryObj = {};
      this.processQueryParams();
      this.setState({
        data: [],
        tableLoading: false,
        currentPage: 1,
        total: 0,
        loadingSchema: false,
      }, this.refresh);
    });
  }

  /**
   * 尝试获取schema, 可能是同步也可能是异步
   * 获取schema成功后, 调用回调
   *
   * @param props
   * @param callback
   * @returns {undefined}
   */
  async tryFetchSchema(props, callback) {
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

    const tableConfig = TableUtils.getTableConfig(tableName);

    // 这里注意, 区分同步/异步
    let tmp = TableUtils.getCacheSchema(tableName);
    if (!tmp) {
      if (tableConfig.asyncSchema === true) {
        // 如果是异步的, 必须给用户一个loading提示
        this.state.loadingSchema = true;
        tmp = await TableUtils.getRemoteSchema(tableName);
      } else {
        tmp = TableUtils.getLocalSchema(tableName);
      }
    }

    const res = {...tmp, tableName, tableConfig};
    callback(res);
  }

  /**
   * fetch schema后, 更新当前组件的状态, 主要是更新一些this.XXX变量
   * 必须和tryFetchSchema方法配合使用
   *
   * @param input
   */
  updateTableState(input) {
    // 其实很多这种this.xxx变量也可以做成状态, 看情况了
    // 关键是这些变量变化时, 是否要触发重新render?

    // 这两项是肯定会有的
    this.tableName = input.tableName;
    this.tableConfig = input.tableConfig;

    if (input.querySchema) {
      this.querySchema = input.querySchema;
    } else {
      this.inited = false;
      this.errorMsg = `加载${input.tableName}表的querySchema出错, 请检查配置`;
      return;
    }

    if (input.dataSchema) {
      this.dataSchema = input.dataSchema;
    } else {
      this.inited = false;
      this.errorMsg = `加载${input.tableName}表的dataSchema出错, 请检查配置`;
      return;
    }

    // 如果一切正常, 设置init=true
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
    // 如果加载schema失败, 就不要查询了
    if (!this.inited) {
      return;
    }

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
   * 切换每页显示数量时触发查询
   *
   * @param page
   */
  handleShowPageChange = async(page, pageSize) => {
    logger.debug('handleShowPageSizeChange, page = %d', page);
    const res = await this.select(this.state.queryObj, page, pageSize);
    if (res.success) {
      this.setState({
        currentPage: page,
        data: res.data,
        total: res.total,
        tableLoading: false,
        pageSize: pageSize,
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
    // 一段有些tricky的代码, 某些情况下显示一个特殊的loading
    // 主要是为了用户第一次进入的时候, 交互更友好
    // FIXME: 这段代码非常丑, (!this.inited && !this.errorMsg)这个条件是为了hack一个react-router的问题
    // 如果从首页点击侧边栏进入DBTable组件, 会依次触发componentWillMount和componentWillReceiveProps, 而直接从url进入的话则只会触发componentWillMount
    // 感觉react-router坑好多啊
    if (this.state.loadingSchema && (!this.notFirstRender || (!this.inited && !this.errorMsg))) {
      this.notFirstRender = true;
      return (
        <Spin tip="loading schema..." spinning={this.state.loadingSchema} delay={500}>
          <div style={{ height: '150px', width: '100%' }}></div>
        </Spin>
      );
    }
    this.notFirstRender = true;

    // 如果没能成功加载schema, 显示错误信息
    // 注意从错误信息切换到另一个表时, 也可能出现loading状态
    if (!this.inited) {
      return (
        <Spin tip="loading schema..." spinning={this.state.loadingSchema} delay={500}>
          <Error errorMsg={this.errorMsg}/>
        </Spin>
      );
    }

    // 1. 之前传props是直接{...this.state}, 感觉会影响效率, 传很多无用的属性
    // 2. 父组件传进去的方法名都是parentHandleXXX
    // 3. InnerForm和InnerPagination都是无状态的, 但InnerTable还是要维护自己的一些状态

    return (
      <Spin spinning={this.state.loadingSchema} delay={500}>
        <InnerForm parentHandleSubmit={this.handleFormSubmit} schema={this.querySchema} tableConfig={this.tableConfig}
                   tableName={this.tableName}/>
        <InnerTable data={this.state.data} tableLoading={this.state.tableLoading}
                    schema={this.dataSchema} refresh={this.refresh}
                    tableConfig={this.tableConfig} tableName={this.tableName}/>
        <InnerPagination currentPage={this.state.currentPage} total={this.state.total} pageSize={this.state.pageSize}
                         parentHandlePageChange={this.handlePageChange} tableConfig={this.tableConfig}
                         showSizeChanger={this.state.showSizeChanger} pageSizeOptions={this.state.pageSizeOptions}
                         parentHandleShowPageChange={this.handleShowPageChange}
                         tableName={this.tableName}/>
      </Spin>
    );
  }

}

export default DBTable;
