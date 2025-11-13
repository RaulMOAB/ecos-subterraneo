@echo off
setlocal
set PATH=%~dp0node-portable;%PATH%
node %*
endlocal
