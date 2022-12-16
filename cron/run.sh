#!/bin/bash
DIR_PATH=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
#NODE_BIN=/usr/local/bin/node
NODE_BIN=/home/tylerquast/.nvm/versions/node/v18.12.0/bin/node
cd "$DIR_PATH/.." 
"$NODE_BIN" --loader ts-node/esm --no-warnings cron/fetchStats.ts 2>&1 | tee cron/logs/log.txt
