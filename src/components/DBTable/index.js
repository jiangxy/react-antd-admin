import React from 'react';
import {
  Form,
  Input,
  Row,
  Col,
  Button,
  DatePicker,
  Pagination,
  Select,
  Table,
  Icon,
  Radio,
  InputNumber,
  Checkbox,
  message,
  Modal
} from 'antd';
import Error from '../Error';
import './index.less';

const FormItem = Form.Item;
const ButtonGroup = Button.Group;
const RadioGroup = Radio.Group;
const CheckboxGroup = Checkbox.Group;
const Option = Select.Option;

const querySchema3 = [

  {
    key: 'score',
    title: '分数',
    dataType: 'varchar',
    queryType: 'normal',
    validate: {
      rules: [
        {required: true, min: 5, message: '用户名至少为 5 个字符'},
      ],
    },
  },

];


const querySchemaX = [
  {
    key: 'name',
    title: '用户名',
    placeholder: '请输入用户名',
    // 目前可用的dataType: int/float/varchar/datetime
    dataType: 'varchar',
    // normal就是一个输入框, 这时可以省略queryType字段
    // 传给后台的就是一个值, 至于后台用这个值做等值/大于/小于/like, 前端不关心
    // 目前可用的queryType: normal/select/radio/between
    // select和radio只能用于int和varchar
    // between只能用于int/float/datetime
    queryType: 'normal',
  },
  {
    key: 'age',
    title: '年龄',
    placeholder: '请输入年龄',
    dataType: 'int',
  },
  {
    key: 'weight',
    title: '体重(kg)',
    dataType: 'float',  // 小数统一保留2位
  },
  {
    key: 'type',
    title: '类型',
    dataType: 'int',
    queryType: 'select',  // 下拉框选择, dateType可以是int或varchar
    queryOptions: [{key: 1, value: '类型1'}, {key: 2, value: '类型2'}],
  },
  {
    key: 'userType',
    title: '用户类型',
    dataType: 'varchar',
    queryType: 'radio',  // 单选框, 和下拉框schema是一样的, 只是现实时有差别
    queryOptions: [{key: 'typeA', value: '类型A'}, {key: 'typeB', value: '类型B'}],
  },
  {
    key: 'score',
    title: '分数',
    dataType: 'int',
    queryType: 'between',  // 整数范围查询, 对于范围查询, 会自动生成xxBegin/xxEnd两个key
  },
  {
    key: 'gpa',
    title: 'GPA',
    dataType: 'float',
    queryType: 'between',  // 小数也可以范围查询, 固定两位小数
    placeholderBegin: '哈哈',
    placeholderEnd: '切克闹',
  },
  {
    key: 'height',
    title: '身高(cm)',
    dataType: 'float', // 小数等值查询
  },
  {
    key: 'duoxuan1',
    title: '多选1',
    dataType: 'int',
    queryType: 'checkbox',  // checkbox
    queryOptions: [{key: 1, value: '类型1'}, {key: 2, value: '类型2'}],
  },
  {
    key: 'duoxuan2',
    title: '多选2',
    dataType: 'varchar',
    queryType: 'multiSelect',  // 另一种多选
    queryOptions: [{key: 'type1', value: '类型1'}, {key: 'type2', value: '类型2'}],
  },
  {
    key: 'primarySchool',
    title: '入学日期',
    dataType: 'datetime', // 日期范围查询
    queryType: 'between',
  },
  {
    key: 'birthday',
    title: '出生日期',
    dataType: 'datetime',
    queryType: 'between',
  },
  {
    key: 'xxbirthday',
    title: 'XX日期',
    dataType: 'datetime', // 日期等值查询
  },
];

// dataSchema中必须要有一列叫做id
const dataSchemaX = [
  {
    key: 'id',
    title: 'ID',
    dataType: 'int',
  },
  {
    key: 'name',
    title: '用户名',
    dataType: 'varchar',
  },
  {
    key: 'score',
    title: '分数',
    dataType: 'int',
  },
  {
    key: 'gpa',
    title: 'GPA',
    dataType: 'float',
  },
];

const columns = [{
  title: '姓名',
  dataIndex: 'name',
  key: 'name',
  render: (text) => <a href="#">{text}</a>,
}, {
  title: '年龄',
  dataIndex: 'age',
  key: 'age',
}, {
  title: '住址',
  dataIndex: 'address',
  key: 'address',
}, {
  title: '操作',
  key: 'operadion',
  render: (text, record) => (
    <span>
      <a href="#">操作一{record.name}</a>
      <span className="ant-divider"></span>
      <a href="#">操作二</a>
      <span className="ant-divider"></span>
      <a href="#" className="ant-dropdown-link">
        更多 <Icon type="down"/>
      </a>
    </span>
  ),
}];

const data = [{
  key: '1',
  name: '胡彦斌',
  age: 32,
  address: '西湖区湖底公园1号',
}, {
  key: '2',
  name: '胡彦祖',
  age: 42,
  address: '西湖区湖底公园1号',
}, {
  key: '3',
  name: '李大嘴',
  age: 32,
  address: '西湖区湖底公园1号',
}, {
  key: '4',
  name: '李大嘴',
  age: 32,
  address: '西湖区湖底公园1号',
}, {
  key: '5',
  name: '李大嘴',
  age: 32,
  address: '西湖区湖底公园1号',
}, {
  key: '6',
  name: '李大嘴',
  age: 32,
  address: '西湖区湖底公园1号',
}, {
  key: '7',
  name: '李大嘴',
  age: 32,
  address: '西湖区湖底公园1号',
}, {
  key: '8',
  name: '李大嘴',
  age: 32,
  address: '西湖区湖底公园1号',
}, {
  key: '9',
  name: '李大嘴',
  age: 32,
  address: '西湖区湖底公园1号',
}, {
  key: '10',
  name: '李大嘴',
  age: 32,
  address: '西湖区湖底公园1号',
}, {
  key: '11',
  name: '李大嘴',
  age: 32,
  address: '西湖区湖底公园1号',
}, {
  key: '12',
  name: '李大嘴',
  age: 32,
  address: '西湖区湖底公园1号',
}, {
  key: '13',
  name: '李大嘴',
  age: 32,
  address: '西湖区湖底公园1号',
}, {
  key: '14',
  name: '李大嘴',
  age: 32,
  address: '西湖区湖底公园1号',
}, {
  key: '15',
  name: '李大嘴',
  age: 32,
  address: '西湖区湖底公园1号',
}, {
  key: '16',
  name: '李大嘴',
  age: 32,
  address: '西湖区湖底公园1号',
}, {
  key: '17',
  name: '李大嘴',
  age: 32,
  address: '西湖区湖底公园1号',
}, {
  key: '18',
  name: '李大嘴',
  age: 32,
  address: '西湖区湖底公园1号',
}, {
  key: '19',
  name: '李大嘴',
  age: 32,
  address: '西湖区湖底公园1号',
}];


/**
 * 操作数据库中的一张表的组件, 又可以分为3个组件: 表单+表格+分页器
 */
class DBTable extends React.Component {

  constructor(props) {
    super(props);
    // 要操作哪张表?
    const tableName = this.props.tableName;
    const dbName = this.props.dbName;

    // 这必须是个同步操作
    this.tryFetchSchema(dbName, tableName);
  }

  // 单向数据流的情况下, 父组件要保存子组件的所有状态...非常蛋疼...
  // 破坏了子组件的"封闭"原则

  state = {
    // 表单组件的状态
    queryObj: {},  // 表单中的查询条件

    // 表格组件的状态
    data: [],  // 表格中显示的数据
    tableLoading: false,  // 表格是否是loading状态
    selectedRowKeys: [],  // 当前有哪些行被选中, 这里只保存key
    selectedRows: [],  // 当前有哪些行被选中, 保存完整数据

    // 分页器的状态
    currentPage: 1,  // 当前第几页
    pageSize: 50,  // pageSize暂时不可修改, 固定50
    total: 0,  // 总共有多少条数据
  }


  // ajax请求返回的格式:
  // 成功: { total:50, data:[] }
  // 失败: { error: xxx }
  // 这个不是后端接口直接返回的格式, 要经过一步转换


  /**
   * 刚进入页面时触发一次查询
   */
  componentDidMount() {
    this.setState({tableLoading: true});
    this.mockAjax(this.state.queryObj, 1, this.state.pageSize).then((result) => {
      //message.success('查询成功');
      this.setState({currentPage: 1, data: result.data, total: result.total, tableLoading: false});
    }, (result) => {
      message.error(`'查询失败: '${result.error}`);
      this.setState({tableLoading: false});
    });
  }

  /**
   * 尝试获取某个表的querySchema和dataSchema
   * 无论是从远端获取还是从本地配置读取, 这个方法必须是同步的
   *
   * @param dbName
   * @param tableName
   */
  tryFetchSchema(dbName, tableName) {
    this.inited = true;  // 是否成功获取schema
    this.errorMsg = '测试测试';  // 如果没能成功获取schema, 错误信息是什么?
    this.querySchema = querySchemaX;  // 表单的schema
    this.dataSchema = dataSchemaX;  // 表格的schema
  }

  /**
   * 切换分页时触发查询
   *
   * @param page
   */
  handlePageChange = (page) => {
    this.setState({tableLoading: true});
    this.mockAjax(this.state.queryObj, page, this.state.pageSize).then((result) => {
      //message.success('查询成功');
      this.setState({
        currentPage: page,
        data: result.data,
        total: result.total,
        tableLoading: false,
        selectedRowKeys: [],
        selectedRows: [],
      });
    }, (result) => {
      message.error(`'查询失败: '${result.error}`);
      this.setState({tableLoading: false});
    });
  }

  /**
   * 点击提交按钮时触发查询
   *
   * @param queryObj
   */
  handleFormSubmit = (queryObj) => {
    this.setState({tableLoading: true});
    // 这时查询条件已经变了, 要从第一页开始查
    this.mockAjax(queryObj, 1, this.state.pageSize).then((result) => {
      //message.success('查询成功');
      this.setState({
        currentPage: 1,
        data: result.data,
        total: result.total,
        tableLoading: false,
        queryObj: queryObj,
        selectedRowKeys: [],
        selectedRows: [],
      });
    }, (result) => {
      message.error(`'查询失败: '${result.error}`);
      this.setState({tableLoading: false});
    });
  }

  /**
   * 处理表格的选择事件
   *
   * @param selectedRowKeys
   * @param selectedRows
   */
  handleSelectChange = (selectedRowKeys, selectedRows) => {
    this.setState({selectedRowKeys, selectedRows});
  }

  /**
   * 按当前的查询条件重新查询一次
   */
  refresh = () => {
    this.setState({tableLoading: true});
    this.mockAjax(this.state.queryObj, this.state.currentPage, this.state.pageSize).then((result) => {
      //message.success('查询成功');
      this.setState({
        data: result.data,
        total: result.total,
        tableLoading: false,
        selectedRowKeys: [],
        selectedRows: [],
      });
    }, (result) => {
      message.error(`'查询失败: '${result.error}`);
      this.setState({tableLoading: false});
    });
  }

  /**
   * 模拟ajax请求, 会返回一个promise对象
   *
   * @param queryObj 包含了form中所有的查询条件, 再加上page和pageSize, 后端就能拼成完整的sql
   * @param page
   * @param pageSize
   * @returns {Promise}
   */
  mockAjax(queryObj, page, pageSize) {
    const hide = message.loading('正在查询...', 0);
    const promise = new Promise((resolve, reject) => {
      setTimeout(() => {
        const result = {};
        const xdata = [];
        for (let i = 0; i < pageSize; i++) {
          xdata.push({
            key: i,
            name: queryObj.name,
            age: page,
            address: '西湖区湖底公园1号',
          });
        }

        result.total = 500 + page;
        result.data = xdata;
        hide();
        resolve(result);
      }, 800);
    });

    return promise;
  }

  render() {
    // 如果没能成功加载schema, 显示错误信息
    if (!this.inited) {
      return (
        <Error errorMsg={this.errorMsg}/>
      );
    }

    // 之前是直接{...this.state}, 感觉会影响效率
    // 父组件中的方法都是handleXXX, 子组件中都是onXXX
    return (
      <div>
        <InnerForm onSubmit={this.handleFormSubmit} schema={this.querySchema}/>
        <InnerTable data={this.state.data} tableLoading={this.state.tableLoading}
                    selectedRowKeys={this.state.selectedRowKeys}
                    selectedRows={this.state.selectedRows} schema={this.dataSchema} refresh={this.refresh}
                    onSelectChange={this.handleSelectChange}/>
        <InnerPagination currentPage={this.state.currentPage} total={this.state.total} pageSize={this.state.pageSize}
                         onChange={this.handlePageChange}/>
      </div>
    );
  }

}


// 表单组件
class InnerForm extends React.Component {

  /**
   * 辅助函数, 将一个input元素包装下
   *
   * @param formItem
   * @param field
   * @returns {XML}
   */
  colWrapper = (formItem, field) => {
    //const {getFieldProps, getFieldError, isFieldValidating} = this.props.form;
    return (
      <Col key={field.key} sm={8}>
        <FormItem key={field.key} label={field.title} labelCol={{ span: 10 }} wrapperCol={{ span: 14 }}>
          {formItem}
        </FormItem>
      </Col>
    );
  }

  /**
   * 将schema中的一列转换为下拉框
   *
   * @param field
   */
  transformSelect = (field) => {
    // TODO: 这里是否要做schema校验
    const options = [];
    const {getFieldProps} = this.props.form;

    field.queryOptions.forEach((option) => {
      options.push(<Option key={option.key} value={option.key}>{option.value}</Option>);
    });

    return this.colWrapper((
      <Select placeholder={field.placeholder || '请选择'} size="default" {...getFieldProps(field.key)}>
        {options}
      </Select>
    ), field);
  }

  /**
   * 将schema中的一列转换为单选框
   *
   * @param field
   */
  transformRadio = (field) => {
    const options = [];
    const {getFieldProps} = this.props.form;

    field.queryOptions.forEach((option) => {
      options.push(<Radio key={option.key} value={option.key}>{option.value}</Radio>);
    });

    return this.colWrapper((
      <RadioGroup {...getFieldProps(field.key)}>
        {options}
      </RadioGroup>
    ), field);
  }

  /**
   * 将schema中的一列转换为checkbox
   *
   * @param field
   */
  transformCheckbox = (field) => {
    const options = [];
    const {getFieldProps} = this.props.form;

    field.queryOptions.forEach((option) => {
      options.push({label: option.value, value: option.key});
    });

    return this.colWrapper((
      <CheckboxGroup options={options} {...getFieldProps(field.key)}/>
    ), field);
  }

  /**
   * 转换为下拉多选框
   *
   * @param field
   * @returns {XML}
   */
  transformMultiSelect = (field) => {
    const options = [];
    const {getFieldProps} = this.props.form;

    field.queryOptions.forEach((option) => {
      options.push(<Option key={option.key} value={option.key}>{option.value}</Option>);
    });

    return this.colWrapper((
      <Select multiple placeholder={field.placeholder || '请选择'} size="default" {...getFieldProps(field.key)}>
        {options}
      </Select>
    ), field);
  }

  /**
   * 将schema中的一列转换为普通输入框
   *
   * @param field
   * @returns {XML}
   */
  transformNormal = (field) => {
    const {getFieldProps} = this.props.form;
    switch (field.dataType) {
      case 'int':
        return this.colWrapper((
          <InputNumber size="default" {...getFieldProps(field.key)}/>
        ), field);
      case 'float':
        return this.colWrapper((
          <InputNumber step={0.01} size="default" {...getFieldProps(field.key)}/>
        ), field);
      case 'datetime':
        return this.colWrapper((
          <DatePicker showTime format="yyyy-MM-dd HH:mm:ss"
                      placeholder={field.placeholder || '请选择日期'} {...getFieldProps(field.key)}/>
        ), field);
      default:  // 默认就是普通的输入框
        return this.colWrapper((
          <Input placeholder={field.placeholder} size="default" {...getFieldProps(field.key)}/>
        ), field);
    }
  }

  /**
   * 也是个辅助函数, 由于是范围查询, 输入的formItem是两个, 一个用于begin一个用于end
   *
   * @param beginFormItem
   * @param endFormItem
   * @param field
   * @returns {XML}
   */
  betweenColWrapper = (beginFormItem, endFormItem, field) => {
    // 布局真是个麻烦事
    // col内部又用了一个row做布局
    // const {getFieldProps} = this.props.form;
    return (
      <Col key={`${field.key}Begin`} sm={8}>
        <Row>
          <Col span={16}>
            <FormItem key={`${field.key}Begin`} label={field.title} labelCol={{ span: 15 }} wrapperCol={{ span:9 }}>
              {beginFormItem}
            </FormItem>
          </Col>
          <Col span={7} offset={1}>
            <FormItem key={`${field.key}End`} labelCol={{ span: 10 }} wrapperCol={{ span:14 }}>
              {endFormItem}
            </FormItem>
          </Col>
        </Row>
      </Col>
    );
  }

  /**
   * between类型比较特殊, 普通元素每个宽度是8, int和float的between元素宽度也是8, 但datetime类型的between元素宽度是16
   * 否则排版出来不能对齐, 太丑了, 逼死强迫症
   * 而且普通的transform函数返回是一个object, 而这个函数返回是一个array, 就是因为datetime的between要占用两列
   *
   * @param field
   */
  transformBetween = (field) => {
    const cols = [];
    let beginFormItem;
    let endFormItem;
    const {getFieldProps} = this.props.form;

    switch (field.dataType) {
      case 'int':
        beginFormItem = (<InputNumber size="default"
                                      placeholder={field.placeholderBegin||'最小值'} {...getFieldProps(`${field.key}Begin`)}/>);
        endFormItem = (<InputNumber size="default"
                                    placeholder={field.placeholderEnd||'最大值'} {...getFieldProps(`${field.key}End`)}/>);
        cols.push(this.betweenColWrapper(beginFormItem, endFormItem, field));
        break;
      case 'float':
        beginFormItem = (<InputNumber step={0.01} size="default"
                                      placeholder={field.placeholderBegin||'最小值'} {...getFieldProps(`${field.key}Begin`)}/>);
        endFormItem = (<InputNumber step={0.01} size="default"
                                    placeholder={field.placeholderEnd||'最大值'} {...getFieldProps(`${field.key}End`)}/>);
        cols.push(this.betweenColWrapper(beginFormItem, endFormItem, field));
        break;
      // datetime类型的between要占用两个Col
      // 不写辅助函数了, 直接这里写jsx吧...
      case 'datetime':
        cols.push(
          <Col key={`${field.key}Begin`} sm={8}>
            <FormItem key={`${field.key}Begin`} label={field.title} labelCol={{ span: 10 }} wrapperCol={{ span:14 }}>
              <DatePicker showTime format="yyyy-MM-dd HH:mm:ss"
                          placeholder={field.placeholderBegin||'开始日期'} {...getFieldProps(`${field.key}Begin`)}/>
            </FormItem>
          </Col>
        );
        cols.push(<Col key={`${field.key}End`} sm={8}>
          <FormItem key={`${field.key}End`} labelCol={{ span: 10 }} wrapperCol={{ span:14 }}>
            <DatePicker showTime format="yyyy-MM-dd HH:mm:ss"
                        placeholder={field.placeholderEnd||'结束日期'} {...getFieldProps(`${field.key}End`)}/>
          </FormItem>
        </Col>);
        break;
      default:
        // 理论上来说不会出现这种情况
        console.log(`unknown dataType: ${field.dataType}`);
    }
    return cols;
  }

  /**
   * 处理表单提交
   *
   * @param e
   */
  handleSubmit = (e) => {
    e.preventDefault();
    // 将提交的值中undefined的去掉
    const newObj = {};
    const oldObj = this.props.form.getFieldsValue();
    for (const key in oldObj) {
      if (oldObj[key]) {
        newObj[key] = oldObj[key];
      }
    }
    this.props.onSubmit(newObj);
  }

  handleReset = (e) => {
    e.preventDefault();
    this.props.form.resetFields();
  }

  render() {
    const rows = [];
    let cols = [];

    // 参见antd的布局, 每行被分为24个格子
    // 普通的字段每个占用8格, between类型的字段每个占用16格
    let spaceLeft = 24;
    this.props.schema.forEach((field)=> {
      // 当前列需要占用几个格子? 普通的都是8, 只有datetime between是16
      let spaceNeed = 8;
      if (field.queryType === 'between' && field.dataType === 'datetime') {
        spaceNeed = 16;
      }

      // 如果当前行空间不足, 就换行
      if (spaceLeft < spaceNeed) {
        rows.push(<Row key={rows.length} gutter={16}>{cols}</Row>);
        cols = [];  // 不知array有没有clear之类的方法
        spaceLeft = 24;  // 剩余空间重置
      }

      // 开始push各种FormItem
      switch (field.queryType) {
        case 'select':
          cols.push(this.transformSelect(field));
          break;
        case 'radio':
          cols.push(this.transformRadio(field));
          break;
        case 'checkbox':
          cols.push(this.transformCheckbox(field));
          break;
        case 'multiSelect':
          cols.push(this.transformMultiSelect(field));
          break;
        case 'between':
          for (const col of this.transformBetween(field)) {  // between类型比较特殊, 返回的是一个数组
            cols.push(col)
          }
          break;
        default:
          cols.push(this.transformNormal(field));
      }

      spaceLeft -= spaceNeed;

    });

    // 别忘了最后一行
    if (cols.length > 0) {
      rows.push(<Row key={rows.length} gutter={16}>{cols}</Row>);
    }

    // 表单的前面是一堆输入框, 最后一行是按钮
    return (
      <Form horizontal className="ant-advanced-search-form">
        {rows}
        <Row>
          <Col span={12} offset={12} style={{ textAlign: 'right' }}>
            <Button type="primary" onClick={this.handleSubmit}><Icon type="search"/>查询</Button>
            <Button onClick={this.handleReset}><Icon type="cross"/>清除条件</Button>
            <Button><Icon type="export"/>导出</Button>
            <Button><Icon type="save"/>导入</Button>
          </Col>
        </Row>
      </Form>
    );
  }

}

InnerForm = Form.create()(InnerForm);  // antd中的表单组件还要这么包装一层


// 表格组件
class InnerTable extends React.Component {

  // 很多时候都要在antd的组件上再包一层
  state = {
    insertVisitable: false,
    updateVisitable: false,
    deleteVisitable: false,
  }

  onClickInsert = (e) => {
    e.preventDefault();
    this.setState({insertVisitable: true});
  }

  onClickUpdate = (e) => {
    e.preventDefault();
    this.setState({updateVisitable: true});
  }

  onClickDelete = (e) => {
    e.preventDefault();
    Modal.confirm({
      title: this.props.selectedRowKeys.length > 0 ? '确认删除' : '确认批量删除',
      content: '当前被选中的行:' + this.props.selectedRowKeys.join(', '),
      // 这里注意要用箭头函数, 否则this不生效
      onOk: () => {
        this.handleDelete();
      },
      onCancel: ()=> {
      },
    });
  }

  hideModal = () => {
    this.setState({insertVisitable: false, updateVisitable: false, deleteVisitable: false});
  }

  handleInsert = () => {
    this.hideModal();
  }

  handleUpdate = () => {
    this.hideModal();
    this.props.refresh();
  }

  handleDelete = () => {
    this.hideModal();
    this.props.refresh();
  }

  render() {
    const {selectedRowKeys, onSelectChange} = this.props;
    const rowSelection = {
      selectedRowKeys,
      onChange: onSelectChange,
    };

    const hasSelected = selectedRowKeys.length > 0;  // 是否选择
    const multiSelected = selectedRowKeys.length > 1;  // 是否选择了多项

    return (
      <div>
        <div className="db-table-button">
          <ButtonGroup>
            <Button type="primary" onClick={this.onClickInsert}>
              <Icon type="plus-circle-o"/> 新增
            </Button>
            <Button type="primary" disabled={!hasSelected} onClick={this.onClickUpdate}>
              <Icon type="edit"/> {multiSelected ? '批量修改' : '修改'}
            </Button>
            <Button type="primary" disabled={!hasSelected} onClick={this.onClickDelete}>
              <Icon type="delete"/> {multiSelected ? '批量删除' : '删除'}
            </Button>
          </ButtonGroup>
          <Modal title="新增" visible={this.state.insertVisitable} onOk={this.handleInsert} onCancel={this.hideModal}>
            <Form horizontal>
              <FormItem>
                <Input label="aaa" type="text" autoComplete="off"/>
              </FormItem>
              <FormItem>
                <Input label="bbb" type="password" autoComplete="off"/>
              </FormItem>
            </Form>
          </Modal>
          <Modal title={multiSelected ? '批量修改' : '修改'} visible={this.state.updateVisitable} onOk={this.handleUpdate}
                 onCancel={this.hideModal}>
            <Form horizontal>
              <FormItem>
                <Input label="aaa" type="text" autoComplete="off"/>
              </FormItem>
              <FormItem>
                <Input label="bbb" type="password" autoComplete="off"/>
              </FormItem>
            </Form>
          </Modal>
        </div>

        <Table rowSelection={rowSelection} columns={columns} dataSource={this.props.data} pagination={false}
               loading={this.props.tableLoading}/>
      </div>
    );
  }

}


// 分页器组件
class InnerPagination extends React.Component {

  render() {
    return (
      <div className="db-pagination">
        <Pagination
          showQuickJumper
          selectComponentClass={Select}
          total={this.props.total}
          showTotal={(total) => `每页${this.props.pageSize}条, 共 ${total} 条`}
          pageSize={this.props.pageSize} defaultCurrent={1}
          current={this.props.currentPage}
          onChange={this.props.onChange}
        />
      </div>
    );
  }

}

export default DBTable;
