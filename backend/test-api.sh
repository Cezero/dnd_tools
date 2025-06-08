#!/usr/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Base URL
BASE_URL="http://localhost:3001"

# Function to test an endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local expected_status=$3
    local description=$4
    local data=$5

    echo -e "\nTesting: $description" | tee -a test-output.log
    echo "Endpoint: $endpoint" | tee -a test-output.log
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" -H "Content-Type: application/json" -d "$data" "$BASE_URL$endpoint")
    fi
    
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ Status code $status_code (expected $expected_status)${NC}" | tee -a test-output.log
        echo "Response:" | tee -a test-output.log
        echo "$body" | jq '.' 2>/dev/null || echo "$body" | tee -a test-output.log
    else
        echo -e "${RED}✗ Status code $status_code (expected $expected_status)${NC}" | tee -a test-output.log
        echo "Response:" | tee -a test-output.log
        echo "$body" | jq '.' 2>/dev/null || echo "$body" | tee -a test-output.log
    fi
}

echo "Starting API tests..." | tee -a test-output.log
echo "=====================" | tee -a test-output.log

# Test health endpoint
test_endpoint "GET" "/health" "200" "Health check endpoint"

# Test spells endpoint with various filters
test_endpoint "GET" "/api/spells" "200" "Get all spells"
test_endpoint "GET" "/api/spells?name_filter=fireball" "200" "Get spells filtered by name"
test_endpoint "GET" "/api/spells?class_filter=wizard&level_filter=3" "200" "Get spells filtered by class and level"
test_endpoint "GET" "/api/spells?school_filter=evocation" "200" "Get spells filtered by school"
test_endpoint "GET" "/api/spells?descriptor_filter=fire" "200" "Get spells filtered by descriptor"

# Test pagination and sorting
test_endpoint "GET" "/api/spells?page=1&limit=5" "200" "Get paginated spells"
test_endpoint "GET" "/api/spells?sort=name&order=desc" "200" "Get spells sorted by name descending"

# Test individual spell endpoint
test_endpoint "GET" "/api/spells/1" "200" "Get individual spell by ID"

echo -e "\nAPI tests completed!" | tee -a test-output.log 