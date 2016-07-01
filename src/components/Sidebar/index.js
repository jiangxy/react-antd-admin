import React from 'react';
import {Link} from 'react-router';
import {Menu, Icon} from 'antd';
import Logo from '../Logo';
import items from './menu.js';   // just for test
import './index.less';


const SubMenu = Menu.SubMenu;

/**
 * 定义sidebar组件
 */
class Sidebar extends React.Component {

  /**
   * 将菜单项配置转换为对应的MenuItem组件
   *
   * @param obj sidebar菜单配置项
   * @returns {XML}
   */
  transFormMenuItem(obj) {
    // 这个表达式还是有点恶心的...
    // JSX虽然方便, 但是很容易被滥用, ES6也是
    return (
      <Menu.Item key={`key${obj.key}`}>
        {obj.icon && <Icon type={obj.icon}/>}{obj.link ? <Link to={obj.link}>{obj.name}</Link> : obj.name}
      </Menu.Item>
    );
  }


  foo = (bar) => {
    var o1 = {a: 1};
    var o2 = {b: 2};
    var o3 = {c: 3};

    var obj = Object.assign(o1, o2, o3);

    console.log(o1);
    console.log(["a", "b", "c"].includes("a"));

    this.helloWorld(true).then(function (message) {
      console.log(message);
    }, function (error) {
      console.log(error);
    });

    console.log(bar);
    window.location.hash = "/hello";
    return false;
  }

  helloWorld(ready) {
    return new Promise(function (resolve, reject) {
      if (ready) {
        resolve("Hello World!");
      } else {
        reject("Good bye!");
      }
    });
  }

  render() {
    // ES6写法
    const menu = items.map((item) => {   // 菜单项是从配置中读取的, parse过程还是有点复杂的
      // 是否有子菜单?
      if (item.child) {
        return (
          <SubMenu key={`sub${item.key}`} title={<span><Icon type={item.icon} />{item.name}</span>}>
            {item.child.map((node) => {
              if (node.child) {

              } else {
                return this.transFormMenuItem(node);
              }
            })}
          </SubMenu>
        )
      }
      // 没有子菜单, 直接转换为MenuItem
      else {
        return this.transFormMenuItem(item);
      }
    });


    // 这些样式其实是在App/index.less中定义的
    return (
      <aside className="ant-layout-sider">
        <Logo />
        <Menu theme="dark"
              mode="inline"
        >

          <SubMenu key="sub1" title={<span><Icon type="appstore" /><span>导航1</span></span>} onTitleClick={this.foo}>
          </SubMenu>
          <SubMenu key="sub2" title={<span><Icon type="appstore" /><span>导航二</span></span>}>
            <Menu.Item key="5">选项5</Menu.Item>
            <Menu.Item key="6">选项6</Menu.Item>
            <SubMenu key="sub3" title="三级导航">
              <Menu.Item key="7">选项7</Menu.Item>
              <Menu.Item key="8">选项8</Menu.Item>
            </SubMenu>
          </SubMenu>
          <SubMenu key="sub4" title={<span><Icon type="setting" /><span>导航三</span></span>}>
            <Menu.Item key="9">选项9</Menu.Item>
            <Menu.Item key="10">选项10</Menu.Item>
            <Menu.Item key="11">选项11</Menu.Item>
            <Menu.Item key="12">选项12</Menu.Item>
          </SubMenu>
        </Menu>
      </aside>
    );
  }

}

export default Sidebar;
