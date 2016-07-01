import React from 'react';
import Header from '../Header';
import Footer from '../Footer';
import Sidebar from '../Sidebar';
import 'antd_css';
import './index.less';

/**
 * App组件
 * 定义整个页面的布局
 */
class App extends React.Component {

  render() {
    return (
      <div className="ant-layout-aside">
        {/*整个页面被一个ant-layout-aside的div包围, 分为sidebar/header/footer/content等几部分*/}
        <Sidebar />
        <div className="ant-layout-main">
          <Header userName="jiangxiyang"/>

          {/*TODO: 这里要组件化*/}
          <div className="ant-layout-container">
            <div className="ant-layout-content">
              <div style={{ height: 590 }}>
                {this.props.children}
              </div>
            </div>
          </div>

          <Footer />
        </div>
      </div>
    );
  }

}


export default App;
