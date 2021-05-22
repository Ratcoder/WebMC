rm -r build
mkdir build
# App
mkdir build/app
cp -r app/* build/app/
mkdir build/node_modules
cp -r node_modules/* build/node_modules/
cp README.md build/README.md
cp package.json build/package.json
cp LICENCE build/LICENCE
cp start_webmc.sh build/start_webmc.sh
# Website
cd svelte
npm run build
cd ..
mkdir build/public
cp -R svelte/public/* build/public/
# Node.js
curl --output ./build/nodetemp.tar.xz https://nodejs.org/dist/v14.17.0/node-v14.17.0-linux-x64.tar.xz
mkdir build/nodetemp
tar xf ./build/nodetemp.tar.xz -C ./build/nodetemp
mkdir build/node
mv ./build/nodetemp/node-v14.17.0-linux-x64/* ./build/node
rm -r ./build/nodetemp
rm ./build/nodetemp.tar.xz
# Dist
cd build
tar -cJf ./dist.tar.xz ./*