import globalConfig from '../config';
import MockAjax from './MockAjax';
import RealAjax from './RealAjax';

const mockAjax = new MockAjax();
const realAjax = new RealAjax();

// 这个写法总觉得有点奇怪...不知道webpack会不会优化掉
if (globalConfig.debug === true) {
  module.exports = mockAjax;
} else {
  module.exports = realAjax;
}
