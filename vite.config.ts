import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({base:'/flight-flow/',plugins:[react(),VitePWA({registerType:'autoUpdate',includeAssets:['icon.svg'],manifest:{name:'飞行工具箱',short_name:'飞行工具箱',description:'飞行进程、F1 跟班、承包时间和值勤计算工具',theme_color:'#f5f5f7',background_color:'#f5f5f7',display:'standalone',orientation:'landscape',icons:[{src:'icon.svg',sizes:'any',type:'image/svg+xml',purpose:'any maskable'}]},workbox:{globPatterns:['**/*.{js,css,html,svg}']}})]});
