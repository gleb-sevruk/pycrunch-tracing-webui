# pycrunch_tracing_webui

Repository holding UI:

http://app.pytrace.com/

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Run your unit tests
```
npm run test:unit
```

### Deployment

```shell
  ssh root@app.pytrace.com
  cd code/pycrunch-tracing-webui/
  git pull
  npm run build
  cp -a /root/code/pycrunch-tracing-webui/dist/. /var/www/app.pytrace.com/html/
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
