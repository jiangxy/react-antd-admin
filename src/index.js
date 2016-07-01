/**
 * 程序的入口, 类似java中的main
 */

import React from 'react';
import ReactDOM from 'react-dom';
import {Router, Route, IndexRoute, hashHistory} from 'react-router';
import Hello from './components/Hello';
import Hello2 from './components/Hello2';
import App from './components/App';

// 路由表
ReactDOM.render((
  <Router history={hashHistory}>
    <Route path="/" component={App}>
      <IndexRoute component={Hello2}/>
      <Route breadcrumbName="hello" path="/hello" component={Hello}/>
      <Route breadcrumbName="hello2" path="/hello2" component={Hello2}/>
    </Route>
  </Router>
), document.getElementById('root'));
