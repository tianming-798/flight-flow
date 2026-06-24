# Flight Flow · 飞行进程

面向 iPad 横屏使用的 A320 飞行阶段、环境风险与模拟机科目提示 PWA。

## 本地运行

```powershell
npm install
npm run dev
```

浏览器打开终端显示的地址。iPad 与电脑处于同一网络时，可使用电脑局域网地址访问；部署到 HTTPS 静态站点后可从 Safari“添加到主屏幕”。

## 验证与构建

```powershell
npm test
npm run build
npm run preview
```

生产文件位于 `dist/`，可部署到任意支持 HTTPS 的静态托管服务。

## 数据

执行进度、环境规则、正常流程模板和模拟机科目库保存在当前浏览器的 IndexedDB 中。可从设置页导出 JSON 完整备份，或导入后选择合并/覆盖。

