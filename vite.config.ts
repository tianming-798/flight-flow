import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({base:'/flight-flow/',plugins:[react(),VitePWA({registerType:'autoUpdate',includeAssets:['icon.svg'],manifest:{name:'Flight Flow · 飞行进程',short_name:'Flight Flow',description:'A320 飞行阶段、环境风险与模拟机科目提示',theme_color:'#07111f',background_color:'#07111f',display:'standalone',orientation:'landscape',icons:[{src:'icon.svg',sizes:'any',type:'image/svg+xml',purpose:'any maskable'}]},workbox:{globPatterns:['**/*.{js,css,html,svg}']}})]});
