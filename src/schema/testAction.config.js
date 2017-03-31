module.exports = {
  showExport: false,
  showImport: false,
  showInsert: true,
  showUpdate: true,
  showDelete: true,
  asyncSchema: true,  // 是否异步加载schema, 默认false
  ignoreSchemaCache: true,  // 如果异步加载schema, 是否忽略缓存, 默认只会请求一次后端然后将结果缓存起来
};
