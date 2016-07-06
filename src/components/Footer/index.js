import React from 'react';
import {BackTop} from 'antd';
import globalConfig from 'config.js';

/**
 * 定义Footer组件
 */
class Footer extends React.Component {

  render() {
    return (
      <div>
        <BackTop />
        <div className="ant-layout-footer">
          {globalConfig.footer || 'footer被弄丢啦!'}
        </div>
      </div>
    );
  }

}

export default Footer;
