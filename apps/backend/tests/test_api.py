#!/usr/bin/env python3

import json
import logging
import os
from dataclasses import dataclass
from typing import Any, Dict, Optional

import pytest
import requests
from requests import Response

# Get the directory where the test script is located
TEST_DIR = os.path.dirname(os.path.abspath(__file__))
LOGS_DIR = os.path.join(TEST_DIR, "logs")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(os.path.join(LOGS_DIR, 'test-api.log')),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

@dataclass
class APIConfig:
    """API configuration"""
    host: str = "localhost"
    port: int = 3001
    root: str = "/api"

    @property
    def base_url(self) -> str:
        """Get the base URL for API requests"""
        return f"http://{self.host}:{self.port}"

    def get_url(self, endpoint: str) -> str:
        """Get the full URL for an endpoint"""
        if endpoint == "/health":
            return f"{self.base_url}{endpoint}"
        return f"{self.base_url}{self.root}{endpoint}"

class APIClient:
    """API client for making requests"""
    def __init__(self, config: APIConfig):
        self.config = config
        self.session = requests.Session()

    def request(self, method: str, endpoint: str, **kwargs) -> Response:
        """Make an API request"""
        url = self.config.get_url(endpoint)
        logger.info(f"Making {method} request to {url}")
        response = self.session.request(method, url, **kwargs)
        logger.info(f"Response status: {response.status_code}")
        return response

    def get(self, endpoint: str, params: Optional[Dict[str, Any]] = None) -> Response:
        """Make a GET request"""
        return self.request("GET", endpoint, params=params)

@pytest.fixture
def api():
    """Fixture to provide API client"""
    return APIClient(APIConfig())

def test_health_check(api: APIClient):
    """Test health check endpoint"""
    response = api.get("/health")
    if response.status_code == 404:
        print('404 response:', response.text)
    assert response.status_code == 200
    assert response.text == "OK"

def test_get_all_spells(api: APIClient):
    """Test getting all spells"""
    response = api.get("/spells")
    if response.status_code == 404:
        print('404 response:', response.text)
    assert response.status_code == 200
    data = response.json()
    assert "page" in data
    assert "limit" in data
    assert "results" in data
    assert isinstance(data["results"], list)

def test_get_spell_by_id(api: APIClient):
    """Test getting a spell by ID"""
    response = api.get("/spells/1")
    if response.status_code == 404:
        print('404 response:', response.text)
    assert response.status_code == 200
    data = response.json()
    
    # Check that we have the expected top-level keys
    assert "0" in data  # The spell data is under key "0"
    assert "_debug" in data
    assert "class_levels" in data
    assert "components" in data
    
    # Get the spell data
    spell = data["0"]
    assert "cast_time" in spell
    assert "area_desc" in spell
    assert "desc" in spell
    assert "duration_desc" in spell
    assert "name" in spell
    assert "range_str" in spell
    assert "save_desc" in spell
    assert "sr_desc" in spell

def test_get_spells_with_filters(api: APIClient):
    """Test getting spells with filters"""
    params = {"class": "wizard", "level": "1"}
    response = api.get("/spells", params=params)
    if response.status_code == 404:
        print('404 response:', response.text)
    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    for spell in data["results"]:
        assert "base_level" in spell
        assert spell["base_level"] == 1

def test_get_spells_with_search(api: APIClient):
    """Test getting spells with search"""
    params = {"name": "fire"}
    response = api.get("/spells", params=params)
    if response.status_code == 404:
        print('404 response:', response.text)
    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    for spell in data["results"]:
        assert "fire" in spell["name"].lower() or "fire" in spell.get("summary", "").lower()

def test_get_spells_with_sorting(api: APIClient):
    """Test getting spells with sorting"""
    params = {"sort": "name", "order": "asc"}
    response = api.get("/spells", params=params)
    if response.status_code == 404:
        print('404 response:', response.text)
    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    names = [spell["name"] for spell in data["results"]]
    assert names == sorted(names)

def test_get_spells_with_pagination(api: APIClient):
    """Test getting spells with pagination"""
    params = {"page": 1, "limit": 10}
    response = api.get("/spells", params=params)
    if response.status_code == 404:
        print('404 response:', response.text)
    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    assert len(data["results"]) <= 10
    assert data["page"] == 1
    assert data["limit"] == 10

def test_lookups():
    # Test getting all lookups
    response = requests.get("http://localhost:3001/api/lookups")
    if response.status_code == 404:
        print('404 response:', response.text)
    assert response.status_code == 200
    data = response.json()

    # Define expected fields for each lookup type
    lookup_fields = {
        'classes': {
            'id_field': 'class_id',
            'name_field': 'class_name',
            'abbr_field': 'class_abbr'
        },
        'components': {
            'id_field': 'comp_id',
            'name_field': 'comp_name',
            'abbr_field': 'comp_abbrev'
        },
        'descriptors': {
            'id_field': 'desc_id',
            'name_field': 'descriptor'
        },
        'ranges': {
            'id_field': 'range_id',
            'name_field': 'range_name',
            'abbr_field': 'range_abbr'
        },
        'schools': {
            'id_field': 'school_id',
            'name_field': 'school_name'
        }
    }

    # Verify all expected lookup types are present
    for lookup_type in lookup_fields:
        assert lookup_type in data
        assert isinstance(data[lookup_type], list)
        assert len(data[lookup_type]) > 0

        # Get the first item to verify structure
        item = data[lookup_type][0]
        fields = lookup_fields[lookup_type]

        # Verify required fields
        assert fields['id_field'] in item
        assert fields['name_field'] in item

        # Verify ID is a number
        assert isinstance(item[fields['id_field']], int)
        # Verify name is a string
        assert isinstance(item[fields['name_field']], str)

        # Verify abbreviation field if it exists
        if 'abbr_field' in fields:
            assert fields['abbr_field'] in item
            assert isinstance(item[fields['abbr_field']], str)

if __name__ == "__main__":
    # Create logs directory if it doesn't exist
    os.makedirs(LOGS_DIR, exist_ok=True)
    pytest.main([__file__, "-v"]) 