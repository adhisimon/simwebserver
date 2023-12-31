# simwebserver
Simple web server writen in node.js to serve static file supporting multiple virtual host

## Usage
```
Options:
  --help                     Show help                                 [boolean]
  --version                  Show version number                       [boolean]
  --port                     also obey SWS_PORT env     [number] [default: 8080]
  --work-dir                 also obey SWS_WORK_DIR env
                                                    [string] [default: "public"]
  --terminate-after-seconds  also obey SWS_TERMINATE_AFTER_SECONDS env
                                                           [number] [default: 0]
  --amqp-url                 also obey SWS_AMQP_URL env                 [string]
  --amqp-exchange            also obey SWS_AMQP_EXCHANGE env            [string]
  --silent                   also obey SWS_SILENT env [boolean] [default: false]
  --pidfile                                                             [string]
```

## Virtual Host Support
To use different files for different virtual host (VHOST, SERVER NAME),
just create a subdirectory with the same name as virtual host on WORK DIR.

## Changelog
See [CHANGELOG.MD](./CHANGELOG.md).
