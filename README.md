# simwebserver
Simple web server writen in node.js to serve static file supporting multiple virtual host

## Usage
```
Options:
  --help                     Show help                                 [boolean]
  --version                  Show version number                       [boolean]
  --port                     also obey SWS_PORT env     [number] [default: 8080]
  --work-dir                 also obey SMS_WORK_DIR env
                                                    [string] [default: "public"]
  --terminate-after-seconds  also obey SMS_TERMINATE_AFTER_SECONDS env
                                                           [number] [default: 0]
  --amqp-url                 also obey SWS_AMQP_URL env                 [string]
  --amqp-exchange            also obey SWS_AMQP_EXCHANGE env            [string]
  --silent                   also obey SWS_SILENT env [boolean] [default: false]
  --pidfile                                                             [string]
```