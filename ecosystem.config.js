let arvis = [
    {
      name: "ALL In One",
      namespace: "ArviS",
      script: 'arvis.js',
      watch: false,
      exec_mode: "cluster",
      max_memory_restart: "2G"
    },
  ]
module.exports = {apps: arvis}