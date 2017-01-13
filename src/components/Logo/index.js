import React from 'react';
import globalConfig from 'config.js';
import './index.less';

/**
 * 定义Logo组件
 */
class Logo extends React.PureComponent {

  render() {
    return (
      <div className={this.props.collapse ? "ant-layout-logo-collapse" : "ant-layout-logo-normal"}>
        <div className="ant-layout-logo-text">
          {/*侧边栏折叠的时候只显示一个字*/}
          <a href="#">{this.props.collapse ? globalConfig.name[0] : globalConfig.name}</a>
        </div>
      </div>
    );
  }

}

export default Logo;
