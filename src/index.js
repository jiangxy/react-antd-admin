// main entrance

import React from 'react';
import ReactDOM from 'react-dom';
import {Router, Route, hashHistory} from 'react-router';
import Hello from './components/Hello';
import App from './components/App';

// 路由表
ReactDOM.render((
  <Router history={hashHistory}>
    <Route path="/" component={App}/>
    <Route path="/boys" component={Hello}/>
    <Route path="/girls" component={Hello}/>
  </Router>
), document.getElementById('root'));

