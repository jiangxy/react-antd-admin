import React from 'react';
import {Pagination, Select} from 'antd';

/**
 * 内部分页器组件
 */
class InnerPagination extends React.PureComponent {

  render() {
    // 有些状态要传到父组件中去处理
    return (
      <div className="db-pagination">
        <Pagination
          showQuickJumper
          selectComponentClass={Select}
          total={this.props.total}
          showTotal={(total) => `每页${this.props.pageSize}条, 共 ${total} 条`}
          pageSize={this.props.pageSize} defaultCurrent={1}
          current={this.props.currentPage}
          onChange={this.props.parentHandlePageChange}
          //是否显示“每页显示条目数”,对应 antd Pagination组件的showSizeChanger属性
          showSizeChanger={this.props.showSizeChanger}
          //修改“每页显示条目数”时触发,对应 antd Pagination组件的onShowSizeChange属性
          onShowSizeChange={this.props.parentHandleShowPageChange}
          pageSizeOptions={this.props.pageSizeOptions}
        />
      </div>
    );
  }

}

export default InnerPagination;
