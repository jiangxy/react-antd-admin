import React from 'react';
import {Breadcrumb} from 'antd';

/**
 * 定义面包屑导航, 由于和已有的组件重名, 所以改个类名
 */
class Bread extends React.Component {

  render() {
    return (
      <div className="ant-layout-breadcrumb">
        {/*TODO: 这里修改为动态的*/}
        <Breadcrumb {...this.props} />
      </div>
    );
  }

}

export default Bread;
