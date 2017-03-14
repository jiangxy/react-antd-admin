import React from 'react';
import {
  Button,
  Table,
  Icon,
  Modal,
  message,
  notification,
  Affix
} from 'antd';
import Logger from '../../utils/Logger';
import Utils from '../../utils';
import ajax from '../../utils/ajax';
import moment from 'moment';
import ImageSlider from '../ImageSlider';
import InnerTableSchemaUtils from './InnerTableSchemaUtils';

const logger = Logger.getLogger('InnerTable');

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

    // 图片预览相关状态
    previewVisible: false,  // 是否显示图片预览modal
    previewImages: [], // 要预览的图片
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
    const parseResult = InnerTableSchemaUtils.getTableSchema(tableName, schema);

    this.primaryKey = parseResult.primaryKey;
    this.fieldMap = parseResult.fieldMap;
    // 对于tableSchema, 即使命中了缓存, 也要重新设置下render函数
    this.tableSchema = this.bindTableColRender(parseResult.tableSchema);
  }


  /*下面开始是一些默认的render方法*/

  // FIXME: 其实render的作用和transformData有些重复, 要不要考虑合并下?

  /**
   * 设置tableSchema的render属性
   *
   * @param tableSchema
   * @returns {*}
   */
  bindTableColRender(tableSchema) {
    tableSchema.forEach(col => {
      const field = this.fieldMap.get(col.key);
      // 用户自己配置的render最优先
      if (field && field.render) {
        col.render = field.render.bind(this);  // 给用户的render手动绑定this
      }
      // 对于某些showType我会给个默认的render
      else if (field.showType === 'image') {
        col.render = this.renderImage;
      } else if (field.showType === 'file') {
        col.render = this.renderFile;
      }
    });
    return tableSchema;
  }

  /**
   * 针对image字段的render方法
   *
   * @param text
   * @returns {*}
   */
  renderImage = (text) => {
    if (Utils.isString(text)) {
      return <img src={text} alt="图片加载失败" style={{width: '100%'}} onClick={() => this.onClickImage(text)}/>
    } else if (text instanceof Array) {
      // 如果是多张图片, 只取第一张图片在表格中显示
      return <img src={text[0]} alt="图片加载失败" style={{width: '100%'}} onClick={() => this.onClickImage(text)}/>
    } else {
      return text;
    }
  };

  // 点击图片时显示幻灯片
  onClickImage = (text) => {
    const newImageArray = [];
    if (Utils.isString(text) && text.length > 0) {
      newImageArray.push({url: text, alt: '图片加载失败'});
    } else if (text instanceof Array) {
      for (const tmp of text) {
        newImageArray.push({url: tmp, alt: '图片加载失败'});
      }
    }
    // 如果没有图片, 点击就不要显示modal
    if (newImageArray.length > 0) {
      this.setState({previewVisible: true, previewImages: newImageArray});
    }
  };

  // 隐藏图片预览
  cancelPreview = () => {
    this.setState({previewVisible: false});
  };

  /**
   * 针对file字段的render方法
   *
   * @param text
   * @returns {*}
   */
  renderFile = (text) => {
    if (Utils.isString(text) && text.length > 0) {
      // 单个文件, 显示为超链接
      return <a href={text} target="_blank">{text.substr(text.lastIndexOf('/') + 1)}</a>;
    } else if (text instanceof Array) {
      if (text.length === 0) {
        return null;
      }
      // 多个文件, 显示为一组超链接
      const urlArray = [];
      urlArray.push(<a key={0} href={text[0]} target="_blank">{text[0].substr(text[0].lastIndexOf('/') + 1)}</a>);
      for (let i = 1; i < text.length; i++) {
        urlArray.push(<br key={ -1 - i }/>);
        urlArray.push(<a key={i} href={text[i]} target="_blank">{text[i].substr(text[i].lastIndexOf('/') + 1)}</a>);
      }
      return <div>{urlArray}</div>
    } else {
      return text;
    }
  };

  /*render END*/


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
   * 后端返回的往往是数字(比如0表示屏蔽, 1表示正常)
   * 而表格中要显示对应的汉字, 跟dataSchema中的配置对应
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

    // 理论上来说应该先设置好表单的值(setFieldsValue)再显示modal
    // 美中不足的是表单的值变化需要一个时间, 显示modal的过程中可能被用户看到"旧值变新值"的过程, 在FileUploader组件上传图片时这个现象很明显
    // 跟组件的实现方式有关, 可能是css动画的问题, 也可能是setState异步的问题, 似乎暂时无解...

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
      // if (!oldObj[key]) {
      // 原来的这种写法是有bug的, 因为空字符串也会被过滤掉, 而有时候空字符串传回后端也是有意义的

      // 这里有个问题, 更新的时候, 某个字段后端接收到了null, 到底是忽略这个字段还是将字段更新为null(默认值)? 用过mybatis的应该能明白啥意思
      // 这个问题貌似是无解的, 在后端字段只有null/not null两种状态, 而前端可以用3种状态: undefined表示不更新, null表示更新为null, 其他值表示更新为特定的值
      // 只能认为undefined/null都对应于后端的null
      // 换句话说, 如果DB里某个字段已经有值了, 就不可能再修改为null了, 即使建表时是允许null的. 最多更新成空字符串. 除非跟后端约定一个特殊的值去表示null.
      // 一般情况下这不会有什么影响, 但某些corner case里可能有bug...

      // 另外, 要理解antd form的取值逻辑. antd的form是controlled components, 只有当FormItem变化时才会取到值(通过onChange方法), 否则对应的key就是undefined
      // 例如, 如果有一个输入框, 如果不动它, 然后getFieldsValue, 得到的是undefined; 如果先输入几个字符, 然后再全部删除, 再getFieldsValue, 得到的是空字符串
      // 注意下日期类型, 它返回的是一个moment对象, 所以取到的值可能是null
      // 如果写自己的FormItem组件, 一定要注意下这个问题

      if (oldObj[key] === undefined || oldObj[key] === null) {
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
  async handleDelete(keys = this.state.selectedRowKeys) {
    const CRUD = ajax.CRUD(this.props.tableName);
    const hide = message.loading('正在删除...', 0);
    try {
      const res = await CRUD.delete(keys);
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
    const {tableName, schema, tableLoading, tableConfig} = this.props;

    // 根据当前的tableName, 获取对应的表单组件
    const FormComponent = InnerTableSchemaUtils.getForm(tableName, schema);

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
              {tableConfig.showInsert &&
              <Button type="primary" onClick={this.onClickInsert}>
                <Icon type="plus-circle-o"/> 新增
              </Button>}
              {/* 注意这里, 如果schema中没有定义主键, 不允许update或delete */}
              {tableConfig.showUpdate &&
              <Button type="primary" disabled={!hasSelected || !this.primaryKey} onClick={this.onClickUpdate}>
                <Icon type="edit"/> {multiSelected ? '批量修改' : '修改'}
              </Button>}
              {tableConfig.showDelete &&
              <Button type="primary" disabled={!hasSelected || !this.primaryKey} onClick={this.onClickDelete}>
                <Icon type="delete"/> {multiSelected ? '批量删除' : '删除'}
              </Button>}
            </Button.Group>
          </Affix>
          {/*antd的modal实现中, 如果modal不显示, 那内部的组件是不会mount的, 导致第一次访问this.formComponent会undefined, 而我又需要设置表单的值, 所以新增一个initData属性*/}
          <Modal title={this.state.modalTitle} visible={this.state.modalVisible} onOk={this.handleModalOk}
                 onCancel={this.hideModal} maskClosable={false} width={550}>
            <FormComponent ref={(input) => { this.formComponent = input; }} initData={this.formInitData}
                           forUpdate={!this.state.modalInsert}/>
          </Modal>
        </div>

        <Modal visible={this.state.previewVisible} footer={null} onCancel={this.cancelPreview}>
          <ImageSlider items={this.state.previewImages}/>
        </Modal>

        <Table rowSelection={rowSelection} columns={this.tableSchema} dataSource={this.state.data} pagination={false}
               loading={tableLoading}/>
      </div>
    );
  }

}

export default InnerTable;
