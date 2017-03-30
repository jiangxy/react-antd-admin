import globalConfig from '../config';
import MockAjax from './MockAjax';
import RealAjax from './RealAjax';

const mockAjax = new MockAjax();
const realAjax = new RealAjax();

const tmp = globalConfig.debug === true ? mockAjax : realAjax;
export default tmp;

// 按我之前的写法有些问题, 可能导致import的时候得到一个空对象, 猜测是循环引用的问题
// http://stackoverflow.com/questions/30378226/circular-imports-with-webpack-returning-empty-object

// // 这个写法总觉得有点奇怪...不知道webpack会不会优化掉
// if (globalConfig.debug === true) {
//   module.exports = mockAjax;
// } else {
//   module.exports = realAjax;
// }
