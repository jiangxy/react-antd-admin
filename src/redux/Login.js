// 登录成功的事件
export const loginSuccessCreator = (userName) => {
  return {type: 'LOGIN_SUCCESS', payload: userName};
};

const initState = {
  login: false,  // 是否已登录
  userName: '未登录', // 登录后的用户名
};

const reducer = (state = initState, action = {}) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {...state, login: true, userName: action.payload};
    default:
      return state;
  }
};

export default {initState, reducer};
