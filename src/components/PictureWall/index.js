import React from 'react';
import {Upload, Icon, Modal, message} from 'antd';
import globalConfig from '../../config.js';
import Utils from '../../utils';
import Logger from '../../utils/Logger.js';
import './index.less';

const logger = Logger.getLogger('PictureWall');

/**
 * 图片上传组件, 样式基本是从antd官网抄过来的
 *
 * 这个组件可以配合antd的FormItem使用, 以后可以参考
 */
class PictureWall extends React.Component {

  // 注意这个组件不能做成PureComponent, 会有bug, 因为上传的过程中会不断触发onChange, 进而导致状态不断变化

  state = {
    previewVisible: false,  // 是否显示预览
    previewImage: '',  // 要预览的图片
    fileList: [],  // 已经上传的文件列表
  };

  // 上传按钮, 每次render的时候重新定义也可以, 但感觉拿出来只定义一次更好
  uploadButton = (
    <div>
      <Icon type="plus"/>
      <div className="ant-upload-text">上传图片</div>
    </div>
  );

  componentWillMount() {
    const {defaultValue, max, url} = this.props;
    // 组件第一次加载的时候, 设置默认值
    this.forceUpdateStateByValue(defaultValue, max);
    // 是否自定义了图片上传的路径
    if (url) {
      if (url.startsWith('http')) {
        this.uploadUrl = url;
      } else {
        this.uploadUrl = `${globalConfig.getAPIPath()}${url}`;
      }
    } else {
      this.uploadUrl = `${globalConfig.getAPIPath()}${globalConfig.upload.image}`;  // 默认路径
    }

    logger.debug('image upload url = %s', this.uploadUrl);
  }

  componentWillReceiveProps(nextProps) {
    // 如果上层通过props传过来一个value, 要不要根据value更新文件列表?
    // 对于普通的controlled-components而言, 是应该更新的, 相当于本身没有状态, 完全被上层控制
    // 但这个组件不是完全的controlled-components...只会向外暴露value, 但也有自己的状态

    // 传进来的value有两种情况:
    // 1. 本身状态变化后, 通过onChange回调向外暴露, 状态又会通过this.props.value的形式回传, 这种情况不需要更新
    // 2. 外界直接setFieldValue, 直接改变这个组件的状态, 这种情况下需要更新

    if (this.needRender(nextProps)) {
      const {value, max} = nextProps;
      this.forceUpdateStateByValue(value, max);
    }
  }

  /**
   * 将props中传过来的value跟当前的state相比较, 看是否要更新state
   *
   * @param nextProps
   * @returns {boolean}
   */
  needRender(nextProps) {
    const {value} = nextProps;
    // 如果外界传过来的value是undefined, 需要清空文件上传列表
    if (!value) {
      return true;
    }

    // 当前已经上传的文件列表
    const fileArray = this.state.fileList.filter(file => file.status === 'done');
    // 外界传过来一个string
    if (Utils.isString(value)) {
      if (fileArray.length !== 1 || value !== fileArray[0].url) {  // 当前没有上传文件, 或者已经上传的文件和外界传过来的不是同一个文件, 需要替换
        return true;
      }
    }
    // 外界传过来一个数组
    else if (value instanceof Array) {
      // 两个数组对应的文件url必须完全一样, 才认为是同样的数据, 不需更新
      if (value.length !== fileArray.length) {
        return true;
      }
      for (let i = 0; i < value.length; i++) {
        if (value[i] !== fileArray[i].url) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * 强制更新state中的上传文件列表
   *
   * @param value
   * @param max
   */
  forceUpdateStateByValue(value, max) {
    // 首先清空文件列表
    this.state.fileList.length = 0;
    if (Utils.isString(value)) {
      this.state.fileList.push({
        uid: -1,
        name: value.substr(value.lastIndexOf('/')),  // 取url中的最后一部分作为文件名, 不过这个名字其实没啥用...
        status: 'done',
        url: value,
      });
    } else if (value instanceof Array) {
      if (max === 1 && value.length > 0) {
        // 如果max=1, 正常情况下value应该是个string的
        // 但如果传进来一个数组, 就只取第一个元素
        this.state.fileList.push({
          uid: -1,
          name: value[0].substr(value[0].lastIndexOf('/')),
          status: 'done',
          url: value[0],
        });
      } else {
        for (let i = 0; i < value.length; i++) {
          this.state.fileList.push({
            uid: -1 - i,
            name: value[i].substr(value[i].lastIndexOf('/')),
            status: 'done',
            url: value[i],
          });
        }
      }
    }
  }

  /**
   * 调用上传接口之前校验一次
   *
   * @param file
   * @returns {boolean}
   */
  beforeUpload = (file) => {
    const sizeLimit = this.props.sizeLimit || globalConfig.upload.imageSizeLimit;
    if (sizeLimit) {
      if (file.size / 1024 > sizeLimit) {
        message.error(`图片过大，最大只允许${sizeLimit}KB`);
        return false;
      }
    }

    return true;
  };

  /**
   * 点击预览按钮
   *
   * @param file
   */
  handlePreview = (file) => {
    this.setState({
      previewImage: file.url || file.thumbUrl,
      previewVisible: true,
    });
  };

  /**
   * 预览界面点击取消按钮
   */
  handleCancel = () => this.setState({previewVisible: false});

  /**
   * 上传文件时的回调, 注意上传过程中会被调用多次
   * 删除图片时也会触发这个方法
   * 参考: https://ant.design/components/upload-cn/#onChange
   *
   * @param fileList
   */
  handleChange = ({file, fileList}) => {
    // 还要自己处理一下fileList
    for (const tmp of fileList) {
      if (tmp.status === 'done' && !tmp.url && tmp.response && tmp.response.success) {
        tmp.url = tmp.response.data;  // 服务端返回的图片地址
      }
    }

    // 上传失败
    if (file.status === 'error') {
      // debug模式下, 上传是必定失败的, 为了测试用, 给一个默认图片
      if (globalConfig.debug) {
        message.info('debug模式下使用测试图片', 2.5);
        fileList.push({
          uid: Date.now(),
          name: 'avatar.jpg',
          status: 'done',
          url: 'http://jxy.me/about/avatar.jpg',
        });
        this.notifyFileChange();
      } else {
        message.error(`图片${file.name}上传失败`, 2.5);
      }
    }
    // 上传成功 or 删除图片
    else if (file.status === 'done' || file.status === 'removed') {
      this.notifyFileChange();
    }
    // 其实还有正在上传(uploading)的状态, 不过这里不关心

    // 注意对于controlled components而言, 这步setState必不可少
    // 见https://github.com/ant-design/ant-design/issues/2423
    this.setState({fileList});

    // 其实这里可能有点小问题
    // notifyFileChange方法会通知上层组件, 文件列表变化了, 对于antd的FormItem而言, 新的值又会通过props.value的形式回传, 导致re-render
    // 也就是说, 在已经调用过notifyFileChange的情况下, 其实不需要上面的手动setState再触发re-render, 有点重复, 效率上可能会受点影响
    // 但我还是决定保留setState, 因为props.value其实是antd中受控表单组件的特殊逻辑, 而这个组件可能不只用于FormItem
  };

  /**
   * 文件列表变化后, 通知上层
   */
  notifyFileChange = () => {
    const {onChange, max} = this.props;

    if (onChange) {
      // 传给回调的参数可能是个string, 也可能是个array, 要判断一下
      let res;
      if (max === 1) {
        // 这里要判断下状态, 因为文件被删除后状态会变为removed
        // 只返回给上层"正确"的图片
        if (this.state.fileList.length > 0 && this.state.fileList[0].status === 'done') {
          res = this.state.fileList[0].url;
        }
      } else {
        res = this.state.fileList.filter(file => file.status === 'done').map(file => file.url);  // 注意先filter再map, 因为map必须是一一对应的
        // 如果res是undefined, 那对应的, 后端收到的就是null
        // 如果res是空的数组, 后端收到的就是一个空的List, 但是这样没啥意义, 还是null语义更明确
        if (res.length === 0) {
          res = undefined;
        }
      }

      // 这个回调配合getValueFromEvent可以定制如何从组件中取值, 很方便, 参考: https://ant.design/components/form-cn/#getFieldDecorator(id,-options)-参数
      // 但是我这次没用到, 因为默认的getValueFromEvent已经可以满足需求
      onChange(res);
    }
  };

  render() {
    const {previewVisible, previewImage, fileList} = this.state;

    // 我本来是写成accept="image/*"的, 但chrome下有些bug, 要很久才能弹出文件选择框
    // 只能用后缀名的写法了, 只支持常见的图片格式
    return (
      <div>
        <Upload
          action={this.uploadUrl}
          listType="picture-card"
          fileList={fileList}
          onPreview={this.handlePreview}
          onChange={this.handleChange}
          beforeUpload={this.beforeUpload}
          accept=".jpg,.png,.gif,.jpeg"
          withCredentials={globalConfig.isCrossDomain()}
        >
          {fileList.length >= this.props.max ? null : this.uploadButton}
        </Upload>
        <Modal visible={previewVisible} footer={null} onCancel={this.handleCancel}>
          <img alt="example" style={{ width: '100%' }} src={previewImage}/>
        </Modal>
      </div>
    );
  }

}

PictureWall.propTypes = {
  max: React.PropTypes.number.isRequired,  // 最多可以上传几张图片
  sizeLimit: React.PropTypes.number,  // 图片的大小限制, 单位KB
  onChange: React.PropTypes.func,  // 图片上传后的回调函数, 传入参数是图片的url
  defaultValue: React.PropTypes.oneOfType([  // 默认值, 可以是单张图片, 也可以是一组图片
    React.PropTypes.string,
    React.PropTypes.array,
  ]),
  value: React.PropTypes.oneOfType([  // 受控组件
    React.PropTypes.string,
    React.PropTypes.array,
  ]),
  url: React.PropTypes.string,  // 自定义图片的上传地址
};

PictureWall.defaultProps = {
  max: 1,  // 默认只上传一张图片
};

export default PictureWall;
