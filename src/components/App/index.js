import React from 'react';
import {Spin} from 'antd';
import Header from '../Header';
import Footer from '../Footer';
import Sidebar from '../Sidebar';
import Error from '../Error';
import Breadcrumb from '../Breadcrumb';
import './index.less';
import globalConfig from 'config.js';
import ajax from 'superagent';

/**
 * App组件
 * 定义整个页面的布局
 */
class App extends React.Component {

  constructor(props) {
    super(props);
    // 在组件刚初始化的时候验证登录
    const url = `${globalConfig.apiHost}/${globalConfig.apiPath}/${globalConfig.loginValidate}`;
    ajax.get(url).end((err, res) => {
      if (res && res.body && res.body.success) {
        this.setState({loading: false, login: true, userName: res.body.data});
      } else {
        this.setState({loading: false, login: false, errorMsg: err || res.body.errorMsg});
      }
    });
  }

  // 全局的状态
  state = {
    loading: true,  // 是否在loading状态
    login: false,  // 是否登录
    userName: '未登录',  // 登录后的用户名
    errroMsg: '',  // 错误信息
  }

  render() {
    return (
      <div className="ant-layout-aside">
        {/*整个页面被一个ant-layout-aside的div包围, 分为sidebar/header/footer/content等几部分*/}
        <Sidebar />

        <div className="ant-layout-main">

          <Spin spinning={this.state.loading} size="large">
            <Header userName={this.state.userName}/>
            <Breadcrumb {...this.props} />

            {/*TODO: 这里要组件化*/}
            <div className="ant-layout-container">
              <div className="ant-layout-content">
                {this.state.loading ? '' : this.state.login ? this.props.children :
                  <Error errorMsg={`登录验证失败: ${this.state.errorMsg}`}/>}
              </div>
            </div>

            <Footer />
          </Spin>

        </div>

      </div>
    );
  }

}

export default App;
