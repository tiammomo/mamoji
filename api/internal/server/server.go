package server

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/cloudwego/hertz/pkg/app/server"
	"github.com/cloudwego/hertz/pkg/app/server/registry"
	"mamoji/api/internal/config"
	"mamoji/api/internal/handler"
	"mamoji/api/internal/middleware"
)

// Server Hertz服务器
type Server struct {
	cfg *config.Config
	h   *server.Hertz
}

// New 创建服务器
func New(cfg *config.Config) *Server {
	// 配置Hertz
	h := server.New(
		server.WithHostPorts(fmt.Sprintf("%s:%d", cfg.App.Host, cfg.App.Port)),
		server.WithReadTimeout(30*time.Second),
		server.WithWriteTimeout(30*time.Second),
		server.WithMaxRequestBodySize(10<<20), // 10MB
		server.WithExitWaitTime(5*time.Second),
	)

	// 注册中间件
	middleware.Register(h)

	// 注册路由
	handler.Register(h)

	return &Server{
		cfg: cfg,
		h:   h,
	}
}

// Start 启动服务器
func (s *Server) Start() error {
	// 优雅退出
	go func() {
		sigCh := make(chan os.Signal, 1)
		signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
		<-sigCh

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		s.h.Shutdown(ctx)
	}()

	log.Printf("Server starting on %s:%d", s.cfg.App.Host, s.cfg.App.Port)
	s.h.Spin()
	return nil
}

// Engine 获取Hertz引擎
func (s *Server) Engine() *server.Hertz {
	return s.h
}

// RegisterService 注册服务发现
func (s *Server) RegisterService(info registry.Info) {
	// 服务发现配置
	_ = info
}
