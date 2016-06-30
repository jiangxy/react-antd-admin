import React from 'react';
import { DatePicker } from 'antd';
import './index.less'
import 'antd_css'

class Hello extends React.Component {
  render() {
    return <div><h1 className="testStyle">Hello, world</h1><DatePicker /></div>;
  }
}

export default Hello;
