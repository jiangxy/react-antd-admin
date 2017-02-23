# 工程规范

定义React工程的基础规范，本项目使用了React + Babel + Webpack.

## 目录结构

| 文件名  | 说明 |
| ------------- | ------------- |
| .editorconfig  | [EditorConfig](http://editorconfig.org/)配置文件 |
| .eslintrc | [ESLint](http://eslint.org/)配置文件 |
| .stylelintrc  | [StyleLint](http://stylelint.io/)配置文件 |
| .lesshintrc | [lesshint](https://github.com/lesshint/lesshint)配置文件 |
| dist | 编译时的目标目录。js文件编译后会在这个目录生成bundle.js文件，生产环境编译js后会生成bundle.min.js文件 |
| docs | 放置各种项目文档 |
| node_modules | 放置各种node模块，`npm install`时会自动生成 |
| package.json | 项目的配置，包括一些基本信息和依赖关系等 |
| src/components | 所有React组件放在这里，每个组件单独一个目录。|
| src/schema | 放置数据库表对应的querySchema和dataSchema |
| src/utils | 各种工具类 |
| src/redux | redux相关的store/reducer/action/initState等都扔在这里 |
| src/index.js | 编译js时的入口。通俗的说，是将各种React组件组装起来的地方 |
| src/config.js | 项目的配置文件 |
| src/menu.js | 侧边栏的配置文件 |
| index.html.template | html文件模版 |
| webpack.config.js | webpack的配置文件 |
| webpack.config.prod.js | 生产环境下webpack的配置文件，会做一些压缩/优化之类的。 |

## git规范

1. master分支用于发布, dev分支用于开发, 有必须要的话可以开各种feature分支
2. 发布时将dev分支merge到master上, 并打相应版本号的tag
3. 版本号遵循`x.y.z`的原则

## 一些约定

1. 所有js/jsx文件，使用ES6的写法。
2. 样式文件尽量使用less而不是css。
3. React组件尽量“高内聚”，相关的配置、样式等都放在同一个目录中。
