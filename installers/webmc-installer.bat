@echo off
curl --output ./nodetemp.zip https://nodejs.org/dist/v14.16.1/node-v14.16.1-win-x64.zip
powershell.exe -NoP -NonI -Command "Expand-Archive -Force './nodetemp.zip' './nodetemp/'"
move ".\nodetemp\node-v14.16.1-win-x64" ".\node"
rmdir nodetemp
del nodetemp.zip
echo WebMC is installed!
echo Set your username and password for WebMC. You will use them to log in and manage your server.
set /p username=Username: 
:confirmpasswordloop
set /p password=Password: 
set /p confirmpassword=Confirm Password: 
if NOT %password%  == %confirmpassword% (
    echo Passwords did not match!
    goto :confirmpasswordloop
)
node\node.exe ./app/scripts/install.js %username% %password%