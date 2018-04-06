TEST="$(pidof mongod)"
kill -SIGKILL $TEST
rm -rf ./db/*
rmdir ./db
mkdir db
mongod --dbpath="./db"