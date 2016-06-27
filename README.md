# React Hello world

定义React工程的基础目录结构，使用了React + Babel + Webpack

## 使用方法

1. 保证node版本5.3+，npm版本3.3+
2. `npm install`，安装必要的依赖
3. `npm run build`，编译js文件，结果会放在`dist/bundle.js`，可以打开`dist/index.html`查看效果

## 其他一些命令

1. `npm run dev`，运行一个测试服务器，可以在`http://localhost:8080`查看效果，会实时同步代码更新
2. `npm run eslint`，运行js/jsx文件的风格检查
3. `npm run stylelint`，运行css文件的风格检查
4. `npm run lint`，同时运行eslint和stylelint

## 工程结构

| 目录名  | 说明 |
| ------------- | ------------- |
| .editorconfig  | EditorConfig配置文件。http://editorconfig.org/ |
| .eslintrc | ESLint配置文件。http://eslint.org/ |
| .stylelintrc  | StyleLint配置文件。http://stylelint.io/ |
| dist | 编译时的目标目录。js文件编译后会在这个目录生成bundle.js文件。这个目录也包括一个index.html文件用于承载js。 |
| docs | 放置各种项目文档 |
| node_modules | 存放各种node模块，`npm install`会自动生成 |
| package.json | 项目的配置，包括一些基本信息和依赖等 |
| src/components | 所有React组件放在这里，每个组件单独一个目录。|
| src/index.js | 编译js时的入口，通俗的说，是将各种React组件组装起来的地方 |
| webpack.config.js | webpack的配置文件 |

## 一些约定

1. 使用ES6的写法
2. 每个React组件尽量“高内聚”，相关的配置、样式等都放在同一个目录中

