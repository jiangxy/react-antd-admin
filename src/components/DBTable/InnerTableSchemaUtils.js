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
  Checkbox
} from 'antd';
import moment from 'moment';
import Logger from '../../utils/Logger';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const CheckboxGroup = Checkbox.Group;
const Option = Select.Option;

const logger = Logger.getLogger('InnerFormSchemaUtils');

/**
 * 跟InnerFormSchemaUtils非常类似, 但不用考虑布局相关的东西了
 */
const SchemaUtils = {

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
    // 如果有特殊情况需要自己指定组件, 再说吧
    if (field.primary === true) {
      logger.debug('key %o is primary, transform to text area', field);
      return this.colWrapper(getFieldDecorator => getFieldDecorator(field.key)(
        <Input type="textarea" autosize={{ minRows: 1, maxRows: 10 }} disabled size="default"/>
      ), field);
    }

    // FIXME: 这里应该根据showType来switch
    switch (field.dataType) {
      case 'int':
        logger.debug('transform field %o to integer input', field);
        return this.colWrapper(getFieldDecorator => getFieldDecorator(field.key)(<InputNumber
          placeholder={field.placeholder} size="default"/>), field);
      case 'float':
        logger.debug('transform field %o to float input', field);
        return this.colWrapper(getFieldDecorator => getFieldDecorator(field.key)(
          <InputNumber placeholder={field.placeholder} step={0.01} size="default"/>), field);
      case 'datetime':
        logger.debug('transform field %o to datetime input', field);
        return this.colWrapper(getFieldDecorator => getFieldDecorator(field.key)(
          <DatePicker showTime format="yyyy-MM-dd HH:mm:ss" placeholder={field.placeholder || '请选择日期'}/>
        ), field);
      default:  // 默认就是普通的输入框
        logger.debug('transform field %o to varchar input', field);
        return this.colWrapper(getFieldDecorator => getFieldDecorator(field.key)(
          <Input placeholder={field.placeholder} size="default"/>
        ), field);
    }
  },
};

export default SchemaUtils;
