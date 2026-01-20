#!/bin/bash
# Performance Test Runner Script
# Run: bash scripts/run_performance_tests.sh

set -e

echo "=========================================="
echo "Mamoji Performance Test Suite"
echo "=========================================="

# Navigate to API directory
cd /home/ubuntu/deploy_projects/mamoji/api

# Set environment
source /home/ubuntu/deploy_projects/mamoji/scripts/setup_env.sh

echo ""
echo "1. Running Cache Performance Tests..."
echo "----------------------------------------"
mvn test -Dtest=CachePerformanceTest -q 2>&1 | grep -E "(Tests run|Performance|took|SUCCESS|FAILURE)" || true

echo ""
echo "2. Running Connection Pool Stress Tests..."
echo "----------------------------------------"
mvn test -Dtest=ConnectionPoolStressTest -q 2>&1 | grep -E "(Tests run|Performance|took|SUCCESS|FAILURE)" || true

echo ""
echo "3. Running JMH Benchmarks (BudgetService)..."
echo "----------------------------------------"
mvn test -Dtest=BudgetBenchmark -q 2>&1 | grep -E "(Benchmark|Operations|average|SUCCESS|FAILURE)" || true

echo ""
echo "=========================================="
echo "Performance Tests Completed"
echo "=========================================="
echo ""
echo "Results:"
echo "- Check target/surefire-reports/ for detailed test reports"
echo "- JMH benchmark results saved to target/benchmark-results.json"
echo ""
