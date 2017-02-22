import React from 'react';
import {
  Form,
  Input,
  DatePicker,
  Select,
  Radio,
  InputNumber,
  Checkbox
} from 'antd';
import moment from 'moment';
import Logger from '../../utils/Logger';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const CheckboxGroup = Checkbox.Group;
const Option = Select.Option;

const logger = Logger.getLogger('InnerTableSchemaUtils');

/**
 * 跟InnerFormSchemaUtils非常类似, 但不用考虑布局相关的东西了
 */
const SchemaUtils = {

  /**
   * 这是最主要的方法
   *
   * @param schema
   * @returns {function()}
   */
  parse(schema) {
    const rows = [];
    schema.forEach((field) => {
      rows.push(this.transFormField(field));
    });

    return getFieldDecorator => {
      const formRows = []; // 最终的表单中的一行
      for (const row of rows) {
        formRows.push(row(getFieldDecorator));
      }

      return (<Form horizontal>
        {formRows}
      </Form>);
    };
  },

  colWrapper(formItem, field) {
    return getFieldDecorator => (
      <FormItem key={field.key} label={field.title} labelCol={{ span: 4 }} wrapperCol={{ span: 20 }}>
        {formItem(getFieldDecorator)}
      </FormItem>
    );
  },

  transFormField(field) {
    // 对于主键, 直接返回一个不可编辑的textarea, 因为主键一般是数据库自增的
    // 如果有特殊情况需要自己指定主键, 再说吧
    if (field.primary === true) {
      logger.debug('key %o is primary, transform to text area', field);
      return this.colWrapper(getFieldDecorator => getFieldDecorator(field.key)(
        <Input type="textarea" autosize={{ minRows: 1, maxRows: 10 }} disabled size="default"/>
      ), field);
    }

    // TODO: 支持更多showType
    switch (field.showType) {
      case 'select':
        return this.transformSelect(field);
      case 'radio':
        return this.transformRadio(field);
      case 'checkbox':
        return this.transformCheckbox(field);
      case 'multiSelect':
        return this.transformMultiSelect(field);
      case 'textarea':
        return this.transformTextArea(field);
      default:
        return this.transformNormal(field);
    }
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
      <Select placeholder={field.placeholder || '请选择'} size="default" disabled={field.disabled}>
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
      <RadioGroup disabled={field.disabled}>
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
      <CheckboxGroup options={options} disabled={field.disabled}/>
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
      <Select multiple placeholder={field.placeholder || '请选择'} size="default" disabled={field.disabled}>
        {options}
      </Select>
    ), field);
  },

  /**
   * 转换为textarea
   *
   * @param field
   * @returns {XML}
   */
  transformTextArea(field) {
    logger.debug('transform field %o to textarea component', field);
    return this.colWrapper(getFieldDecorator => getFieldDecorator(field.key, {initialValue: field.defaultValue})(
      <Input type="textarea" placeholder={field.placeholder || '请输入'} autosize={{ minRows: 1, maxRows: 10 }}
             disabled={field.disabled} size="default"/>
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
          <InputNumber size="default" max={field.max} min={field.min} placeholder={field.placeholder}
                       disabled={field.disabled}/>
        ), field);
      case 'float':
        logger.debug('transform field %o to float input component', field);
        return this.colWrapper(getFieldDecorator => getFieldDecorator(field.key, {initialValue: field.defaultValue})(
          <InputNumber step={0.01} size="default" max={field.max} min={field.min} placeholder={field.placeholder}
                       disabled={field.disabled}/>
        ), field);
      case 'datetime':
        logger.debug('transform field %o to datetime input component', field);
        return this.colWrapper(getFieldDecorator => getFieldDecorator(field.key, {initialValue: field.defaultValue ? moment(field.defaultValue) : null})(
          <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" placeholder={field.placeholder || '请选择日期'}
                      disabled={field.disabled}/>
        ), field);
      default:  // 默认就是普通的输入框
        logger.debug('transform field %o to varchar input component', field);
        return this.colWrapper(getFieldDecorator => getFieldDecorator(field.key, {initialValue: field.defaultValue})(
          <Input placeholder={field.placeholder} size="default" addonBefore={field.addonBefore}
                 addonAfter={field.addonAfter} disabled={field.disabled}/>
        ), field);
    }
  },
};

export default SchemaUtils;
