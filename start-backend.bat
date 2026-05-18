@echo off
cd /d "%~dp0backend"
set PATH=C:\Users\User\AppData\Local\Python\pythoncore-3.14-64\Scripts;C:\Users\User\AppData\Local\Python\pythoncore-3.14-64;%PATH%
uvicorn main:app --reload
