import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * This project is published at a custom domain:
 * https://template.resumetemplate.cn/
 *
 * Keep base as "/" while the custom domain is enabled in GitHub Pages.
 * If the custom domain is removed and the site is published at
 * https://<account>.github.io/<repository>/, change this to "/<repository>/".
 */
export default defineConfig({
  base: '/',
  plugins: [react()],
});
