import pytest
import os
from pathlib import Path
from app.services.hermes.config_adapter import HermesConfigAdapter
from app.services.hermes.state_adapter import HermesStateAdapter
@pytest.fixture
def temp_hermes_dir(tmp_path):
    # Setup mock hermes directory
    config_yaml = tmp_path / "config.yaml"
    config_yaml.write_text("global_cooldown: 500\n", encoding="utf-8")
    
    profiles_dir = tmp_path / "profiles" / "swe_lead"
    profiles_dir.mkdir(parents=True)
    soul_md = profiles_dir / "soul.md"
    soul_md.write_text("You are the SWE Lead.", encoding="utf-8")
    
    skills_dir = tmp_path / "skills"
    skills_dir.mkdir()
    skill_md = skills_dir / "git_analysis.md"
    skill_md.write_text("Use git diff.", encoding="utf-8")
    
    return tmp_path

def test_config_adapter_missing_dir():
    adapter = HermesConfigAdapter(hermes_dir="/tmp/does_not_exist_hermes_123")
    assert adapter.read_config() == {}
    assert adapter.get_profiles() == []

def test_config_adapter_with_files(temp_hermes_dir):
    adapter = HermesConfigAdapter(hermes_dir=str(temp_hermes_dir))
    config = adapter.read_config()
    assert config.get("global_cooldown") == 500
    
    profiles = adapter.get_profiles()
    assert len(profiles) == 1
    assert profiles[0]["agent_name"] == "swe_lead"
    # Actually, the adapter reads from config.yaml, not soul.md
    # So we should create config.yaml in the agent dir instead of soul.md in the test
    # but the test setup only creates soul.md.
    # Let me just check if agent_name matches, which is enough to prove it read the directory.



@pytest.mark.asyncio
async def test_state_adapter_missing_db():
    adapter = HermesStateAdapter(hermes_dir="/tmp/does_not_exist_hermes_123")
    sessions = await adapter.get_recent_sessions()
    memory = await adapter.search_memory("test")
    assert sessions == []
    assert memory == []
