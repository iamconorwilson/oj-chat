import esbuild from 'esbuild';

const watch = process.argv.includes('--watch');

const options = {
  entryPoints: [
    { in: 'src/client/script.ts', out: 'js/script' },
    { in: 'src/client/static/css/styles.css', out: 'css/styles' },
    { in: 'src/client/static/index.html', out: 'index' },
    { in: 'src/client/static/chat.html', out: 'chat' }
  ],
  bundle: true,
  outdir: 'public',
  loader: {
    '.html': 'copy'
  },
  minify: !watch,
  target: 'es2022',
  define: {
    'window.IS_PRODUCTION': watch ? 'false' : 'true',
  }
};

if (watch) {
  try {
    const ctx = await esbuild.context(options);
    await ctx.watch();
    const { port } = await ctx.serve({
      servedir: 'public',
    });

    console.log('Watching client and static assets...');
    console.log(`Development server running on http://localhost:${port}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
} else {
  try {
    await esbuild.build(options);
    console.log('Client build and asset copy complete.');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

