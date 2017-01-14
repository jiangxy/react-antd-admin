import React from 'react';
import {Breadcrumb, Icon} from 'antd';
import sidebarMenu, {headerMenu} from 'menu.js';  // 注意这种引用方式
import Logger from '../../utils/Logger';
import './index.less';

const Item = Breadcrumb.Item;
const logger = Logger.getLogger('Breadcrumb');

/**
 * 定义面包屑导航, 由于和已有的组件重名, 所以改个类名
 */
class Bread extends React.PureComponent {

  //static inited = false;  // 表示下面两个map是否初始化
  //static iconMap = new Map();  // 暂存menu.js中key->icon的对应关系
  //static nameMap = new Map();  // 暂存menu.js中key->name的对应关系

  // 上面两个map本来是做成static变量的, 后来感觉还是当成普通的成员变量好些
  // 如果是static变量, 那就跟react组件的生命周期完全没关系了

  // 话说, 虽然constructor和componentWillMount方法作用差不多, 但我还是觉得componentWillMount更好用
  // 因为constructor还要super(props), 有点啰嗦
  // 虽然react官方推荐constructor, 因为constructor中可以设置初始状态
  // 不过实际上初始状态可以直接通过定义成员变量的方式设置, 不一定要在constructor中
  componentWillMount() {
    // 准备初始化iconMap和nameMap
    const iconMap = new Map();
    const nameMap = new Map();

    // 这是个很有意思的函数, 本质是dfs, 但用js写出来就觉得很神奇
    const browseMenu = (item) => {
      nameMap.set(item.key, item.name);
      logger.debug('nameMap add entry: key=%s, value=%s', item.key, item.name);
      iconMap.set(item.key, item.icon);
      logger.debug('iconMap add entry: key=%s, value=%s', item.key, item.icon);

      if (item.child) {
        item.child.forEach(browseMenu);
      }
    };

    sidebarMenu.forEach(browseMenu);
    headerMenu.forEach(browseMenu);

    this.iconMap = iconMap;
    this.nameMap = nameMap;
  }

  render() {
    const itemArray = [];

    // 面包屑导航的最开始都是一个home图标, 并且这个图标是可以点击的
    itemArray.push(<Item key="systemHome" href="#"><Icon type="home"/> 首页</Item>);

    // this.props.routes是react-router传进来的
    for (const route of this.props.routes) {
      logger.debug('path=%s, route=%o', route.path, route);
      const name = this.nameMap.get(route.path);

      if (name) {
        const icon = this.iconMap.get(route.path);
        if (icon) {
          itemArray.push(<Item key={name}><Icon type={icon}/> {name}</Item>);  // 有图标的话带上图标
        } else {
          // 这个key属性不是antd需要的, 只是react要求同一个array中各个元素要是不同的, 否则有warning
          itemArray.push(<Item key={name}>{name}</Item>);
        }
      }
    }

    // 这个面包屑是不可点击的(除了第一级的home图标), 只是给用户一个提示
    return (
      <div className="ant-layout-breadcrumb">
        <Breadcrumb>{itemArray}</Breadcrumb>
      </div>
    );
  }

}

export default Bread;
