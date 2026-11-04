@echo off
chcp 65001 >nul
title ДОТА БАТЯ - Смешная МОБА
echo.
echo  ╔══════════════════════════════════════════╗
echo  ║     🎮 ДОТА БАТЯ - Смешная МОБА 🎮     ║
echo  ║                                          ║
echo  ║   Запуск игры... Подождите секунду!      ║
echo  ╚══════════════════════════════════════════╝
echo.

:: Проверяем наличие Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo  [ОШИБКА] Node.js не найден!
    echo.
    echo  Скачайте Node.js с сайта: https://nodejs.org
    echo  Установите и запустите этот файл снова.
    echo.
    pause
    exit /b
)

:: Переходим в папку проекта
cd /d "%~dp0"

:: Проверяем есть ли node_modules
if not exist "node_modules\" (
    echo  [INFO] Установка зависимостей...
    echo  Это займёт 1-2 минуты при первом запуске.
    echo.
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo  [ОШИБКА] Не удалось установить зависимости!
        pause
        exit /b
    )
)

:: Собираем проект
echo  [INFO] Сборка игры...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo  [ОШИБКА] Ошибка сборки!
    pause
    exit /b
)

:: Запускаем сервер и открываем браузер
echo.
echo  ╔══════════════════════════════════════════╗
echo  ║   ✅ Игра запущена!                      ║
echo  ║   Откроется в браузере автоматически.    ║
echo  ║                                          ║
echo  ║   Не закрывайте это окно!               ║
echo  ║   Адрес: http://localhost:3000           ║
echo  ╚══════════════════════════════════════════╝
echo.

:: Открываем браузер через 2 секунды
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:3000"

:: Запускаем простой HTTP сервер
npx serve dist -l 3000 --no-clipboard

pause
