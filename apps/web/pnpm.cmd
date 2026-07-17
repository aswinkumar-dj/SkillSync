@echo off
if /I "%1"=="config" if /I "%2"=="get" if /I "%3"=="registry" (
  echo https://registry.npmjs.org/
  exit /b 0
)
exit /b 1
