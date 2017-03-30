import React from 'react';
import {
  Form,
  Input,
  Row,
  Col,
  DatePicker,
  Select,
  Icon,
  Radio,
  InputNumber,
  Checkbox,
  Cascader
} from 'antd';
import TableUtils from './TableUtils.js';
import moment from 'moment';
import Logger from '../../utils/Logger';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const CheckboxGroup = Checkbox.Group;
const Option = Select.Option;

const logger = Logger.getLogger('InnerFormSchemaUtils');

// TODO: 其实这里缺少对schema的校验

// 暂存每个表对应的schema callback, 解析schema是个代价较大的操作, 应该尽量复用
const schemaMap = new Map();
// 暂存每个表对应的表单组件, key是表名, value是对应的react组件
const formMap = new Map();

/**
 * 这是一个工具类, 目的是将parse schema的过程独立出来
 */
const SchemaUtils = {

  /**
   * 获取某个表单对应的react组件
   *
   * @param tableName
   * @param schema
   * @returns {*}
   */
  getForm(tableName, schema) {
    // 是否要忽略缓存
    // 在忽略缓存的情况下, 每次都会重新解析schema
    const ignoreCache = TableUtils.shouldIgnoreSchemaCache(tableName);

    if (formMap.has(tableName)) {
      return formMap.get(tableName);
    } else {
      const newForm = this.createForm(tableName, schema);
      if (!ignoreCache) {
        formMap.set(tableName, newForm);
      }
      return newForm;
    }
  },

  /**
   * 动态生成表单
   *
   * @param tableName
   * @param schema
   * @returns {*}
   */
  createForm(tableName, schema) {
    const ignoreCache = TableUtils.shouldIgnoreSchemaCache(tableName);

    // 蛋疼的this
    const that = this;
    // 如何动态生成一个组件? 如果用class的写法, 似乎不行...
    // 只能用传统的ES5的写法, 函数式组件应该也可以, 但是我需要生命周期相关方法
    const tmpComponent = React.createClass({
      componentWillMount() {
        // 组件初始化时读取schema
        if (schemaMap.has(tableName)) {
          this.schemaCallback = schemaMap.get(tableName);
          return;
        }
        const schemaCallback = that.parse(schema);
        if (!ignoreCache) {
          schemaMap.set(tableName, schemaCallback);
        }
        this.schemaCallback = schemaCallback;
      },
      render() {
        // render的时候传入getFieldDecorator, 生成最终的jsx元素
        return this.schemaCallback(this.props.form.getFieldDecorator);
      },
    });
    // 注意要再用antd的create()方法包装下
    return Form.create()(tmpComponent);
  },

  /**
   * 解析表单的schema
   *
   * @param schema 直接从tableName.querySchema.js文件中读出来的schema
   * @returns {function()} 一个函数, 这个函数的参数是getFieldDecorator, 执行后才会返回真正的jsx元素, 为啥不直接返回jsx元素而要返回函数呢, 因为antd的表单的限制, 想生成最终的元素必须要getFieldDecorator
   */
  parse(schema) {
    // 用这两个变量去代表一个表单的schema
    const rows = [];
    let cols = [];

    // 参见antd的布局, 每行被分为24个格子
    // 普通的字段每个占用8格, between类型的字段每个占用16格
    let spaceLeft = 24;
    schema.forEach((field) => {
      // 当前列需要占用几个格子? 普通的都是8, 只有datetime between是16
      let spaceNeed = 8;
      if (field.showType === 'between' && field.dataType === 'datetime') {
        spaceNeed = 16;
      }

      // 如果当前行空间不足, 就换行
      if (spaceLeft < spaceNeed) {
        rows.push(cols);
        cols = [];  // 重置cols
        spaceLeft = 24;  // 剩余空间重置
      }

      // 注意, 每个字段transform之后, 返回的也都是一个回调函数, 所以cols其实是一个回调函数的集合
      switch (field.showType) {
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
          cols.push(this.transformBetween(field));
          break;
        case 'cascader':
          cols.push(this.transformCascader(field));
          break;
        default:
          cols.push(this.transformNormal(field));
      }

      spaceLeft -= spaceNeed;
    });

    // 别忘了最后一行
    if (cols.length > 0) {
      rows.push(cols);
    }

    // 至此, schema解析完毕, 接下来是回调函数
    // 这里有一点闭包的概念
    return getFieldDecorator => {
      const formRows = []; // 最终的表单中的一行
      for (let i = 0; i < rows.length; i++) {
        const formCols = [];  // 最终的表单中的一列
        for (const col of rows[i]) {
          formCols.push(col(getFieldDecorator));  // 注意这里的col是一个函数
        }
        formRows.push(<Row key={i} gutter={16}>{formCols}</Row>);
      }

      return (<Form horizontal>
        {formRows}
      </Form>);
    };
  },

  /**
   * 辅助函数, 将一个input元素包装下
   *
   * @param formItem 一个callback, 以getFieldDecorator为参数, 执行后返回对应的表单项, input/select之类的
   * @param field schema中的一列
   */
  colWrapper(formItem, field) {
    return getFieldDecorator => (
      <Col key={field.key} sm={8}>
        <FormItem key={field.key} label={field.title} labelCol={{ span: 10 }} wrapperCol={{ span: 14 }}>
          {formItem(getFieldDecorator)}
        </FormItem>
      </Col>
    );
  },

  /**
   * 将schema中的一列转换为下拉框
   *
   * @param field
   */
  transformSelect(field) {
    logger.debug('transform field %o to Select component', field);
    const options = [];
    field.options.forEach((option) => {
      options.push(<Option key={option.key} value={option.key}>{option.value}</Option>);
    });

    return this.colWrapper(getFieldDecorator => getFieldDecorator(field.key, {initialValue: field.defaultValue})(
      <Select placeholder={field.placeholder || '请选择'} size="default">
        {options}
      </Select>
    ), field);
  },

  /**
   * 将schema中的一列转换为单选框
   *
   * @param field
   */
  transformRadio(field) {
    logger.debug('transform field %o to Radio component', field);
    const options = [];
    field.options.forEach((option) => {
      options.push(<Radio key={option.key} value={option.key}>{option.value}</Radio>);
    });

    return this.colWrapper(getFieldDecorator => getFieldDecorator(field.key, {initialValue: field.defaultValue})(
      <RadioGroup>
        {options}
      </RadioGroup>
    ), field);
  },

  /**
   * 将schema中的一列转换为checkbox
   *
   * @param field
   */
  transformCheckbox(field) {
    logger.debug('transform field %o to Checkbox component', field);
    const options = [];
    field.options.forEach((option) => {
      options.push({label: option.value, value: option.key});
    });

    return this.colWrapper(getFieldDecorator => getFieldDecorator(field.key, {initialValue: field.defaultValue})(
      <CheckboxGroup options={options}/>
    ), field);
  },

  /**
   * 转换为下拉多选框
   *
   * @param field
   * @returns {XML}
   */
  transformMultiSelect(field) {
    logger.debug('transform field %o to MultipleSelect component', field);
    const options = [];
    field.options.forEach((option) => {
      options.push(<Option key={option.key} value={option.key}>{option.value}</Option>);
    });

    return this.colWrapper(getFieldDecorator => getFieldDecorator(field.key, {initialValue: field.defaultValue})(
      <Select multiple placeholder={field.placeholder || '请选择'} size="default">
        {options}
      </Select>
    ), field);
  },

  /**
   * 转换为级联选择
   *
   * @param field
   * @returns {XML}
   */
  transformCascader(field) {
    logger.debug('transform field %o to Cascader component', field);
    return this.colWrapper(getFieldDecorator => getFieldDecorator(field.key, {initialValue: field.defaultValue})(
      <Cascader options={field.options} expandTrigger="hover" placeholder={field.placeholder || '请选择'} size="default"/>
    ), field);
  },

  /**
   * 将schema中的一列转换为普通输入框
   *
   * @param field
   * @returns {XML}
   */
  transformNormal(field) {
    switch (field.dataType) {
      case 'int':
        logger.debug('transform field %o to integer input component', field);
        return this.colWrapper(getFieldDecorator => getFieldDecorator(field.key, {initialValue: field.defaultValue})(
          <InputNumber size="default" max={field.max} min={field.min} placeholder={field.placeholder}/>
        ), field);
      case 'float':
        logger.debug('transform field %o to float input component', field);
        return this.colWrapper(getFieldDecorator => getFieldDecorator(field.key, {initialValue: field.defaultValue})(
          <InputNumber step={0.01} size="default" max={field.max} min={field.min} placeholder={field.placeholder}/>
        ), field);
      case 'datetime':
        logger.debug('transform field %o to datetime input component', field);
        return this.colWrapper(getFieldDecorator => getFieldDecorator(field.key, {initialValue: field.defaultValue ? moment(field.defaultValue) : null})(
          <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" placeholder={field.placeholder || '请选择日期'}/>
        ), field);
      default:  // 默认就是普通的输入框
        logger.debug('transform field %o to varchar input component', field);
        return this.colWrapper(getFieldDecorator => getFieldDecorator(field.key, {initialValue: field.defaultValue})(
          <Input placeholder={field.placeholder} size="default" addonBefore={field.addonBefore}
                 addonAfter={field.addonAfter}/>
        ), field);
    }
  },

  /**
   * 也是个辅助函数, 由于是范围查询, 输入的formItem是两个, 一个用于begin一个用于end
   *
   * @param beginFormItem
   * @param endFormItem
   * @param field
   */
  betweenColWrapper(beginFormItem, endFormItem, field) {
    // 布局真是个麻烦事
    // col内部又用了一个row做布局
    return getFieldDecorator => (
      <Col key={`${field.key}Begin`} sm={8}>
        <Row>
          <Col span={16}>
            <FormItem key={`${field.key}Begin`} label={field.title} labelCol={{ span: 15 }} wrapperCol={{ span: 9 }}>
              {beginFormItem(getFieldDecorator)}
            </FormItem>
          </Col>
          <Col span={7} offset={1}>
            <FormItem key={`${field.key}End`} labelCol={{ span: 10 }} wrapperCol={{ span: 14 }}>
              {endFormItem(getFieldDecorator)}
            </FormItem>
          </Col>
        </Row>
      </Col>
    );
  },

  /**
   * between类型比较特殊, 普通元素每个宽度是8, int和float的between元素宽度也是8, 但datetime类型的between元素宽度是16
   * 否则排版出来不能对齐, 太丑了, 逼死强迫症
   * 而且普通的transform函数返回是一个object, 而这个函数返回是一个array, 就是因为datetime的between要占用两列
   *
   * @param field
   */
  transformBetween(field) {
    let beginFormItem;
    let endFormItem;

    // webstorm的代码格式化有时很奇怪...
    switch (field.dataType) {
      case 'int':
        logger.debug('transform field %o to integer BETWEEN component', field);
        beginFormItem = getFieldDecorator => getFieldDecorator(`${field.key}Begin`, {initialValue: field.defaultValueBegin})
        (<InputNumber size="default" placeholder={field.placeholderBegin || '最小值'}/>);
        endFormItem = getFieldDecorator => getFieldDecorator(`${field.key}End`, {initialValue: field.defaultValueEnd})
        (<InputNumber size="default" placeholder={field.placeholderEnd || '最大值'}/>);
        return this.betweenColWrapper(beginFormItem, endFormItem, field);
      case 'float':
        logger.debug('transform field %o to float BETWEEN component', field);
        beginFormItem = getFieldDecorator => getFieldDecorator(`${field.key}Begin`, {initialValue: field.defaultValueBegin})
        (<InputNumber step={0.01} size="default" placeholder={field.placeholderBegin || '最小值'}/>);
        endFormItem = getFieldDecorator => getFieldDecorator(`${field.key}End`, {initialValue: field.defaultValueEnd})
        (<InputNumber step={0.01} size="default" placeholder={field.placeholderEnd || '最大值'}/>);
        return this.betweenColWrapper(beginFormItem, endFormItem, field);
      // datetime类型的between要占用两个Col
      // 不写辅助函数了, 直接这里写jsx吧...
      case 'datetime':
        logger.debug('transform field %o to datetime BETWEEN component', field);
        // 只能返回一个顶层元素
        return getFieldDecorator => (
          <div key={'datetimeBetweenDiv'}>
            <Col key={`${field.key}Begin`} sm={8}>
              <FormItem key={`${field.key}Begin`} label={field.title} labelCol={{ span: 10 }}
                        wrapperCol={{ span:14 }}>
                {getFieldDecorator(`${field.key}Begin`, {initialValue: field.defaultValueBegin ? moment(field.defaultValueBegin) : null})
                (<DatePicker showTime format="YYYY-MM-DD HH:mm:ss" placeholder={field.placeholderBegin || '开始日期'}/>)}
              </FormItem>
            </Col>
            <Col key={`${field.key}End`} sm={8}>
              <FormItem key={`${field.key}End`} labelCol={{ span: 10 }} wrapperCol={{ span:14 }}>
                {getFieldDecorator(`${field.key}End`, {initialValue: field.defaultValueEnd ? moment(field.defaultValueEnd) : null})
                (<DatePicker showTime format="YYYY-MM-DD HH:mm:ss" placeholder={field.placeholderEnd || '结束日期'}/>)}
              </FormItem>
            </Col>
          </div>
        );
      default:
        // 理论上来说不会出现这种情况
        logger.error('unknown dataType: %s', field.dataType);
    }
    return null;
  },
};

export default SchemaUtils;
