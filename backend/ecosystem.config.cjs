module.exports = {
  apps: [
    {
      name: 'unimaps-backend',
      script: 'src/server.js',
      cwd: __dirname,
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
    },
  ],
};
