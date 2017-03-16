import React from 'react';
import {Slider, InputNumber, Row, Col, Rate} from 'antd';

/**
 * demo, 自定义组件实现单条数据更新
 */
class UpdateGPA1 extends React.PureComponent {
  state = {
    inputValue: 0,
  };

  componentWillMount() {
    // 当前选中的那条记录, 会以props.record的形式传进来
    this.state.inputValue = this.props.record.gpa;
  }

  componentWillReceiveProps(nextProps) {
    this.state.inputValue = nextProps.record.gpa;
  }

  onChange = (value) => {
    this.setState({inputValue: value});
  };

  /**
   * 自定义的组件如果实现了这个方法, DBTable组件就会根据返回结果去更新对应的记录
   * 如果不实现这个方法, 或者这个方法返回的是false/undefined, 那就不做任何事
   * 如果是antd的Form.create()包装过的组件, 就不用自己实现这个方法了
   *
   * @returns {{gpa: number}}
   */
  getFieldsValue() {
    // 更新当前选中记录的gpa字段
    return {gpa: this.state.inputValue};
  }

  render() {
    return (
      <Row>
        <Col span={12}>
          <Slider min={0.0} max={10.0} onChange={this.onChange} value={this.state.inputValue} step={0.01}/>
        </Col>
        <Col span={4}>
          <InputNumber min={0} max={10} style={{ marginLeft: 16 }} step={0.01} value={this.state.inputValue}
                       onChange={this.onChange}/>
        </Col>
      </Row>
    );
  }
}

/**
 * 另一个例子
 */
class UpdateGPA2 extends React.PureComponent {
  state = {
    inputValue: 0,
  };

  componentWillMount() {
    this.state.inputValue = this.props.record.gpa;
  }

  componentWillReceiveProps(nextProps) {
    this.state.inputValue = nextProps.record.gpa;
  }

  onChange = (value) => {
    this.setState({inputValue: value});
  };

  getFieldsValue() {
    return {gpa: this.state.inputValue};
  }

  render() {
    return (
      <span>
        <Rate count={10} allowHalf onChange={this.onChange} value={this.state.inputValue}/>
      </span>
    );
  }
}

export {UpdateGPA1, UpdateGPA2};
