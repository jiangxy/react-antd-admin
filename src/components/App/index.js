import React from 'react';
import {connect} from 'react-redux'
import {Link} from 'react-router';
import {bindActionCreators} from 'redux'
import {Spin, message, Tabs, Icon} from 'antd';
import Header from '../Header';
import Footer from '../Footer';
import Sidebar from '../Sidebar';
import Login from '../Login';
import Breadcrumb from '../Breadcrumb';
import Welcome from '../Welcome';
import './index.less';
import globalConfig from 'config.js';
import ajax from '../../utils/ajax';
import Logger from '../../utils/Logger';
import sidebarMenu, {headerMenu} from '../../menu.js';
import {loginSuccessCreator} from '../../redux/Login.js';

const TabPane = Tabs.TabPane;
const logger = Logger.getLogger('App');

/**
 * App组件
 * 定义整个页面的布局
 */
class App extends React.Component {

  // App组件还是不要做成PureComponent了, 可能会有bug, 因为无法要求所有子组件都是pure的

  // 要清楚登录逻辑:
  // 1. 初始化时, 先尝试获取已登录的用户, 因为可能还留着上次登录的cookie
  // 2. 如果当前没有登录, 就跳转到Login组件, 手动输入用户名密码重新登录
  // 3. Login组件中登录成功后, 会触发一个loginSuccess action, 修改redux中的状态, 进而触发App组件的re-render

  state = {
    tryingLogin: true, // App组件要尝试登录, 在屏幕正中显示一个正加载的动画

    // tab模式相关的状态
    currentTabKey: '',  // 当前激活的是哪个tab
    tabPanes: [],  // 当前总共有哪些tab
  };

  /**
   * 组件挂载之前判断是否要更新tab
   */
  componentWillMount() {
    // 如果不是tab模式直接返回
    if (globalConfig.tabMode.enable !== true) {
      return;
    }

    this.tabTitleMap = this.parseTabTitle();
    this.updateTab(this.props);
  }

  /**
   * 每次在react-router中切换时也要判断是否更新tab
   */
  componentWillReceiveProps(nextProps) {
    // 如果不是tab模式直接返回
    if (globalConfig.tabMode.enable !== true) {
      return;
    }

    // FIXME: hack, 在react-router中切换时会触发这个方法两次, 据说是和hashHistory有关, 需要手动处理下
    const action = this.props.location.action;
    if (action === 'PUSH') {  // action有PUSH、POP、REPLACE等几种, 不太清楚分别是做什么用的
      return;
    }

    // FIXME: hack, 因为要区分react-router引起的re-render和redux引起的re-render
    if (this.props.collapse === nextProps.collapse) {
      this.updateTab(nextProps);
    }
  }

  /**
   * App组件挂载后要先尝试去服务端获取已登录的用户
   */
  async componentDidMount() {
    if (!this.props.login) {
      const hide = message.loading('正在获取用户信息...', 0);

      try {
        // 先去服务端验证下, 说不定已经登录了
        const res = await ajax.getCurrentUser();
        hide();

        // 注意这里, debug模式下每次刷新都必须重新登录
        if (res.success && !globalConfig.debug) {
          // 这里不需要setState了, 因为setState的目的是为了re-render, 而下一句会触发redux的状态变化, 也会re-render
          // 所以直接修改状态, 就是感觉这么做有点奇怪...
          this.state.tryingLogin = false;
          // App组件也可能触发loginSuccess action
          this.props.handleLoginSuccess(res.data);
        } else {
          this.handleLoginError('获取用户信息失败, 请重新登录');
        }
      } catch (e) {
        // 如果网络请求出错, 弹出一个错误提示
        logger.error('getCurrentUser error, %o', e);
        this.handleLoginError(`网络请求出错: ${e.message}`);
      }
    }
  }

  handleLoginError(errorMsg) {
    // 如果服务端说没有登录, 就要跳转到sso或者login组件
    if (globalConfig.isSSO() && !globalConfig.debug) {
      // debug模式不支持调试单点登录
      // 因为没有单点登录的地址啊...跳不回来
      logger.debug('not login, redirect to SSO login page');
      const redirect = encodeURIComponent(window.location.href);
      window.location.href = `${globalConfig.login.sso}${redirect}`;
    } else {
      message.error(errorMsg);
      logger.debug('not login, redirect to Login component');
      this.setState({tryingLogin: false});
    }
  }


  // 下面开始是tab相关逻辑


  /**
   * 解析menu.js中的配置, 找到所有叶子节点对应的key和名称
   *
   * @returns {Map}
   */
  parseTabTitle() {
    const tabTitleMap = new Map();

    const addItem = item => {
      if (item.url) {  // 对于直接跳转的菜单项, 直接忽略, 只有headerMenu中可能有这种
        return;
      }
      if (item.icon) {
        tabTitleMap.set(item.key, <span className="ant-layout-tab-text"><Icon type={item.icon}/>{item.name}</span>);
      } else {
        tabTitleMap.set(item.key, <span className="ant-layout-tab-text">{item.name}</span>);
      }
    };
    const browseMenu = item => {
      if (item.child) {
        item.child.forEach(browseMenu);
      } else {
        addItem(item);
      }
    };

    // 又是dfs, 每次用js写这种就觉得很神奇...
    sidebarMenu.forEach(browseMenu);
    headerMenu.forEach(browseMenu);

    // 最后要手动增加一个key, 对应于404页面
    tabTitleMap.set('*', <span className="ant-layout-tab-text"><Icon type="frown-o"/>Error</span>);
    return tabTitleMap;
  }

  /**
   * 根据传入的props决定是否要新增一个tab
   *
   * @param props
   */
  updateTab(props) {
    const routes = props.routes;
    let key = routes[routes.length - 1].path;  // react-router传入的key

    // 如果key有问题, 就直接隐藏所有tab, 这样简单点
    if (!key || !this.tabTitleMap.has(key)) {
      this.state.tabPanes.length = 0;
      return;
    }

    const tabTitle = this.tabTitleMap.get(key);

    // 如果允许同一个组件在tab中多次出现, 每次就必须生成唯一的key
    if (globalConfig.tabMode.allowDuplicate === true) {
      if (!this.tabCounter) {
        this.tabCounter = 0;
      }

      this.tabCounter++;
      key = key + this.tabCounter;
    }

    // 更新当前选中的tab
    this.state.currentTabKey = key;

    // 当前key对应的tab是否已经在显示了?
    let exist = false;
    for (const pane of this.state.tabPanes) {
      if (pane.key === key) {
        exist = true;
        break;
      }
    }

    // 如果key不存在就要新增一个tabPane
    if (!exist) {
      this.state.tabPanes.push({
        key,
        title: tabTitle,
        //content: React.cloneElement(props.children),  // 我本来是想clone一下children的, 这样比较保险, 不同tab不会互相干扰, 但发现似乎不clone也没啥bug
        content: props.children,
      });
    }
  }

  /**
   * 改变tab时的回调
   */
  onTabChange = (activeKey) => {
    this.setState({currentTabKey: activeKey});
  };

  /**
   * 关闭tab时的回调
   */
  onTabRemove = (targetKey) => {
    // 如果关闭的是当前tab, 要激活哪个tab?
    // 首先尝试激活左边的, 再尝试激活右边的
    let nextTabKey = this.state.currentTabKey;
    if (this.state.currentTabKey === targetKey) {
      let currentTabIndex = -1;
      this.state.tabPanes.forEach((pane, i) => {
        if (pane.key === targetKey) {
          currentTabIndex = i;
        }
      });

      // 如果当前tab左边还有tab, 就激活左边的
      if (currentTabIndex > 0) {
        nextTabKey = this.state.tabPanes[currentTabIndex - 1].key;
      }
      // 否则就激活右边的tab
      else if (currentTabIndex === 0 && this.state.tabPanes.length > 1) {
        nextTabKey = this.state.tabPanes[currentTabIndex + 1].key;
      }

      // 其实还有一种情况, 就是只剩最后一个tab, 但这里不用处理
    }

    // 过滤panes
    const newTabPanes = this.state.tabPanes.filter(pane => pane.key !== targetKey);
    this.setState({tabPanes: newTabPanes, currentTabKey: nextTabKey});
  };

  /**
   * 渲染界面右侧主要的操作区
   */
  renderBody() {
    // 我本来是在jsx表达式中判断globalConfig.tabMode.enable的, 比如{globalConfig.tabMode.enable && XXX}
    // 后来想会不会拿到外面去判断好些, webpack会不会把这个语句优化掉? 好像有一些类似的机制
    // 因为在编译的时候, globalConfig.tabMode.enable的值已经是确定的了, 下面的if-else其实是可以优化的
    // 如果是jsx表达式那种写法, 感觉不太可能优化

    // tab模式下, 不显示面包屑
    if (globalConfig.tabMode.enable === true) {
      // 如果没有tab可以显示, 就显示欢迎界面
      if (this.state.tabPanes.length === 0) {
        return <div className="ant-layout-container"><Welcome /></div>;
      } else {
        return <Tabs activeKey={this.state.currentTabKey} type="editable-card"
                     onEdit={this.onTabRemove} onChange={this.onTabChange}
                     hideAdd className="ant-layout-tab">
          {this.state.tabPanes.map(pane => <TabPane tab={pane.title} key={pane.key}
                                                    closable={true}>{pane.content}</TabPane>)}
        </Tabs>;
      }
    }
    // 非tab模式, 显示面包屑和对应的组件
    else {
      return <div>
        <Breadcrumb routes={this.props.routes}/>
        <div className="ant-layout-container">
          {this.props.children}
        </div>
      </div>;
    }
  }


  render() {
    // 显示一个加载中
    if (this.state.tryingLogin) {
      return <div className="center-div"><Spin spinning={true} size="large"/></div>;
    }

    // 跳转到登录界面
    if (!this.props.login) {
      return <Login />;
    }

    // 正常显示
    return (
      <div className="ant-layout-base">
        {/*整个页面被一个ant-layout-base的div包围, 分为sidebar/header/footer/content等几部分*/}
        <Sidebar />

        <div id="main-content-div" className={this.props.collapse ? 'ant-layout-main-collapse' : 'ant-layout-main'}>
          <Header userName={this.props.userName}/>
          {this.renderBody()}
          <Footer />
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    collapse: state.Sidebar.collapse,  // 侧边栏是否折叠
    login: state.Login.login,  // 是否登录
    userName: state.Login.userName,  // 登录后的用户名
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    handleLoginSuccess: bindActionCreators(loginSuccessCreator, dispatch),  // loginSuccess事件比较特殊, 不只Login组件会触发, App组件也会触发
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(App);
