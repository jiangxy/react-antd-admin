import React from 'react';
import {BackTop} from 'antd';

/**
 * 定义Footer组件
 */
class Footer extends React.Component {

  render() {
    return (
      <div>
        <BackTop />
        <div className="ant-layout-footer">
          xxx版权所有 © 2015-2016
        </div>
      </div>
    );
  }

}

export default Footer;
