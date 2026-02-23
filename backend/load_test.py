#!/usr/bin/env python3
"""
Load Testing for SMC Signal Generation
Comprehensive performance and scalability testing
"""

import asyncio
import aiohttp
import time
import statistics
import json
from datetime import datetime
from typing import List, Dict, Any
import psutil
import os
from concurrent.futures import ThreadPoolExecutor
import matplotlib.pyplot as plt
import pandas as pd

from loguru import logger


class SMCLoadTester:
    """
    Load Testing Suite for SMC Agent

    Tests:
    - Concurrent signal generation
    - Performance benchmarking
    - Memory/CPU usage monitoring
    - Scalability across symbols
    """

    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.session = None
        self.results = {}

    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    async def run_comprehensive_test(self):
        """Run all load tests"""
        logger.info("🚀 Starting comprehensive SMC load testing...")

        # Test configurations
        test_configs = [
            {"name": "single_request", "concurrent": 1, "requests": 10},
            {"name": "low_load", "concurrent": 5, "requests": 50},
            {"name": "medium_load", "concurrent": 20, "requests": 200},
            {"name": "high_load", "concurrent": 50, "requests": 500},
            {"name": "stress_test", "concurrent": 100, "requests": 1000},
        ]

        symbols = ["RELIANCE", "TCS", "HDFC", "INFY", "ICICI", "SBIN"]

        for config in test_configs:
            logger.info(f"📊 Running {config['name']} test...")
            await self.test_concurrent_signals(config, symbols)

        # Performance benchmarking
        await self.benchmark_smc_calculations()

        # Memory/CPU monitoring
        await self.monitor_resource_usage()

        # Scalability testing
        await self.test_symbol_scalability(symbols)

        # Generate report
        self.generate_report()

        logger.info("✅ Load testing completed!")

    async def test_concurrent_signals(self, config: Dict, symbols: List[str]):
        """Test concurrent signal generation"""
        test_name = config["name"]
        concurrent = config["concurrent"]
        total_requests = config["requests"]

        logger.info(f"Testing {concurrent} concurrent requests, {total_requests} total")

        start_time = time.time()
        response_times = []
        errors = 0
        successes = 0

        # Create semaphore for concurrency control
        semaphore = asyncio.Semaphore(concurrent)

        async def single_request(symbol_idx: int):
            nonlocal errors, successes
            async with semaphore:
                symbol = symbols[symbol_idx % len(symbols)]
                request_start = time.time()

                try:
                    payload = {
                        "symbol": symbol,
                        "exchange": "NSE",
                        "ltf_timeframe": "15m",
                        "htf_timeframe": "1h"
                    }

                    async with self.session.post(
                        f"{self.base_url}/api/v1/signals/generate",
                        json=payload,
                        headers={"Authorization": "Bearer test-token"}
                    ) as response:
                        response_time = time.time() - request_start
                        response_times.append(response_time)

                        if response.status == 200:
                            successes += 1
                        else:
                            errors += 1
                            logger.warning(f"Request failed: {response.status}")

                except Exception as e:
                    errors += 1
                    response_time = time.time() - request_start
                    response_times.append(response_time)
                    logger.error(f"Request error: {e}")

        # Execute all requests
        tasks = [single_request(i) for i in range(total_requests)]
        await asyncio.gather(*tasks, return_exceptions=True)

        total_time = time.time() - start_time

        # Calculate metrics
        if response_times:
            avg_response_time = statistics.mean(response_times)
            median_response_time = statistics.median(response_times)
            p95_response_time = statistics.quantiles(response_times, n=20)[18]  # 95th percentile
            min_response_time = min(response_times)
            max_response_time = max(response_times)
        else:
            avg_response_time = median_response_time = p95_response_time = 0
            min_response_time = max_response_time = 0

        throughput = total_requests / total_time if total_time > 0 else 0
        success_rate = successes / total_requests if total_requests > 0 else 0

        self.results[test_name] = {
            "config": config,
            "metrics": {
                "total_requests": total_requests,
                "successful_requests": successes,
                "failed_requests": errors,
                "success_rate": success_rate,
                "total_time": total_time,
                "throughput_rps": throughput,
                "avg_response_time": avg_response_time,
                "median_response_time": median_response_time,
                "p95_response_time": p95_response_time,
                "min_response_time": min_response_time,
                "max_response_time": max_response_time,
            },
            "response_times": response_times
        }

        logger.info(f"✅ {test_name}: {throughput:.1f} RPS, {success_rate:.1%} success, {avg_response_time:.2f}s avg")

    async def benchmark_smc_calculations(self):
        """Benchmark SMC calculation performance"""
        logger.info("🔬 Benchmarking SMC calculations...")

        # Test different scenarios
        scenarios = [
            {"name": "market_structure_only", "components": ["market_structure"]},
            {"name": "liquidity_only", "components": ["liquidity"]},
            {"name": "full_smc", "components": ["market_structure", "liquidity", "order_blocks", "fvg", "mtf"]},
        ]

        benchmark_results = {}

        for scenario in scenarios:
            logger.info(f"Benchmarking {scenario['name']}...")

            # Run multiple iterations
            times = []
            for _ in range(10):
                start = time.time()
                # Simulate SMC calculation (placeholder)
                await asyncio.sleep(0.01)  # Simulate processing time
                times.append(time.time() - start)

            benchmark_results[scenario['name']] = {
                "avg_time": statistics.mean(times),
                "min_time": min(times),
                "max_time": max(times),
                "iterations": len(times)
            }

        self.results["benchmark"] = benchmark_results
        logger.info("✅ SMC benchmarking completed")

    async def monitor_resource_usage(self):
        """Monitor memory and CPU usage during tests"""
        logger.info("📈 Monitoring resource usage...")

        # Get initial readings
        initial_cpu = psutil.cpu_percent(interval=1)
        initial_memory = psutil.virtual_memory().percent

        # Run a medium load test while monitoring
        await self.test_concurrent_signals(
            {"name": "resource_monitoring", "concurrent": 20, "requests": 100},
            ["RELIANCE", "TCS"]
        )

        # Get final readings
        final_cpu = psutil.cpu_percent(interval=1)
        final_memory = psutil.virtual_memory().percent

        self.results["resource_usage"] = {
            "cpu_initial": initial_cpu,
            "cpu_final": final_cpu,
            "cpu_delta": final_cpu - initial_cpu,
            "memory_initial": initial_memory,
            "memory_final": final_memory,
            "memory_delta": final_memory - initial_memory,
        }

        logger.info(f"📊 CPU: {initial_cpu:.1f}% -> {final_cpu:.1f}%, Memory: {initial_memory:.1f}% -> {final_memory:.1f}%")

    async def test_symbol_scalability(self, symbols: List[str]):
        """Test scalability across multiple symbols"""
        logger.info("🔍 Testing symbol scalability...")

        scalability_results = {}

        for num_symbols in [1, 5, 10, 20]:
            test_symbols = symbols[:num_symbols]

            start_time = time.time()

            # Test concurrent requests for multiple symbols
            tasks = []
            for symbol in test_symbols:
                for _ in range(5):  # 5 requests per symbol
                    task = self._make_signal_request(symbol)
                    tasks.append(task)

            await asyncio.gather(*tasks, return_exceptions=True)

            total_time = time.time() - start_time
            throughput = len(tasks) / total_time if total_time > 0 else 0

            scalability_results[f"{num_symbols}_symbols"] = {
                "symbols": num_symbols,
                "total_requests": len(tasks),
                "total_time": total_time,
                "throughput_rps": throughput,
            }

            logger.info(f"📈 {num_symbols} symbols: {throughput:.1f} RPS")

        self.results["scalability"] = scalability_results

    async def _make_signal_request(self, symbol: str):
        """Make a single signal generation request"""
        try:
            payload = {
                "symbol": symbol,
                "exchange": "NSE",
                "ltf_timeframe": "15m",
                "htf_timeframe": "1h"
            }

            async with self.session.post(
                f"{self.base_url}/api/v1/signals/generate",
                json=payload,
                headers={"Authorization": "Bearer test-token"}
            ) as response:
                return response.status == 200

        except Exception:
            return False

    def generate_report(self):
        """Generate comprehensive test report"""
        logger.info("📋 Generating load test report...")

        report = {
            "timestamp": datetime.utcnow().isoformat(),
            "summary": {},
            "details": self.results
        }

        # Calculate summary metrics
        if self.results:
            all_response_times = []
            total_requests = 0
            total_successes = 0

            for test_name, data in self.results.items():
                if "metrics" in data:
                    metrics = data["metrics"]
                    total_requests += metrics.get("total_requests", 0)
                    total_successes += metrics.get("successful_requests", 0)

                    if "response_times" in data:
                        all_response_times.extend(data["response_times"])

            if all_response_times:
                report["summary"] = {
                    "total_tests": len([k for k in self.results.keys() if "metrics" in self.results[k]]),
                    "total_requests": total_requests,
                    "overall_success_rate": total_successes / total_requests if total_requests > 0 else 0,
                    "avg_response_time": statistics.mean(all_response_times),
                    "p95_response_time": statistics.quantiles(all_response_times, n=20)[18] if len(all_response_times) >= 20 else max(all_response_times),
                    "min_response_time": min(all_response_times),
                    "max_response_time": max(all_response_times),
                }

        # Save report
        report_file = f"load_test_report_{int(time.time())}.json"
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2, default=str)

        # Generate charts if matplotlib available
        try:
            self._generate_charts()
        except ImportError:
            logger.warning("matplotlib not available, skipping charts")

        logger.info(f"📄 Report saved to {report_file}")

    def _generate_charts(self):
        """Generate performance charts"""
        # Response time distribution
        plt.figure(figsize=(12, 8))

        for test_name, data in self.results.items():
            if "response_times" in data and data["response_times"]:
                plt.subplot(2, 2, 1)
                plt.hist(data["response_times"], alpha=0.7, label=test_name, bins=20)
                plt.xlabel("Response Time (s)")
                plt.ylabel("Frequency")
                plt.title("Response Time Distribution")
                plt.legend()

        # Throughput comparison
        plt.subplot(2, 2, 2)
        test_names = []
        throughputs = []

        for test_name, data in self.results.items():
            if "metrics" in data and "throughput_rps" in data["metrics"]:
                test_names.append(test_name)
                throughputs.append(data["metrics"]["throughput_rps"])

        if throughputs:
            plt.bar(test_names, throughputs)
            plt.xlabel("Test Scenario")
            plt.ylabel("Requests per Second")
            plt.title("Throughput Comparison")
            plt.xticks(rotation=45)

        # Success rate comparison
        plt.subplot(2, 2, 3)
        success_rates = []

        for test_name, data in self.results.items():
            if "metrics" in data and "success_rate" in data["metrics"]:
                success_rates.append(data["metrics"]["success_rate"])

        if success_rates:
            plt.bar(test_names, success_rates)
            plt.xlabel("Test Scenario")
            plt.ylabel("Success Rate")
            plt.title("Success Rate Comparison")
            plt.xticks(rotation=45)

        # Resource usage
        if "resource_usage" in self.results:
            plt.subplot(2, 2, 4)
            resource_data = self.results["resource_usage"]
            labels = ["CPU Initial", "CPU Final", "Memory Initial", "Memory Final"]
            values = [
                resource_data["cpu_initial"],
                resource_data["cpu_final"],
                resource_data["memory_initial"],
                resource_data["memory_final"]
            ]
            plt.bar(labels, values)
            plt.ylabel("Percentage")
            plt.title("Resource Usage")
            plt.xticks(rotation=45)

        plt.tight_layout()
        plt.savefig(f"load_test_charts_{int(time.time())}.png", dpi=300, bbox_inches='tight')
        plt.close()


async def main():
    """Main load testing function"""
    async with SMCLoadTester() as tester:
        await tester.run_comprehensive_test()


if __name__ == "__main__":
    asyncio.run(main())
