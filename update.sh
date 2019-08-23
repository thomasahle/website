#!/bin/sh

git add .
git commit
git push

python3 -m pip install --upgrade pip

./build.sh

scp compiled/index.html ssh.itu.dk:~/public_html/
scp compiled/pcpp.html ssh.itu.dk:~/public_html/teaching/pcpp2019/index.html
scp compiled/*.pdf ssh.itu.dk:~/public_html/
scp -r static/ ssh.itu.dk:~/public_html/


