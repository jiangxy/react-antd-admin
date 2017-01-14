import React from 'react';
import {BackTop} from 'antd';
import globalConfig from 'config.js';
import './index.less';

/**
 * 定义Footer组件
 */
class Footer extends React.PureComponent {

  render() {
    const text = globalConfig.footer || 'footer被弄丢啦!';

    // backtop如果不设置target会有问题
    // footer的字可以有html标签, 有一定XSS的风险, 不过问题不大
    return (
      <div>
        <BackTop target={() => document.getElementById('main-content-div')}/>
        <div className="ant-layout-footer" dangerouslySetInnerHTML={{ __html: text }}/>
      </div>
    );
  }

}

export default Footer;
