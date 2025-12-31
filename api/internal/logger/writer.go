package logger

import (
	"fmt"
	"io"
	"os"
	"path"
	"path/filepath"
	"sync"
	"time"
)

// Writer 日志写入器接口
type Writer interface {
	Write(entry *Entry) error
	Level() LogLevel
	SetLevel(level LogLevel)
	Close() error
	Name() string
}

// ConsoleWriter 控制台写入器
type ConsoleWriter struct {
	level    LogLevel
	color    bool
	format   string
	mu       sync.Mutex
}

// NewConsoleWriter 创建控制台写入器
func NewConsoleWriter(opts ...ConsoleOption) *ConsoleWriter {
	w := &ConsoleWriter{
		level:  DEBUG,
		color:  true,
		format: "text",
	}
	for _, opt := range opts {
		opt(w)
	}
	return w
}

// ConsoleOption 控制台选项
type ConsoleOption func(*ConsoleWriter)

// WithConsoleLevel 设置控制台日志级别
func WithConsoleLevel(level LogLevel) ConsoleOption {
	return func(w *ConsoleWriter) {
		w.level = level
	}
}

// WithConsoleColor 启用/禁用颜色
func WithConsoleColor(color bool) ConsoleOption {
	return func(w *ConsoleWriter) {
		w.color = color
	}
}

// WithConsoleFormat 设置输出格式
func WithConsoleFormat(format string) ConsoleOption {
	return func(w *ConsoleWriter) {
		w.format = format
	}
}

// Write 写入日志
func (w *ConsoleWriter) Write(entry *Entry) error {
	entryLevel := ParseLevel(entry.Level)
	if !w.level.Enabled(entryLevel) {
		return nil
	}

	w.mu.Lock()
	defer w.mu.Unlock()

	output := entry.Format(w.format)

	// 颜色输出
	if w.color {
		output = w.colorize(entryLevel, output)
	}

	_, err := fmt.Fprintln(os.Stdout, output)
	return err
}

// Level 获取日志级别
func (w *ConsoleWriter) Level() LogLevel {
	return w.level
}

// SetLevel 设置日志级别
func (w *ConsoleWriter) SetLevel(level LogLevel) {
	w.level = level
}

// Close 关闭（控制台不需要关闭）
func (w *ConsoleWriter) Close() error {
	return nil
}

// Name 获取名称
func (w *ConsoleWriter) Name() string {
	return "console"
}

// colorize 添加颜色
func (w *ConsoleWriter) colorize(level LogLevel, msg string) string {
	var color string
	switch level {
	case DEBUG:
		color = "\033[37m" // 白色
	case INFO:
		color = "\033[32m" // 绿色
	case WARN:
		color = "\033[33m" // 黄色
	case ERROR:
		color = "\033[31m" // 红色
	case FATAL, PANIC:
		color = "\033[35m" // 紫色
	default:
		color = "\033[0m"
	}
	return color + msg + "\033[0m"
}

// FileWriter 文件写入器
type FileWriter struct {
	level     LogLevel
	format    string
	mu        sync.Mutex
	file      *os.File
	filepath  string
	filename  string
	maxSize   int64
	maxAge    time.Duration
	maxBackups int
}

// FileOption 文件选项
type FileOption func(*FileWriter)

// WithFileLevel 设置文件日志级别
func WithFileLevel(level LogLevel) FileOption {
	return func(w *FileWriter) {
		w.level = level
	}
}

// WithFileFormat 设置输出格式
func WithFileFormat(format string) FileOption {
	return func(w *FileWriter) {
		w.format = format
	}
}

// WithFileMaxSize 设置最大文件大小
func WithFileMaxSize(size int64) FileOption {
	return func(w *FileWriter) {
		w.maxSize = size
	}
}

// WithFileMaxAge 设置最大保存天数
func WithFileMaxAge(age time.Duration) FileOption {
	return func(w *FileWriter) {
		w.maxAge = age
	}
}

// WithFileMaxBackups 设置最大备份数量
func WithFileMaxBackups(n int) FileOption {
	return func(w *FileWriter) {
		w.maxBackups = n
	}
}

// NewFileWriter 创建文件写入器
func NewFileWriter(filepath string, opts ...FileOption) (*FileWriter, error) {
	// 确保目录存在
	dir := path.Dir(filepath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return nil, fmt.Errorf("创建日志目录失败: %w", err)
	}

	w := &FileWriter{
		level:      DEBUG,
		format:     "json",
		filepath:   filepath,
		filename:   filepath,
		maxSize:    100 * 1024 * 1024, // 默认100MB
		maxAge:     7 * 24 * time.Hour, // 默认7天
		maxBackups: 10, // 默认保留10个备份
	}

	for _, opt := range opts {
		opt(w)
	}

	// 打开文件
	if err := w.openFile(); err != nil {
		return nil, err
	}

	return w, nil
}

// openFile 打开文件
func (w *FileWriter) openFile() error {
	file, err := os.OpenFile(w.filepath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if err != nil {
		return fmt.Errorf("打开日志文件失败: %w", err)
	}
	w.file = file
	return nil
}

// Write 写入日志
func (w *FileWriter) Write(entry *Entry) error {
	entryLevel := ParseLevel(entry.Level)
	if !w.level.Enabled(entryLevel) {
		return nil
	}

	w.mu.Lock()
	defer w.mu.Unlock()

	// 检查是否需要轮转
	if err := w.checkRotation(); err != nil {
		return err
	}

	output := entry.Format(w.format)
	_, err := w.file.WriteString(output + "\n")
	return err
}

// checkRotation 检查是否需要轮转
func (w *FileWriter) checkRotation() error {
	if w.file == nil {
		return w.openFile()
	}

	// 检查文件大小
	stat, err := w.file.Stat()
	if err != nil {
		return err
	}

	if stat.Size() >= w.maxSize {
		return w.rotate()
	}

	return nil
}

// rotate 轮转日志文件
func (w *FileWriter) rotate() error {
	// 关闭当前文件
	if err := w.file.Close(); err != nil {
		return err
	}

	// 生成新文件名
	timestamp := time.Now().Format("20060102_150405")
	newName := fmt.Sprintf("%s.%s.log", w.filename, timestamp)

	// 重命名当前文件
	if err := os.Rename(w.filename, newName); err != nil {
		return fmt.Errorf("重命名日志文件失败: %w", err)
	}

	// 打开新文件
	if err := w.openFile(); err != nil {
		return err
	}

	// 清理旧文件
	w.cleanup()

	return nil
}

// cleanup 清理过期文件
func (w *FileWriter) cleanup() {
	// 删除超出数量限制的旧文件
	files, _ := filepath.Glob(w.filename + ".*.log")
	if len(files) <= w.maxBackups {
		return
	}

	// 按修改时间排序
	infos := make([]fileInfo, 0, len(files))
	for _, f := range files {
		info, err := os.Stat(f)
		if err != nil {
			continue
		}
		infos = append(infos, fileInfo{path: f, time: info.ModTime()})
	}

	// 删除最旧的文件
	oldest := infos[:len(files)-w.maxBackups]
	for _, fi := range oldest {
		if time.Since(fi.time) > w.maxAge {
			os.Remove(fi.path)
		}
	}
}

type fileInfo struct {
	path string
	time time.Time
}

// Level 获取日志级别
func (w *FileWriter) Level() LogLevel {
	return w.level
}

// SetLevel 设置日志级别
func (w *FileWriter) SetLevel(level LogLevel) {
	w.level = level
}

// Close 关闭文件
func (w *FileWriter) Close() error {
	if w.file != nil {
		return w.file.Close()
	}
	return nil
}

// Name 获取名称
func (w *FileWriter) Name() string {
	return "file"
}

// MultiWriter 多写入器
type MultiWriter struct {
	writers []Writer
	mu      sync.Mutex
}

// NewMultiWriter 创建多写入器
func NewMultiWriter(writers ...Writer) *MultiWriter {
	return &MultiWriter{
		writers: writers,
	}
}

// AddWriter 添加写入器
func (m *MultiWriter) AddWriter(writer Writer) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.writers = append(m.writers, writer)
}

// RemoveWriter 移除写入器
func (m *MultiWriter) RemoveWriter(name string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	newWriters := make([]Writer, 0, len(m.writers))
	for _, w := range m.writers {
		if w.Name() != name {
			newWriters = append(newWriters, w)
		}
	}
	m.writers = newWriters
}

// Write 写入所有写入器
func (m *MultiWriter) Write(entry *Entry) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	var errs []error
	for _, w := range m.writers {
		if err := w.Write(entry); err != nil {
			errs = append(errs, err)
		}
	}

	if len(errs) > 0 {
		return fmt.Errorf("写入失败: %v", errs)
	}
	return nil
}

// Level 获取最低日志级别
func (m *MultiWriter) Level() LogLevel {
	minLevel := FATAL
	for _, w := range m.writers {
		if w.Level() < minLevel {
			minLevel = w.Level()
		}
	}
	return minLevel
}

// SetLevel 设置所有写入器级别
func (m *MultiWriter) SetLevel(level LogLevel) {
	m.mu.Lock()
	defer m.mu.Unlock()
	for _, w := range m.writers {
		w.SetLevel(level)
	}
}

// Close 关闭所有写入器
func (m *MultiWriter) Close() error {
	m.mu.Lock()
	defer m.mu.Unlock()

	var errs []error
	for _, w := range m.writers {
		if err := w.Close(); err != nil {
			errs = append(errs, err)
		}
	}

	if len(errs) > 0 {
		return fmt.Errorf("关闭失败: %v", errs)
	}
	return nil
}

// Name 获取名称
func (m *MultiWriter) Name() string {
	return "multi"
}

// ioWriter 适配器，将Entry转换为io.Writer
type ioWriter struct {
	w io.Writer
}

// Write 实现io.Writer接口
func (w *ioWriter) Write(p []byte) (int, error) {
	return w.w.Write(p)
}
