#!/bin/bash

# ===========================================
# Mamoji 项目自动化迭代脚本
# 基于 Claude Code AI 驱动
# ===========================================

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

PROJECT_ROOT="/home/ubuntu/deploy_projects/mamoji"
LOG_FILE="${PROJECT_ROOT}/迭代日志/iterate_$(date +%Y%m%d_%H%M%S).log"
CLAUDE_MODEL="${CLAUDE_MODEL:-MiniMax-M2.1}"

mkdir -p "${PROJECT_ROOT}/迭代日志"

log() {
    local timestamp=$(date '+%H:%M:%S')
    echo -e "$timestamp [${1}] $2" | tee -a "$LOG_FILE"
}
info() { log "INFO" "${BLUE}$1${NC}"; }
success() { log "OK" "${GREEN}$1${NC}"; }
warn() { log "WARN" "${YELLOW}$1${NC}"; }
error() { log "ERROR" "${RED}$1${NC}"; }
claude() { log "CLAUDE" "${CYAN}$1${NC}"; }

# ===========================================
# 调用 Claude Code 进行代码优化
# ===========================================
call_claude() {
    local prompt="$1"
    local output_file="$2"

    claude "正在分析代码..."

    # 调用 Claude CLI
    if claude --model "$CLAUDE_MODEL" --prompt "$prompt" > "$output_file" 2>&1; then
        success "Claude 分析完成"
        cat "$output_file" | head -50
        return 0
    else
        error "Claude 调用失败"
        return 1
    fi
}

# ===========================================
# 生成优化提示词
# ===========================================
generate_optimization_prompt() {
    cat << 'EOF'
你是 Mamoji 记账系统的 AI 助手。请分析当前项目代码并提供优化建议：

1. 检查代码异味和可优化点
2. 查找重复代码并建议重构
3. 识别可以应用设计模式的场景
4. 检查性能瓶颈
5. 提出具体改进方案

请输出 JSON 格式：
{
  "issues": ["问题1", "问题2", ...],
  "optimizations": [
    {
      "file": "文件路径",
      "description": "优化描述",
      "priority": "high/medium/low"
    }
  ],
  "refactor_candidates": ["可重构的代码片段"]
}

只输出 JSON，不要其他内容。
EOF
}

# ===========================================
# 执行 Claude 建议的优化
# ===========================================
apply_optimizations() {
    local analysis_file="$1"

    info "应用优化建议..."

    # 从分析中提取具体任务
    local tasks=$(grep -o '"file"' "$analysis_file" | wc -l)

    if [ "$tasks" -eq 0 ]; then
        success "无需优化，代码状态良好"
        return 0
    fi

    info "发现 $tasks 个优化点"

    # 让 Claude 执行优化
    local prompt=$(cat << EOF
基于以下分析结果，请执行代码优化：

$(cat "$analysis_file")

请直接修改相关文件完成优化。如果需要创建新文件，请输出文件路径和完整内容。

输出格式：
FILE: <文件路径>
CONTENT:
<文件完整内容>

END

如果无需修改文件，输出：NO_CHANGES_NEEDED
EOF
)

    local changes_file="${PROJECT_ROOT}/迭代日志/changes_$(date +%H%M%S).txt"
    call_claude "$prompt" "$changes_file"

    # 检查是否有更改
    if grep -q "NO_CHANGES_NEEDED" "$changes_file" 2>/dev/null; then
        success "Claude 认为无需更改"
        return 0
    fi

    # 应用更改
    local in_content=false
    local current_file=""

    while IFS= read -r line; do
        if [[ "$line" == "FILE: "* ]]; then
            current_file="${line#FILE: }"
            current_file="${current_file#$PROJECT_ROOT/}"
            in_content=true
            mkdir -p "$(dirname "${PROJECT_ROOT}/$current_file")"
            > "${PROJECT_ROOT}/$current_file"
        elif [[ "$line" == "END" ]]; then
            in_content=false
            success "已更新: $current_file"
        elif $in_content; then
            echo "$line" >> "${PROJECT_ROOT}/$current_file"
        fi
    done < "$changes_file"

    return 0
}

# ===========================================
# Docker 检查
# ===========================================
check_docker() {
    info "检查 Docker 服务..."

    cd "${PROJECT_ROOT}"

    if docker ps --format '{{.Names}}' | grep -q "mysql"; then
        success "MySQL 运行中"
    else
        warn "MySQL 未运行"
        docker-compose up -d mysql 2>/dev/null || true
    fi

    if docker ps --format '{{.Names}}' | grep -q "redis"; then
        success "Redis 运行中"
    else
        warn "Redis 未运行"
        docker-compose up -d redis 2>/dev/null || true
    fi
}

# ===========================================
# 后端测试
# ===========================================
test_backend() {
    info "后端测试..."

    cd "${PROJECT_ROOT}/api"

    if mvn test -Dtest='!*PerformanceTest,!*IntegrationTest,!*EndToEndFlowTest' -q 2>&1 | tail -20; then
        success "后端测试通过"
        return 0
    else
        error "后端测试失败"
        return 1
    fi
}

# ===========================================
# 前端测试
# ===========================================
test_frontend() {
    info "前端测试..."

    cd "${PROJECT_ROOT}/web"

    if npm test 2>&1 | tail -10; then
        success "前端测试通过"
        return 0
    else
        error "前端测试失败"
        return 1
    fi
}

# ===========================================
# 类型检查
# ===========================================
type_check() {
    info "类型检查..."

    cd "${PROJECT_ROOT}/web"

    if npm run type-check 2>&1 | tail -5; then
        success "类型检查通过"
        return 0
    else
        error "类型检查失败"
        return 1
    fi
}

# ===========================================
# 后端编译
# ===========================================
compile_backend() {
    info "后端编译..."

    cd "${PROJECT_ROOT}/api"

    if mvn compile -q 2>&1; then
        success "后端编译通过"
        return 0
    else
        error "后端编译失败"
        return 1
    fi
}

# ===========================================
# 完整测试验证
# ===========================================
run_tests() {
    local all_passed=true

    compile_backend || all_passed=false
    test_backend || all_passed=false
    test_frontend || all_passed=false
    type_check || all_passed=false

    if $all_passed; then
        return 0
    else
        return 1
    fi
}

# ===========================================
# Git 提交
# ===========================================
git_commit() {
    cd "${PROJECT_ROOT}"

    git add -A

    if git diff --cached --stat --name-only | grep -q .; then
        local message="AI 迭代优化 [$(date '+%H:%M')]"
        if git commit -m "$message" 2>&1; then
            success "已提交: $message"
            return 0
        fi
    fi
    return 1
}

# ===========================================
# 单次迭代
# ===========================================
single_iteration() {
    info "=========================================="
    info "开始单次迭代 (Claude AI 驱动)"
    info "=========================================="

    check_docker

    # 1. Claude 分析代码
    local analysis_file="${PROJECT_ROOT}/迭代日志/analysis_$(date +%H%M%S).txt"
    generate_optimization_prompt | call_claude "分析项目代码并提供优化建议" "$analysis_file"

    # 2. 应用优化
    apply_optimizations "$analysis_file"

    # 3. 运行测试
    if run_tests; then
        success "所有测试通过"
        git_commit
        return 0
    else
        error "测试失败，回滚更改"
        git checkout -- .
        return 1
    fi
}

# ===========================================
# 交互式持续迭代
# ===========================================
interactive_mode() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║    Mamoji AI 驱动持续迭代系统              ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
    echo ""
    echo "  模型: $CLAUDE_MODEL"
    echo ""
    echo -e "  ${GREEN}1${NC}. 开始持续迭代 (手动结束)"
    echo -e "  ${GREEN}2${NC}. 单次迭代 (自动结束)"
    echo -e "  ${GREEN}3${NC}. 仅运行测试"
    echo -e "  ${GREEN}4${NC}. 退出"
    echo ""

    read -p "请选择 [1-4]: " choice
    choice=${choice:-1}

    case $choice in
        1) continuous_mode ;;
        2) single_iteration ;;
        3) run_tests ;;
        4) exit 0 ;;
        *) exit 1 ;;
    esac
}

# ===========================================
# 持续迭代
# ===========================================
continuous_mode() {
    echo ""
    echo -e "${YELLOW}开始持续迭代...${NC}"
    echo "按 ${RED}q${NC} 随时退出"
    echo ""

    local count=0
    local running=true

    trap 'running=false; echo -e "\n${YELLOW}停止迭代${NC}"; exit 0' INT

    while $running; do
        echo ""
        echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
        info "第 $((count + 1)) 次迭代"
        echo -e "${BLUE}═══════════════════════════════════════════════${NC}"

        if single_iteration; then
            ((count++))
            success "已完成 $count 次迭代"
        else
            warn "迭代失败，继续下一次..."
        fi

        echo ""
        echo -e "等待 30 秒... (按 q 停止)"
        for i in $(seq 1 30); do
            read -t 1 -n 1 key 2>/dev/null || true
            if [[ "$key" == "q" || "$key" == "Q" ]]; then
                running=false
                echo ""
                warn "用户停止"
                break
            fi
        done
    done

    trap - INT
    success "共完成 $count 次迭代"
}

# ===========================================
# 主程序
# ===========================================
main() {
    local mode=${1:-"interactive"}

    echo "=========================================="
    echo "Mamoji AI 迭代系统"
    echo "模型: $CLAUDE_MODEL"
    echo "=========================================="

    case $mode in
        single|s)
            single_iteration
            ;;
        continuous|c)
            continuous_mode
            ;;
        test|t)
            check_docker
            run_tests
            ;;
        interactive|i)
            interactive_mode
            ;;
        help|--help|-h)
            echo "用法: $0 [模式]"
            echo ""
            echo "模式:"
            echo "  single (s)    - 单次迭代 (默认)"
            echo "  continuous (c) - 持续迭代，手动控制"
            echo "  test (t)       - 仅运行测试"
            echo "  interactive (i) - 交互式菜单"
            echo ""
            echo "示例:"
            echo "  ./iterate.sh           # 交互式"
            echo "  ./iterate.sh single    # 单次迭代"
            echo "  ./iterate.sh continuous # 持续迭代"
            echo "  ./iterate.sh test      # 仅测试"
            exit 0
            ;;
        *)
            error "未知模式: $mode"
            exit 1
            ;;
    esac
}

main "$@"
