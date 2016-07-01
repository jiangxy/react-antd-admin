import React from 'react';
import {Icon, Menu, Dropdown} from 'antd';
import './index.less';

const SubMenu = Menu.SubMenu;  // 为了使用方便

/**
 * 定义Header组件, 包括登录/注销的链接, 以及一些自定义链接
 */
class Header extends React.Component {

  render() {
    return (
      <div className='ant-layout-header'>
        {/*定义header中的菜单*/}
        <Menu className="header-menu" mode="horizontal">
          <SubMenu title={<span><Icon type="user" />{this.props.userName}</span>}>
            <Menu.Item key="setting:1">选项1</Menu.Item>
            <Menu.Item key="setting:2">选项2</Menu.Item>
            <Menu.Divider />
            <Menu.Item key="setting:3">注销</Menu.Item>
          </SubMenu>
          <Menu.Item key="mail">
            <Icon type="question-circle-o"/>帮助
          </Menu.Item>
        </Menu>
      </div>
    );
  }

}

export default Header;
