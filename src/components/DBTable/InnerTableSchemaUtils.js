import React from 'react';
import {
  Form,
  Input,
  DatePicker,
  Select,
  Radio,
  InputNumber,
  Checkbox,
  Cascader
} from 'antd';
import TableUtils from './TableUtils.js';
import FileUploader from '../FileUploader';
import moment from 'moment';
import Logger from '../../utils/Logger';
import {ACTION_KEY} from './InnerTableRenderUtils';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const CheckboxGroup = Checkbox.Group;
const Option = Select.Option;

const logger = Logger.getLogger('InnerTableSchemaUtils');

// 跟InnerForm类似, InnerTable也将parse schema的过程独立出来
// FIXME: 这种缓存也许用weak map更合适
const tableSchemaMap = new Map();  // key是tableName, value是表格的schema, 还有一些额外信息
const formSchemaMap = new Map();  // key是tableName, value是表单的schema callback
const formMap = new Map();  // key是tableName, value是对应的react组件

/**
 * 跟InnerFormSchemaUtils非常类似, 但不用考虑布局相关的东西了
 */
const SchemaUtils = {

  /**
   * 解析表格的schema
   *
   * @param tableName
   * @param schema
   * @returns {*}
   */
  getTableSchema(tableName, schema) {
    // 做一层缓存
    // 怎么感觉我在到处做缓存啊...工程化风格明显
    if (tableSchemaMap.has(tableName)) {
      return tableSchemaMap.get(tableName);
    }

    const toCache = {};
    const newCols = [];
    const fieldMap = new Map();
    schema.forEach((field) => {
      // 在表格中显示的时候, 要将radio/checkbox之类的转换为文字
      // 比如schema中配置的是{key:1, value:haha}, 后端返回的值是1, 但前端展示时要换成haha
      if (field.options) {
        // 这样$$的前缀表示是内部的临时变量, 我觉得这种挺蛋疼的, 但没啥好办法...
        field.$$optionMap = this.transformOptionMap(field.options, field.showType);
      }

      // 有点类似索引
      fieldMap.set(field.key, field);
      // 当前列是否是主键?
      if (field.primary) {
        toCache.primaryKey = field.key;
      }

      // 不需要在表格中展示
      if (field.showInTable === false) {
        return;
      }
      const col = {};
      col.key = field.key;
      col.dataIndex = field.key;
      col.title = field.title;
      col.width = field.width;
      col.sorter = field.sorter;
      // 我本来想在解析schema的时候配置一下render然后加到缓存里
      // 但如果render中使用了this指针就会有问题
      // 比如用户先使用DBTable组件, 这时会解析schema并缓存, 然后用户通过侧边栏切换到其他组件, DBTable组件unmount
      // 这时render函数中的this, 就指向这个被unmount的组件了, 就算再重新切回DBTable, 也是重新mount的一个新的组件了
      // 换句话说, render函数不能缓存, 必须每次解析schema后重新设置render
      // js的this是一个很迷的问题...参考:http://bonsaiden.github.io/JavaScript-Garden/zh/#function.this

      //if (field.render) {
      //  col.render = field.render;
      //}
      newCols.push(col);
    });

    toCache.tableSchema = newCols;
    toCache.fieldMap = fieldMap;

    const ignoreCache = TableUtils.shouldIgnoreSchemaCache(tableName);
    if (!ignoreCache) {
      tableSchemaMap.set(tableName, toCache);
    }

    return toCache;
  },

  /**
   * 和getTableSchema配合的一个方法, 用于解析optionMap
   *
   * @param options
   * @param showType
   * @returns {{}}
   */
  transformOptionMap(options, showType){
    const optionMap = {};

    // 对于级联选择要特殊处理下
    if (showType === 'cascader') {
      const browseOption = (item) => {  // dfs
        optionMap[item.value] = item.label;
        if (item.children) {
          item.children.forEach(browseOption);
        }
      };
      options.forEach(browseOption);
    } else {
      for (const option of options) {
        optionMap[option.key] = option.value;
      }
    }

    return optionMap;
  },

  /**
   * 获取某个表单对应的react组件
   *
   * @param tableName
   * @param schema
   * @returns {*}
   */
  getForm(tableName, schema) {
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
    const that = this;
    const tmpComponent = React.createClass({
      componentWillMount() {
        if (formSchemaMap.has(tableName)) {
          this.schemaCallback = formSchemaMap.get(tableName);
          return;
        }
        const schemaCallback = that.parseFormSchema(schema);
        if (!ignoreCache) {
          formSchemaMap.set(tableName, schemaCallback);
        }
        this.schemaCallback = schemaCallback;
      },
      // 表单挂载后, 给表单一个初始值
      componentDidMount(){
        if (this.props.initData) {  // 这种方法都能想到, 我tm都佩服自己...
          this.props.form.setFieldsValue(this.props.initData);
        }
      },
      render() {
        return this.schemaCallback(this.props.form.getFieldDecorator, this.props.forUpdate, this.props.keysToUpdate);
      },
    });
    return Form.create()(tmpComponent);
  },

  /**
   * 这是最主要的方法
   *
   * @param schema
   * @returns {function()}
   */
  parseFormSchema(schema) {
    this.parseValidator(schema);

    const rows = [];
    schema.forEach((field) => {
      // 有一些列不需要在表单中展示
      if (field.showInForm === false)
        return;
      if (field.key === ACTION_KEY)
        return;
      rows.push(this.transFormField(field));
    });

    // 返回的schemaCallback有3个参数
    // 1. getFieldDecorator, 表单组件对应的getFieldDecorator函数
    // 2. forUpdate, 当前表单是用于insert还是update, 影响到校验规则
    // 3. keysToUpdate, 允许更新哪些字段, 影响到modal中显示哪些字段, 仅当forUpdate=true时生效
    return (getFieldDecorator, forUpdate, keysToUpdate) => {
      const formRows = []; // 最终的表单中的一行
      for (const row of rows) {
        formRows.push(row(getFieldDecorator, forUpdate, keysToUpdate));
      }

      return (<Form horizontal>
        {formRows}
      </Form>);
    };
  },

  /**
   * 有点蛋疼的一件事, dataSchema定义的表单, 要同时用于insert和update, 但二者需要的校验规则是不同的
   * 比如insert时某个字段是必填的, 但update时是不需要填的
   *
   * @param schema
   */
  parseValidator(schema){
    schema.forEach((field) => {
      if (!field.validator)
        return;

      const newRules = [];
      for (const rule of field.validator) {
        newRules.push(Object.assign({}, rule, {required: false})); // update时没有字段是必填的
      }
      // 这种$$开头的变量都被我用作内部变量
      field.$$updateValidator = newRules;
    });
  },

  colWrapper(formItem, field) {
    return (getFieldDecorator, forUpdate, keysToUpdate) => {
      // 表单用于更新时, 可以只显示部分字段
      if (forUpdate === true && keysToUpdate && !keysToUpdate.has(field.key)) {
        return null;
      }

      return (<FormItem key={field.key} label={field.title} labelCol={{ span: 4 }} wrapperCol={{ span: 20 }}>
        {formItem(getFieldDecorator, forUpdate)}
      </FormItem>);
    }
  },

  transFormField(field) {
    // 对于主键, 直接返回一个不可编辑的textarea, 因为主键一般是数据库自增的
    // 如果有特殊情况需要自己指定主键, 再说吧
    if (field.primary === true) {
      logger.debug('key %o is primary, transform to text area', field);
      return this.colWrapper((getFieldDecorator, forUpdate) => getFieldDecorator(field.key)(
        <Input type="textarea" autosize={{ minRows: 1, maxRows: 10 }} disabled size="default"/>
      ), field);
    }

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
      case 'image':
        return this.transformImage(field);
      case 'file':
        return this.transformFile(field);
      case 'cascader':
        return this.transformCascader(field);
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

    return this.colWrapper((getFieldDecorator, forUpdate) => getFieldDecorator(field.key, {
      initialValue: forUpdate ? undefined : field.defaultValue,
      rules: forUpdate ? field.$$updateValidator : field.validator,
    })(
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

    return this.colWrapper((getFieldDecorator, forUpdate) => getFieldDecorator(field.key, {
      initialValue: forUpdate ? undefined : field.defaultValue,
      rules: forUpdate ? field.$$updateValidator : field.validator,
    })(
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

    return this.colWrapper((getFieldDecorator, forUpdate) => getFieldDecorator(field.key, {
      initialValue: forUpdate ? undefined : field.defaultValue,
      rules: forUpdate ? field.$$updateValidator : field.validator,
    })(
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

    return this.colWrapper((getFieldDecorator, forUpdate) => getFieldDecorator(field.key, {
      initialValue: forUpdate ? undefined : field.defaultValue,
      rules: forUpdate ? field.$$updateValidator : field.validator,
    })(
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
    return this.colWrapper((getFieldDecorator, forUpdate) => getFieldDecorator(field.key, {
      initialValue: forUpdate ? undefined : field.defaultValue,
      rules: forUpdate ? field.$$updateValidator : field.validator,
    })(
      <Input type="textarea" placeholder={field.placeholder || '请输入'} autosize={{ minRows: 2, maxRows: 10 }}
             disabled={field.disabled} size="default"/>
    ), field);
  },

  /**
   * 转换为图片上传组件
   *
   * @param field
   * @returns {XML}
   */
  transformImage(field) {
    logger.debug('transform field %o to image component', field);
    return this.colWrapper((getFieldDecorator, forUpdate) => getFieldDecorator(field.key, {
      initialValue: forUpdate ? undefined : field.defaultValue,
      rules: forUpdate ? field.$$updateValidator : field.validator,
    })(
      <FileUploader max={field.max} url={field.url} sizeLimit={field.sizeLimit} accept={field.accept}
                    placeholder={field.placeholder} type="image"/>
    ), field);
  },

  /**
   * 转换为文件上传组件
   *
   * @param field
   * @returns {XML}
   */
  transformFile(field) {
    logger.debug('transform field %o to file component', field);
    return this.colWrapper((getFieldDecorator, forUpdate) => getFieldDecorator(field.key, {
      initialValue: forUpdate ? undefined : field.defaultValue,
      rules: forUpdate ? field.$$updateValidator : field.validator,
    })(
      <FileUploader max={field.max} url={field.url} sizeLimit={field.sizeLimit} accept={field.accept}
                    placeholder={field.placeholder}/>
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
    return this.colWrapper((getFieldDecorator, forUpdate) => getFieldDecorator(field.key, {
      initialValue: forUpdate ? undefined : field.defaultValue,
      rules: forUpdate ? field.$$updateValidator : field.validator,
    })(
      <Cascader options={field.options} expandTrigger="hover" placeholder={field.placeholder || '请选择'} size="default"
                disabled={field.disabled}/>
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
        return this.colWrapper((getFieldDecorator, forUpdate) => getFieldDecorator(field.key, {
          initialValue: forUpdate ? undefined : field.defaultValue,
          rules: forUpdate ? field.$$updateValidator : field.validator,
        })(
          <InputNumber size="default" max={field.max} min={field.min} placeholder={field.placeholder}
                       disabled={field.disabled}/>
        ), field);
      case 'float':
        logger.debug('transform field %o to float input component', field);
        return this.colWrapper((getFieldDecorator, forUpdate) => getFieldDecorator(field.key, {
          initialValue: forUpdate ? undefined : field.defaultValue,
          rules: forUpdate ? field.$$updateValidator : field.validator,
        })(
          <InputNumber step={0.01} size="default" max={field.max} min={field.min} placeholder={field.placeholder}
                       disabled={field.disabled}/>
        ), field);
      case 'datetime':
        logger.debug('transform field %o to datetime input component', field);
        return this.colWrapper((getFieldDecorator, forUpdate) => getFieldDecorator(field.key, {
          initialValue: forUpdate ? undefined : (field.defaultValue ? moment(field.defaultValue) : null),  // 这个表达式是真的有点蛋疼
          rules: forUpdate ? field.$$updateValidator : field.validator,
        })(
          <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" placeholder={field.placeholder || '请选择日期'}
                      disabled={field.disabled}/>
        ), field);
      default:  // 默认就是普通的输入框
        logger.debug('transform field %o to varchar input component', field);
        return this.colWrapper((getFieldDecorator, forUpdate) => getFieldDecorator(field.key, {
          initialValue: forUpdate ? undefined : field.defaultValue,
          rules: forUpdate ? field.$$updateValidator : field.validator,
        })(
          <Input placeholder={field.placeholder} size="default" addonBefore={field.addonBefore}
                 addonAfter={field.addonAfter} disabled={field.disabled}/>
        ), field);
    }
  },
};

export default SchemaUtils;
