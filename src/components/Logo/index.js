import React from 'react';
import globalConfig from 'config.js';
import './index.less';

/**
 * 定义Logo组件
 */
class Logo extends React.Component {

  render() {
    return (
      <div className="ant-layout-logo">
        <div className="logo-text">
          <a href="#">{globalConfig.name}</a>
        </div>
      </div>
    );
  }

}

export default Logo;
