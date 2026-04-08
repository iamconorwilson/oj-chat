import esbuild from 'esbuild';
import copyStaticFiles from 'esbuild-copy-static-files';

const watch = process.argv.includes('--watch');

const options = {
  entryPoints: ['src/client/script.ts'],
  bundle: true,
  outfile: 'public/js/script.js',
  minify: !watch,
  target: 'es2022',
  plugins: [
    copyStaticFiles({
      src: 'src/client/static',
      dest: 'public',
      dereference: true,
      errorOnExist: false,
      recursive: true,
    }),
  ],
};

if (watch) {
  try {
    const ctx = await esbuild.context(options);
    await ctx.watch();
    console.log('Watching client and static assets...');
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
