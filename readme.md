# 使用 ts 开发 Yao-admin

适用于 `Yao 0.10.3`的 Yao-admin,使用 TS 开发

环境配置参考：https://github.com/wwsheng009/yao-app-ts-template

安装

```sh
git clone https://github.com/wwsheng009/yao-admin-ts
cd yao-admin-ts
pnpm i
```

构建

```sh
pnpm run yao:build-fix
```

调试

```sh
pnpm run debug
```

布署

```sh
./deploy.sh
```

命令

```sh

# 根据模型生成界面定义
yao studio run model.cmd.CreateFromFile
#加载模型数据
yao studio run ddic.loader.LoadModelFromFile



yao studio run model.cmd.CreateList ddic.model.relation

yao start
```
