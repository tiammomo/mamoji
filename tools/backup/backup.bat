@echo off
REM ============================================================
REM Mamoji 数据库备份脚本 (Windows)
REM ============================================================
REM
REM 使用方法:
REM   backup.bat          # 备份到默认目录
REM
REM 定时任务示例:
REM   schtasks /create /tn "Mamoji Backup" /tr "path\to\backup.bat" /sc daily /st 02:00
REM
REM ============================================================

setlocal

REM 配置
set BACKUP_DIR=.\backups
set DATE=%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set DATE=%DATE: =0%
set DB_HOST=localhost
set DB_PORT=3306
set DB_NAME=mamoji
set DB_USER=mamoji_mysql
set DB_PASSWORD=mamoji_mysql_pass

set RETENTION_DAYS=7

echo [INFO] 开始备份数据库: %DB_NAME%

REM 创建备份目录
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

REM 执行备份
set BACKUP_FILE=%BACKUP_DIR%\mamoji_%DATE%.sql

mysqldump -h%DB_HOST% -P%DB_PORT% -u%DB_USER% -p%DB_PASSWORD% ^
    --single-transaction ^
    --quick ^
    --lock-tables=false ^
    --routines ^
    --triggers ^
    --events ^
    %DB_NAME% > "%BACKUP_FILE%"

if %errorlevel% equ 0 (
    echo [INFO] 备份成功: %BACKUP_FILE%

    REM 压缩备份文件
    powershell -Command "Compress-Archive -Path '%BACKUP_FILE%' -DestinationPath '%BACKUP_FILE%.zip' -Force"
    del "%BACKUP_FILE%"
    set BACKUP_FILE=%BACKUP_FILE%.zip

    REM 清理旧备份
    echo [INFO] 清理 %RETENTION_DAYS% 天前的备份...
    forfiles /p "%BACKUP_DIR%" /s /m *.zip /d -%RETENTION_DAYS% /c "cmd /c del @path"

    echo [INFO] 备份完成!
) else (
    echo [ERROR] 备份失败
    exit /b 1
)

endlocal
