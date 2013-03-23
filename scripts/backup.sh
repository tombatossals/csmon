#!/bin/sh

DIR=/home/dave/csmon/backup
[ -d $DIR ] || exit
mongoexport --db troncales -h localhost -c supernodos -o $DIR/supernodos.$(date +"%Y-%m-%d").json
mongoexport --db troncales -h localhost -c enlaces -o $DIR/enlaces.$(date +"%Y-%m-%d").json
mongoexport --db troncales -h localhost -c users -o $DIR/users$(date +"%Y-%m-%d").json
