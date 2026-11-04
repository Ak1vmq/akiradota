@echo off
chcp 65001 >nul
title ДОТА БАТЯ - Запуск через Python
echo.
echo  ╔══════════════════════════════════════════╗
echo  ║     🎮 ДОТА БАТЯ - Python запуск        ║
echo  ╚══════════════════════════════════════════╝
echo.

:: Проверяем наличие Python
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo  [ОШИБКА] Python не найден!
    echo  Используйте файл "ИГРАТЬ.bat" вместо этого.
    pause
    exit /b
)

cd /d "%~dp0"

:: Проверяем есть ли dist
if not exist "dist\" (
    echo  [INFO] Сначала нужно собрать проект...
    where node >nul 2>nul
    if %ERRORLEVEL% NEQ 0 (
        echo  [ОШИБКА] Node.js не найден для сборки!
        echo  Используйте "ИГРАТЬ.bat" вместо этого.
        pause
        exit /b
    )
    if not exist "node_modules\" call npm install
    call npm run build
)

echo  ✅ Запуск сервера...
echo.
echo  Откройте в браузере: http://localhost:8080
echo.

:: Открываем браузер
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:8080"

:: Запускаем Python HTTP сервер
cd dist
python -m http.server 8080

pause
