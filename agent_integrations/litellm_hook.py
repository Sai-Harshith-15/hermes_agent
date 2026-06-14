# LiteLLM Custom Logging Hook Integration
# Reports API usage, costs, latency, and rate-limiting failure events.

import os
import requests
import litellm
from litellm.integrations.custom_logger import CustomLogger

API_URL = os.environ.get("MONITOR_API_URL", "http://localhost:8000/api/v1")

class HermesMonitorLogger(CustomLogger):
    def log_pre_call_async(self, model, messages, kwargs, call_id):
        pass

    def log_post_call_async(self, response_obj, clean_stringify, model, messages, response_time, exception):
        pass

    def log_stream_event(self, kwargs, response_obj, start_time, end_time):
        pass

    def log_success_event(self, response_obj, start_time, end_time, args):
        """
        Triggered when an API request completes successfully.
        """
        try:
            # Extract billing metrics
            usage = response_obj.get("usage", {})
            prompt_tokens = usage.get("prompt_tokens", 0)
            completion_tokens = usage.get("completion_tokens", 0)
            total_tokens = usage.get("total_tokens", 0)
            
            # Estimate cost (LiteLLM usually attaches this under model_response._response_metadata or similar)
            cost = response_obj.get("_response_metadata", {}).get("response_cost", 0.0)
            
            # Latency
            latency = int((end_time - start_time).total_seconds() * 1000)
            
            # Match API key to our pool
            # LiteLLM passes key in args
            api_key = args.get("api_key", "unknown")
            masked_key = api_key[:7] + "..." + api_key[-4:] if len(api_key) > 10 else "sk-unknown"

            # Post key status
            key_data = {
                "provider": args.get("custom_llm_provider", "LiteLLM"),
                "model_name": model,
                "api_key_masked": masked_key,
                "rpm_limit": 60,
                "current_usage_pct": 10.0,
                "status": "Active"
            }
            
            key_res = requests.post(f"{API_URL}/telemetry/key", json=key_data, timeout=2)
            if key_res.status_code == 200:
                key_id = key_res.json().get("id")
                
                # Post usage log
                usage_data = {
                    "key_id": key_id,
                    "prompt_tokens": prompt_tokens,
                    "completion_tokens": completion_tokens,
                    "total_tokens": total_tokens,
                    "cost_usd": cost,
                    "latency_ms": latency,
                    "status_code": 200
                }
                requests.post(f"{API_URL}/telemetry/key-usage", json=usage_data, timeout=2)
        except Exception as e:
            print(f"Error sending telemetry to Hermes Dashboard: {e}")

    def log_failure_event(self, exception, start_time, end_time, args):
        """
        Triggered when an API request fails (e.g. Rate Limits - HTTP 429).
        """
        try:
            api_key = args.get("api_key", "unknown")
            masked_key = api_key[:7] + "..." + api_key[-4:] if len(api_key) > 10 else "sk-unknown"
            status_code = getattr(exception, "status_code", 500)
            status = "Active"
            
            if status_code == 429:
                status = "Rate-Limited"
            
            # Update key status to Rate Limited
            key_data = {
                "provider": args.get("custom_llm_provider", "LiteLLM"),
                "model_name": args.get("model", "unknown"),
                "api_key_masked": masked_key,
                "rpm_limit": 60,
                "current_usage_pct": 100.0,
                "status": status
            }
            
            key_res = requests.post(f"{API_URL}/telemetry/key", json=key_data, timeout=2)
            if key_res.status_code == 200:
                key_id = key_res.json().get("id")
                
                # Post fail usage log
                usage_data = {
                    "key_id": key_id,
                    "prompt_tokens": 0,
                    "completion_tokens": 0,
                    "total_tokens": 0,
                    "cost_usd": 0.0,
                    "latency_ms": 0,
                    "status_code": status_code
                }
                requests.post(f"{API_URL}/telemetry/key-usage", json=usage_data, timeout=2)
        except Exception as e:
            print(f"Error sending failure telemetry to Hermes Dashboard: {e}")

# Register custom logger with LiteLLM
hermes_logger = HermesMonitorLogger()
litellm.callbacks = [hermes_logger]
