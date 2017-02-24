import React from 'react';
import {
  Form,
  Button,
  Table,
  Icon,
  Modal,
  message,
  notification,
  Affix
} from 'antd';
import Logger from '../../utils/Logger';
import ajax from '../../utils/ajax';
import moment from 'moment';
import InnerTableSchemaUtils from './InnerTableSchemaUtils';

const logger = Logger.getLogger('InnerTable');

// 跟InnerForm类似, InnerTable也将parse schema的过程独立出来
// FIXME: 也许用weak map更合适
const tableSchemaMap = new Map();  // key是tableName, value是表格的schema, 还有一些额外信息
const formSchemaMap = new Map();  // key是tableName, value是表单的schema callback
const formMap = new Map();  // key是tableName, value是对应的react组件

/**
 * 动态生成表单对应的react组件
 *
 * @param tableName
 * @param schema
 * @returns {*}
 */
const createForm = (tableName, schema) => {
  const tmpComponent = React.createClass({
    componentWillMount() {
      if (formSchemaMap.has(tableName)) {
        this.schemaCallback = formSchemaMap.get(tableName);
        return;
      }
      const schemaCallback = InnerTableSchemaUtils.parse(schema);
      formSchemaMap.set(tableName, schemaCallback);
      this.schemaCallback = schemaCallback;
    },
    // 表单挂载后, 给表单一个初始值
    componentDidMount(){
      if (this.props.initData) {  // 这种方法都能想到, 我tm都佩服自己...
        this.props.form.setFieldsValue(this.props.initData);
      }
    },
    render() {
      return this.schemaCallback(this.props.form.getFieldDecorator, this.props.forUpdate);
    },
  });
  return Form.create()(tmpComponent);
};

/**
 * 内部表格组件
 */
class InnerTable extends React.PureComponent {

  // 对于InnerTable组件而言, 既有表格又有表单
  // 虽然传进来的是dataSchema, 但要parse两次, 分别变成表格和表单的schema

  state = {
    modalVisible: false,  // modal是否可见
    modalTitle: '新增',  // modal标题
    modalInsert: true,  // 当前modal是用来insert还是update

    selectedRowKeys: [],  // 当前有哪些行被选中, 这里只保存key
    // FIXME: 这里可能会有点问题, 父组件中有一个data, 这里又有一个data, 都表示的是表格中的数据, 两边状态不一致, 可能有潜在的bug
    data: [],  // 表格中显示的数据
  };

  /**
   * 组件初次挂载时parse schema
   */
  componentWillMount() {
    this.parseTableSchema(this.props);
    this.parseTableData(this.props);
  }

  /**
   * InnerTable组件的re-render有两种情况: 自身状态变化导致的render vs 父组件导致的render
   * 正常情况下, 只有父组件导致的render才会触发这个方法, InnerTable自身的变化应该不会触发
   *
   * 父组件触发这个方法也有两种情况:
   * 1. 只有data变化, 比如改变了查询条件/分页等等
   * 2. schema和data都变化了, 比如在react router中切换了菜单项
   *
   * @param nextProps
   */
  componentWillReceiveProps(nextProps) {
    logger.debug('receive new props and try to render, nextProps=%o', nextProps);
    // 之前因为antd的Form组件搞了一些黑盒操作, 表单每输入一次都会触发这个方法, 现在表单独立成一个组件了, 应该好了

    // 只有表名变化时才需要重新parse schema
    if (this.props.tableName !== nextProps.tableName) {
      logger.debug('tableName changed and try to refresh schema');
      this.parseTableSchema(nextProps);
      this.formComponent = undefined;  // 这个别忘了, 如果schema变了, 表单当然也要变
    }

    // 这里要还原初始状态, 理论上来讲, InnerTable所有自己的状态都应该还原, 但其实也是看情况的
    // 比如这里的this.state.data就不用还原, 因为下面的parseTableData方法会更新this.state.data
    // 哪些状态做成this.xxx, 哪些做成this.state.xxx, 还是有点迷惑的, 如果全都塞到state里是不是不太好
    this.state.modalVisible = false;
    this.state.modalTitle = '新增';
    this.state.modalInsert = true;
    this.state.selectedRowKeys = [];

    // 是否要刷新表格中显示的数据? 这个逻辑还有点绕
    // 1. 如果schema变化了, 必须刷新数据
    // 2. 如果schema没变, 但表格要进入loading状态, 就不要刷新数据, 这样用户体验更好
    if (this.props.tableName !== nextProps.tableName || !nextProps.tableLoading) {
      this.parseTableData(nextProps);
    }
  }

  /**
   * 解析表格的schema
   */
  parseTableSchema(props) {
    const {tableName, schema} = props;
    // 做一层缓存
    // 怎么感觉我在到处做缓存啊...工程化风格明显
    if (tableSchemaMap.has(tableName)) {
      const fromCache = tableSchemaMap.get(tableName);
      this.tableSchema = fromCache.tableSchema;
      this.fieldMap = fromCache.fieldMap;
      this.primaryKey = fromCache.primaryKey;
      return;
    }

    const toCache = {};
    const newCols = [];
    const fieldMap = new Map();
    schema.forEach((field) => {
      // 在表格中显示的时候, 要将radio/checkbox之类的转换为文字
      // 比如schema中配置的是{key:1, value:haha}, 后端返回的值是1, 但前端展示时要换成haha
      if (field.options) {
        const optionMap = {};
        for (const option of field.options) {
          optionMap[option.key] = option.value;
        }
        // 这样$$的前缀表示是内部的临时变量, 我觉得这种挺蛋疼的, 但没啥好办法...
        field.$$optionMap = optionMap;
      }

      // 有点类似索引
      fieldMap.set(field.key, field);
      // 当前列是否是主键?
      if (field.primary) {
        this.primaryKey = field.key;
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
      if (field.render) {
        col.render = field.render;
      }
      newCols.push(col);
    });

    this.tableSchema = newCols;
    this.fieldMap = fieldMap;
    toCache.tableSchema = this.tableSchema;
    toCache.fieldMap = this.fieldMap;
    tableSchemaMap.set(tableName, toCache);
  }

  /**
   * 解析表格要显示的数据
   */
  parseTableData(props) {
    // 每行数据都必须有个key属性, 如果指定了主键, 就以主键为key
    // 否则直接用个自增数字做key
    const newData = [];
    let i = 0;
    props.data.forEach((obj) => {
      const newObj = this.transformData(obj);
      if (this.primaryKey) {
        newObj.key = obj[this.primaryKey];
      } else {
        newObj.key = i;
        i++;
      }
      newData.push(newObj);
    });

    // 在这里, 下面两种写法是等效的, 因为parseTableData方法只会被componentWillReceiveProps调用, 而componentWillReceiveProps的下一步就是判断是否re-render
    // 但要注意, 不是任何情况下都等效
    //this.setState({data: newData});
    this.state.data = newData;
  }

  /**
   * 将后端返回的一条数据转换为前端表格中能显示的一条数据
   */
  transformData(obj) {
    const newObj = {};

    // 这段代码真是好蛋疼...
    for (const key in obj) {
      if (this.fieldMap.get(key).$$optionMap) {
        const optionMap = this.fieldMap.get(key).$$optionMap;
        if (obj[key] instanceof Array) {
          const newArray = [];
          for (const optionKey of obj[key]) {
            newArray.push(optionMap[optionKey]);
          }
          newObj[key] = newArray.join(',');
        } else {
          newObj[key] = optionMap[obj[key]];
        }
      } else {
        newObj[key] = obj[key];
      }
    }

    newObj.$$rawData = obj;  // 原始数据还是要保存下的, 后面update会用到
    return newObj;
  }


  /*下面是是一些事件处理的方法*/


  /**
   * 点击新增按钮, 弹出一个内嵌表单的modal
   *
   * @param e
   */
  onClickInsert = (e) => {
    e.preventDefault();
    // 注意这里, 由于antd modal的特殊性, this.formComponent可能是undefined, 要判断一下
    // insert时弹出的表单, 应该是空的
    if (this.formComponent) {
      this.formComponent.resetFields();
    } else {
      this.formInitData = {};
    }
    this.setState({
      modalVisible: true,
      modalTitle: '新增',
      modalInsert: true,
    });
  };

  /**
   * 点击更新按钮, 弹出一个内嵌表单的modal
   * 注意区分单条更新和批量更新
   *
   * @param e
   */
  onClickUpdate = (e) => {
    e.preventDefault();

    // 要显示在表单中的值
    const newData = {};
    const multiSelected = this.state.selectedRowKeys.length > 1;  // 是否选择了多项
    // 如果只选择了一项, 就把原来的值填到表单里
    // 否则就只把要更新的主键填到表单里
    if (!multiSelected) {
      logger.debug('update single record, and fill original values');
      const selectedKey = this.state.selectedRowKeys[0];
      for (const record of this.state.data) {  // 找到被选择的那条记录
        if (record.key === selectedKey) {
          // Object.assign(newData, record);  // 不能直接assign了, 因为日期要特殊处理
          for (const key in record.$$rawData) {
            // rawData中可能有些undefined或null的字段, 过滤掉
            if (!record.$$rawData[key])
              continue;

            if (this.fieldMap.get(key).dataType === 'datetime') {  // 判断是否是日期类型的字段
              newData[key] = moment(record.$$rawData[key]);
            } else {
              newData[key] = record.$$rawData[key];
            }
          }
          break;
        }
      }
    } else {
      newData[this.primaryKey] = this.state.selectedRowKeys.join(', ');
      logger.debug('update multiple records, keys = %s', newData[this.primaryKey]);
    }

    // 和insert时一样, 同样注意这里表单组件可能还未mount, 要判断一下
    if (this.formComponent) {
      this.formComponent.resetFields();
      this.formComponent.setFieldsValue(newData);
    } else {
      this.formInitData = newData;
    }

    if (multiSelected) {
      this.setState({modalVisible: true, modalTitle: '批量更新', modalInsert: false});
    } else {
      this.setState({modalVisible: true, modalTitle: '更新', modalInsert: false});
    }
  };

  /**
   * 点击删除按钮, 弹出一个确认对话框
   * 注意区分单条删除和批量删除
   *
   * @param e
   */
  onClickDelete = (e) => {
    e.preventDefault();
    Modal.confirm({
      title: this.state.selectedRowKeys.length > 1 ? '确认批量删除' : '确认删除',
      content: `当前被选中的行: ${this.state.selectedRowKeys.join(', ')}`,
      // 这里注意要用箭头函数, 否则this不生效
      onOk: () => {
        this.handleDelete();
      },
    });
  };

  /**
   * 处理表格的选择事件
   *
   * @param selectedRowKeys
   */
  onTableSelectChange = (selectedRowKeys) => {
    this.setState({selectedRowKeys});
  };

  /**
   * 隐藏modal
   */
  hideModal = () => {
    this.setState({modalVisible: false});
  };

  /**
   * 点击modal中确认按钮的回调, 清洗数据并准备传给后端
   */
  handleModalOk = () => {
    // 提交表单之前, 要先校验下数据
    let validated = true;
    this.formComponent.validateFieldsAndScroll((err, values) => validated = err ? false : validated); // 不知道有没有更好的办法
    if (!validated) {
      logger.debug('validate form error');
      return;
    }

    // 1. 将表单中的undefined去掉
    // 2. 转换日期格式
    const newObj = {};

    const oldObj = this.formComponent.getFieldsValue();  // 这里的formComponent必定不是undefined
    for (const key in oldObj) {
      if (!oldObj[key]) {
        continue;
      }

      // 跟InnerForm中的filterQueryObj方法很相似
      if (key === this.primaryKey && typeof oldObj[key] === 'string') {  // 我在InnerTableSchemaUtils限制死了, modal中的主键字段必定是个string

        // 对于主键而言, 我本来想在这里转换成array, 后来想想不用, this.state.selectedRowKeys中就已经保存着主键了, 可以直接用
        // for (const str of oldObj[key].split(', ')) {
        //   primaryKeyArray.push(str);
        // }
        // do nothing

      } else if (oldObj[key] instanceof Date) {
        newObj[key] = oldObj[key].format('yyyy-MM-dd HH:mm:ss');
      } else if (moment.isMoment(oldObj[key])) {  // 处理moment对象
        newObj[key] = oldObj[key].format('YYYY-MM-DD HH:mm:ss');
      } else {
        newObj[key] = oldObj[key];
      }
    }

    // 至此表单中的数据格式转换完毕
    this.hideModal();
    logger.debug('click modal OK and the form obj = %o', newObj);

    // 将转换后的数据传给后端
    if (this.state.modalInsert) {
      this.handleInsert(newObj);
    } else {
      this.handleUpdate(newObj);
    }
  };


  /*下面开始才是真正的数据库操作*/


  error(errorMsg) {
    // 对于错误信息, 要很明显的提示用户, 这个通知框要用户手动关闭
    notification.error({
      message: '出错啦!',
      description: `请联系管理员, 错误信息: ${errorMsg}`,
      duration: 0,
    });
  }

  /**
   * 真正去新增数据
   */
  async handleInsert(obj) {
    const CRUD = ajax.CRUD(this.props.tableName);
    const hide = message.loading('正在新增...', 0);
    try {
      const res = await CRUD.insert(obj);
      hide();
      if (res.success) {
        notification.success({
          message: '新增成功',
          description: this.primaryKey ? `新增数据行 主键=${res.data[this.primaryKey]}` : '',
          duration: 3,
        });

        // 数据变化后, 刷新下表格, 我之前是变化后刷新整个页面的, 想想还是只刷新表格比较好
        // 新增的数据放到第一行
        const newData = [];
        const transformedData = this.transformData(res.data);
        // 表格中的每条记录都必须有个唯一的key, 否则会有warn, 如果有主键就用主键, 否则只能随便给个
        // 如果key有重复的, 会有warn, 显示也会有问题, 所以后端接口要注意下, 如果DB主键都能重复, 也只能呵呵了...
        if (this.primaryKey) {
          transformedData.key = res.data[this.primaryKey];
        } else {
          transformedData.key = Math.floor(Math.random() * 233333);  // MAGIC NUMBER
        }
        newData.push(transformedData);

        for (const record of this.state.data) {
          newData.push(record);
        }

        this.setState({selectedRowKeys: [], data: newData});
      } else {
        this.error(res.message);
      }
    } catch (ex) {
      logger.error('insert exception, %o', ex);
      hide();
      this.error(`网络请求出错: ${ex.message}`);
    }
  }

  /**
   * 真正去更新数据
   */
  async handleUpdate(obj) {
    const CRUD = ajax.CRUD(this.props.tableName);
    const hide = message.loading('正在更新...', 0);
    try {
      const res = await CRUD.update(this.state.selectedRowKeys, obj);
      hide();
      if (res.success) {
        notification.success({
          message: '更新成功',
          description: `更新${res.data}条数据`,
          duration: 3,
        });

        // 数据变化后, 刷新下表格
        const transformedData = this.transformData(obj);
        const newData = [];
        const keySet = new Set(this.state.selectedRowKeys);  // array转set
        for (const record of this.state.data) {
          if (keySet.has(record.key)) {  // 是否是被更新的记录
            const newRecord = Object.assign({}, record, transformedData); // 这个应该是浅拷贝
            newRecord.$$rawData = Object.assign({}, record.$$rawData, transformedData.$$rawData);
            logger.debug('newRecord = %o', newRecord);
            newData.push(newRecord);
          } else {
            newData.push(record);
          }
        }
        this.setState({selectedRowKeys: [], data: newData});
      } else {
        this.error(res.message);
      }
    } catch (ex) {
      logger.error('update exception, %o', ex);
      hide();
      this.error(`网络请求出错: ${ex.message}`);
    }
  }

  /**
   * 真正去删除数据
   */
  async handleDelete() {
    const CRUD = ajax.CRUD(this.props.tableName);
    const hide = message.loading('正在删除...', 0);
    try {
      const res = await CRUD.delete(this.state.selectedRowKeys);
      hide();
      if (res.success) {
        notification.success({
          message: '删除成功',
          description: `删除${res.data}条数据`,
          duration: 3,
        });

        // 数据变化后, 刷新下表格
        const newData = [];
        const keySet = new Set(this.state.selectedRowKeys);  // array转set
        for (const record of this.state.data) {
          if (!keySet.has(record.key)) {  // 是否是被删除的记录
            newData.push(record);
          }
        }
        this.setState({selectedRowKeys: [], data: newData});
      } else {
        this.error(res.message);
      }
    } catch (ex) {
      logger.error('delete exception, %o', ex);
      hide();
      this.error(`网络请求出错: ${ex.message}`);
    }
  }


  render() {
    const {tableName, schema, tableLoading} = this.props;

    // 根据当前的tableName, 获取对应的表单组件
    let FormComponent = null;
    if (formMap.has(tableName)) {
      FormComponent = formMap.get(tableName);
    } else {
      FormComponent = createForm(tableName, schema);
      formMap.set(tableName, FormComponent);
    }

    const rowSelection = {
      selectedRowKeys: this.state.selectedRowKeys,
      onChange: this.onTableSelectChange,
    };

    const hasSelected = this.state.selectedRowKeys.length > 0;  // 是否选择
    const multiSelected = this.state.selectedRowKeys.length > 1;  // 是否选择了多项

    return (
      <div>
        <div className="db-table-button">
          <Affix offsetTop={8} target={() => document.getElementById('main-content-div')}>
            <Button.Group>
              <Button type="primary" onClick={this.onClickInsert}>
                <Icon type="plus-circle-o"/> 新增
              </Button>
              {/* 注意这里, 如果schema中没有定义主键, 不允许update或delete */}
              <Button type="primary" disabled={!hasSelected || !this.primaryKey} onClick={this.onClickUpdate}>
                <Icon type="edit"/> {multiSelected ? '批量修改' : '修改'}
              </Button>
              <Button type="primary" disabled={!hasSelected || !this.primaryKey} onClick={this.onClickDelete}>
                <Icon type="delete"/> {multiSelected ? '批量删除' : '删除'}
              </Button>
            </Button.Group>
          </Affix>
          {/*antd的modal实现中, 如果modal不显示, 那内部的组件是不会mount的, 导致第一次访问this.formComponent会undefined, 而我又需要设置表单的值, 所以新增一个initData属性*/}
          <Modal title={this.state.modalTitle} visible={this.state.modalVisible} onOk={this.handleModalOk}
                 onCancel={this.hideModal}>
            <FormComponent ref={(input) => { this.formComponent = input; }} initData={this.formInitData}
                           forUpdate={!this.state.modalInsert}/>
          </Modal>
        </div>

        <Table rowSelection={rowSelection} columns={this.tableSchema} dataSource={this.state.data} pagination={false}
               loading={tableLoading}/>
      </div>
    );
  }

}

export default InnerTable;
