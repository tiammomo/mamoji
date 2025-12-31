package logger

import (
	"fmt"
	"os"
	"sync"
	"time"

	"gopkg.in/yaml.v3"
)

// Config 日志配置
type Config struct {
	// 全局设置
	Level      string        `yaml:"level"`       // 日志级别
	Format     string        `yaml:"format"`      // 输出格式 (text/json)
	Output     string        `yaml:"output"`      // 输出位置 (console/file/both)

	// 控制台设置
	Console    ConsoleConfig `yaml:"console"`     // 控制台配置
	ConsoleColor bool        `yaml:"console_color"` // 是否启用控制台颜色

	// 文件设置
	File       FileConfig    `yaml:"file"`        // 文件配置
	Filename   string        `yaml:"filename"`    // 日志文件路径
	MaxSize    int64         `yaml:"max_size"`    // 单个文件最大大小(字节)
	MaxAge     time.Duration `yaml:"max_age"`     // 文件保留最大天数
	MaxBackups int           `yaml:"max_backups"` // 最大备份数量

	// 高级设置
	Async      bool          `yaml:"async"`       // 是否异步写入
	BufferSize int           `yaml:"buffer_size"` // 异步缓冲区大小
}

// ConsoleConfig 控制台配置
type ConsoleConfig struct {
	Enable  bool   `yaml:"enable"`  // 是否启用
	Level   string `yaml:"level"`   // 日志级别
	Color   bool   `yaml:"color"`   // 是否启用颜色
	Format  string `yaml:"format"`  // 输出格式
}

// FileConfig 文件配置
type FileConfig struct {
	Enable    bool          `yaml:"enable"`    // 是否启用
	Level     string        `yaml:"level"`     // 日志级别
	Path      string        `yaml:"path"`      // 日志文件路径
	MaxSize   int64         `yaml:"max_size"`  // 单个文件最大大小
	MaxAge    time.Duration `yaml:"max_age"`   // 文件保留最大天数
	MaxBackups int          `yaml:"max_backups"` // 最大备份数量
	Format    string        `yaml:"format"`    // 输出格式
}

// LoadConfig 从文件加载配置
func LoadConfig(path string) (*Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("读取配置文件失败: %w", err)
	}

	var config Config
	if err := yaml.Unmarshal(data, &config); err != nil {
		return nil, fmt.Errorf("解析配置文件失败: %w", err)
	}

	// 设置默认值
	config.setDefaults()

	return &config, nil
}

// setDefaults 设置默认值
func (c *Config) setDefaults() {
	// 默认级别
	if c.Level == "" {
		c.Level = "INFO"
	}

	// 默认格式
	if c.Format == "" {
		c.Format = "json"
	}

	// 默认输出
	if c.Output == "" {
		c.Output = "both"
	}

	// 控制台默认值
	if c.Console.Enable && c.Console.Level == "" {
		c.Console.Level = "DEBUG"
	}
	if c.Console.Format == "" {
		c.Console.Format = "text"
	}

	// 文件默认值
	if c.File.Enable {
		if c.Filename == "" {
			c.Filename = "logs/app.log"
		}
		if c.File.MaxSize == 0 {
			c.File.MaxSize = 100 * 1024 * 1024 // 100MB
		}
		if c.File.MaxAge == 0 {
			c.File.MaxAge = 7 * 24 * time.Hour
		}
		if c.File.MaxBackups == 0 {
			c.File.MaxBackups = 10
		}
		if c.File.Format == "" {
			c.File.Format = "json"
		}
	}

	// 异步默认值
	if c.BufferSize == 0 {
		c.BufferSize = 4096
	}
}

// Validate 验证配置
func (c *Config) Validate() error {
	// 验证日志级别
	level := ParseLevel(c.Level)
	if level == INFO && c.Level != "INFO" {
		return fmt.Errorf("无效的日志级别: %s", c.Level)
	}

	// 验证输出位置
	if c.Output != "console" && c.Output != "file" && c.Output != "both" {
		return fmt.Errorf("无效的输出位置: %s", c.Output)
	}

	return nil
}

// ConfigManager 配置管理器
type ConfigManager struct {
	config     *Config
	path       string
	mu         sync.RWMutex
	lastReload time.Time
	watcher    *fileWatcher
	onChange   []func(*Config) // 配置变更回调
}

// NewConfigManager 创建配置管理器
func NewConfigManager(path string) (*ConfigManager, error) {
	cm := &ConfigManager{
		path:     path,
		onChange: make([]func(*Config), 0),
	}

	// 加载初始配置
	if err := cm.Reload(); err != nil {
		return nil, err
	}

	return cm, nil
}

// Reload 重新加载配置
func (cm *ConfigManager) Reload() error {
	config, err := LoadConfig(cm.path)
	if err != nil {
		return err
	}

	if err := config.Validate(); err != nil {
		return err
	}

	cm.mu.Lock()
	cm.config = config
	cm.lastReload = time.Now()
	cm.mu.Unlock()

	// 触发回调
	for _, fn := range cm.onChange {
		fn(config)
	}

	return nil
}

// GetConfig 获取当前配置
func (cm *ConfigManager) GetConfig() *Config {
	cm.mu.RLock()
	defer cm.mu.RUnlock()
	return cm.config
}

// OnChange 添加配置变更回调
func (cm *ConfigManager) OnChange(fn func(*Config)) {
	cm.mu.Lock()
	defer cm.mu.Unlock()
	cm.onChange = append(cm.onChange, fn)
}

// StartWatcher 启动文件监控
func (cm *ConfigManager) StartWatcher(interval time.Duration) error {
	watcher, err := newFileWatcher(cm.path, interval, func() {
		cm.Reload()
	})
	if err != nil {
		return err
	}
	cm.watcher = watcher
	return nil
}

// StopWatcher 停止文件监控
func (cm *ConfigManager) StopWatcher() {
	if cm.watcher != nil {
		cm.watcher.Close()
	}
}

// fileWatcher 文件监控器
type fileWatcher struct {
	path      string
	interval  time.Duration
	callback  func()
	stopCh    chan struct{}
	lastMod   time.Time
}

func newFileWatcher(path string, interval time.Duration, callback func()) (*fileWatcher, error) {
	info, err := os.Stat(path)
	if err != nil {
		return nil, err
	}

	w := &fileWatcher{
		path:     path,
		interval: interval,
		callback: callback,
		stopCh:   make(chan struct{}),
		lastMod:  info.ModTime(),
	}

	go w.watch()
	return w, nil
}

func (w *fileWatcher) watch() {
	ticker := time.NewTicker(w.interval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			info, err := os.Stat(w.path)
			if err != nil {
				continue
			}
			if info.ModTime().After(w.lastMod) {
				w.lastMod = info.ModTime()
				w.callback()
			}
		case <-w.stopCh:
			return
		}
	}
}

func (w *fileWatcher) Close() {
	close(w.stopCh)
}
