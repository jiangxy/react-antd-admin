import {applyMiddleware, createStore, compose, combineReducers} from 'redux';
import createLogger from 'redux-logger';
import globalConfig from 'config.js';
import Sidebar from './Sidebar.js';
import Login from './Login.js';

/* 这个文件用于生成store */

// 设置各种中间件
const logger = createLogger();
let middleware;
if (globalConfig.debug) {
  middleware = applyMiddleware(logger);
} else {
  middleware = applyMiddleware();
}

// 设置redux dev tools
const composeEnhancers =
  process.env.NODE_ENV !== 'production' &&
  typeof window === 'object' &&
  window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ ?
    window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
      // Specify here name, actionsBlacklist, actionsCreators and other options
    }) : compose;
const enhancer = composeEnhancers(
  middleware,
  // other store enhancers if any
);


// 整体的初始状态
// 就是把每个组件自己的初始状态组合起来, 注意key的名字和组件名一致
const initState = {
  Sidebar: Sidebar.initState,
  Login: Login.initState,
};


// 定义reducer
// 每个组件自己的reducer负责维护自己的状态, 注意key的名字和组件名一致
const reducers = {
  Sidebar: Sidebar.reducer,
  Login: Login.reducer,
};


// 组合最终的store
const store = createStore(combineReducers(reducers), initState, enhancer);

export default store;
