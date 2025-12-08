#!/bin/bash

# Comprehensive Test Script for Task-Flow App
# Tests deployment, database connection, and all API endpoints

# Don't exit on error - we handle failures manually
set +e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_URL="${1:-https://productivity-puce.vercel.app/}"
TIMEOUT=10
VERBOSE="${2:-false}"

# Check for jq (optional but recommended)
if command -v jq &> /dev/null; then
    HAS_JQ=true
else
    HAS_JQ=false
    echo -e "${YELLOW}Warning: jq not found. JSON validation will be limited.${NC}"
    echo "Install jq for better JSON validation: brew install jq (macOS) or apt-get install jq (Linux)"
    echo ""
fi

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# Helper functions
print_test() {
    echo -e "${BLUE}▶ $1${NC}"
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
}

print_pass() {
    echo -e "${GREEN}✓ PASS: $1${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
}

print_fail() {
    echo -e "${RED}✗ FAIL: $1${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    if [ "$VERBOSE" = "true" ]; then
        echo -e "${YELLOW}  Details: $2${NC}"
    fi
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Test function that checks HTTP status and optionally JSON structure
test_endpoint() {
    local method=$1
    local endpoint=$2
    local expected_status=$3
    local data=$4
    local description=$5
    local validate_json=$6
    
    print_test "$description"
    
    local response
    local status_code
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" --max-time $TIMEOUT "$APP_URL$endpoint" 2>&1)
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" --max-time $TIMEOUT \
            -X POST \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$APP_URL$endpoint" 2>&1)
    elif [ "$method" = "PATCH" ]; then
        response=$(curl -s -w "\n%{http_code}" --max-time $TIMEOUT \
            -X PATCH \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$APP_URL$endpoint" 2>&1)
    elif [ "$method" = "DELETE" ]; then
        response=$(curl -s -w "\n%{http_code}" --max-time $TIMEOUT \
            -X DELETE \
            "$APP_URL$endpoint" 2>&1)
    elif [ "$method" = "OPTIONS" ]; then
        response=$(curl -s -w "\n%{http_code}" --max-time $TIMEOUT \
            -X OPTIONS \
            -H "Origin: $APP_URL" \
            "$APP_URL$endpoint" 2>&1)
    fi
    
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$status_code" = "$expected_status" ]; then
        if [ "$validate_json" = "true" ]; then
            # Check if response is valid JSON
            if [ "$HAS_JQ" = "true" ]; then
                if echo "$body" | jq . >/dev/null 2>&1; then
                    print_pass "$description (Status: $status_code, Valid JSON)"
                    echo "$body"  # Return body for further processing
                    return 0
                else
                    print_fail "$description" "Expected valid JSON but got: $body"
                    return 1
                fi
            else
                # Basic JSON check without jq (check if starts with { or [)
                if echo "$body" | grep -qE '^[{\[]'; then
                    print_pass "$description (Status: $status_code, Appears to be JSON)"
                    echo "$body"  # Return body for further processing
                    return 0
                else
                    print_fail "$description" "Expected JSON but got: $body"
                    return 1
                fi
            fi
        else
            print_pass "$description (Status: $status_code)"
            echo "$body"  # Return body for further processing
            return 0
        fi
    else
        print_fail "$description" "Expected status $expected_status but got $status_code. Response: $body"
        return 1
    fi
}

# Test CORS headers
test_cors() {
    print_test "Testing CORS headers"
    
    local headers=$(curl -s -I --max-time $TIMEOUT \
        -H "Origin: $APP_URL" \
        "$APP_URL/api/categories" 2>&1)
    
    if echo "$headers" | grep -qi "access-control-allow-origin"; then
        print_pass "CORS headers present"
    else
        print_fail "CORS headers" "Missing Access-Control-Allow-Origin header"
    fi
}

# Test OPTIONS request
test_options() {
    print_test "Testing OPTIONS request (CORS preflight)"
    
    local response=$(curl -s -w "\n%{http_code}" --max-time $TIMEOUT \
        -X OPTIONS \
        -H "Origin: $APP_URL" \
        -H "Access-Control-Request-Method: POST" \
        "$APP_URL/api/categories" 2>&1)
    
    local status_code=$(echo "$response" | tail -n1)
    
    if [ "$status_code" = "200" ] || [ "$status_code" = "204" ]; then
        print_pass "OPTIONS request (Status: $status_code)"
    else
        print_fail "OPTIONS request" "Expected 200/204 but got $status_code"
    fi
}

echo "=========================================="
echo "Task-Flow Comprehensive Test Suite"
echo "=========================================="
echo "Testing: $APP_URL"
echo "Timeout: ${TIMEOUT}s"
echo ""

# ============================================
# 1. DEPLOYMENT & HEALTH CHECKS
# ============================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}1. DEPLOYMENT & HEALTH CHECKS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Test if app is reachable
print_test "Testing app reachability"
if curl -s --max-time $TIMEOUT "$APP_URL" >/dev/null 2>&1; then
    print_pass "App is reachable"
else
    print_fail "App reachability" "Cannot connect to $APP_URL"
    echo ""
    echo "Tests cannot continue. Please check:"
    echo "1. App is deployed on Vercel"
    echo "2. URL is correct: $APP_URL"
    echo "3. Network connectivity"
    exit 1
fi

# Test health endpoint
health_response=$(test_endpoint "GET" "/health" "200" "" "Health check endpoint" "true")
if [ $? -eq 0 ]; then
    # Validate health response structure
    if [ "$HAS_JQ" = "true" ]; then
        if echo "$health_response" | jq -e '.status == "ok"' >/dev/null 2>&1; then
            print_info "Health check response: $(echo "$health_response" | jq -c .)"
        fi
    else
        if echo "$health_response" | grep -q '"status"'; then
            print_info "Health check response: $health_response"
        fi
    fi
fi

# Test CORS
test_cors
test_options

echo ""

# ============================================
# 2. DATABASE CONNECTION TESTS
# ============================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}2. DATABASE CONNECTION TESTS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Test database by fetching categories (should work even if empty)
categories_response=$(test_endpoint "GET" "/api/categories" "200" "" "GET /api/categories (database test)" "true")
if [ $? -eq 0 ]; then
    if [ "$HAS_JQ" = "true" ]; then
        if echo "$categories_response" | jq -e 'type == "array"' >/dev/null 2>&1; then
            print_info "Database connection: OK (Categories endpoint accessible)"
        fi
    else
        if echo "$categories_response" | grep -qE '^[\[\{]'; then
            print_info "Database connection: OK (Categories endpoint accessible)"
        fi
    fi
fi

# Test database by fetching tasks
tasks_response=$(test_endpoint "GET" "/api/tasks" "200" "" "GET /api/tasks (database test)" "true")
if [ $? -eq 0 ]; then
    if [ "$HAS_JQ" = "true" ]; then
        if echo "$tasks_response" | jq -e 'type == "array"' >/dev/null 2>&1; then
            print_info "Database connection: OK (Tasks endpoint accessible)"
        fi
    else
        if echo "$tasks_response" | grep -qE '^[\[\{]'; then
            print_info "Database connection: OK (Tasks endpoint accessible)"
        fi
    fi
fi

# Test database by fetching notes
notes_response=$(test_endpoint "GET" "/api/notes" "200" "" "GET /api/notes (database test)" "true")
if [ $? -eq 0 ]; then
    if [ "$HAS_JQ" = "true" ]; then
        if echo "$notes_response" | jq -e 'type == "array"' >/dev/null 2>&1; then
            print_info "Database connection: OK (Notes endpoint accessible)"
        fi
    else
        if echo "$notes_response" | grep -qE '^[\[\{]'; then
            print_info "Database connection: OK (Notes endpoint accessible)"
        fi
    fi
fi

echo ""

# ============================================
# 3. CATEGORIES API TESTS
# ============================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}3. CATEGORIES API TESTS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Create a test category
create_category_response=$(test_endpoint "POST" "/api/categories" "201" '{"name":"Test Category '$(date +%s)'"}' "POST /api/categories (create)" "true")
if [ $? -eq 0 ]; then
    if [ "$HAS_JQ" = "true" ]; then
        CATEGORY_ID=$(echo "$create_category_response" | jq -r '.id // empty')
    else
        # Extract ID using grep/sed (basic extraction)
        CATEGORY_ID=$(echo "$create_category_response" | grep -oE '"id"\s*:\s*"[^"]+"' | head -1 | grep -oE '"[^"]+"' | tr -d '"' || echo "")
    fi
    if [ -n "$CATEGORY_ID" ] && [ "$CATEGORY_ID" != "null" ]; then
        print_info "Created category ID: $CATEGORY_ID"
        
        # Test updating category
        test_endpoint "PATCH" "/api/categories/$CATEGORY_ID" "200" '{"name":"Updated Test Category"}' "PATCH /api/categories/:id (update)" "true" >/dev/null
        
        # Test getting categories (should include our new one)
        test_endpoint "GET" "/api/categories" "200" "" "GET /api/categories (list all)" "true" >/dev/null
        
        # Test deleting category
        test_endpoint "DELETE" "/api/categories/$CATEGORY_ID" "204" "" "DELETE /api/categories/:id (delete)" "false" >/dev/null
        
        # Verify deletion
        test_endpoint "PATCH" "/api/categories/$CATEGORY_ID" "404" '{"name":"Should not exist"}' "PATCH /api/categories/:id (verify deleted)" "false" >/dev/null
    fi
fi

# Test validation errors
test_endpoint "POST" "/api/categories" "400" '{}' "POST /api/categories (validation error - missing name)" "false" >/dev/null
test_endpoint "POST" "/api/categories" "400" '{"name":""}' "POST /api/categories (validation error - empty name)" "false" >/dev/null

echo ""

# ============================================
# 4. TASKS API TESTS
# ============================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}4. TASKS API TESTS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Create a test category first (for task association)
test_category_response=$(test_endpoint "POST" "/api/categories" "201" '{"name":"Test Category for Tasks '$(date +%s)'"}' "POST /api/categories (for tasks)" "true")
if [ "$HAS_JQ" = "true" ]; then
    TEST_CATEGORY_ID=$(echo "$test_category_response" | jq -r '.id // empty')
else
    TEST_CATEGORY_ID=$(echo "$test_category_response" | grep -oE '"id"\s*:\s*"[^"]+"' | head -1 | grep -oE '"[^"]+"' | tr -d '"' || echo "")
fi

# Create a task
create_task_response=$(test_endpoint "POST" "/api/tasks" "201" "{\"title\":\"Test Task $(date +%s)\",\"refreshType\":\"none\"${TEST_CATEGORY_ID:+,\"categoryId\":\"$TEST_CATEGORY_ID\"}}" "POST /api/tasks (create)" "true")
if [ $? -eq 0 ]; then
    if [ "$HAS_JQ" = "true" ]; then
        TASK_ID=$(echo "$create_task_response" | jq -r '.id // empty')
    else
        TASK_ID=$(echo "$create_task_response" | grep -oE '"id"\s*:\s*"[^"]+"' | head -1 | grep -oE '"[^"]+"' | tr -d '"' || echo "")
    fi
    if [ -n "$TASK_ID" ] && [ "$TASK_ID" != "null" ]; then
        print_info "Created task ID: $TASK_ID"
        
        # Test updating task
        test_endpoint "PATCH" "/api/tasks/$TASK_ID" "200" '{"title":"Updated Test Task","completed":true}' "PATCH /api/tasks/:id (update)" "true" >/dev/null
        
        # Test getting tasks
        test_endpoint "GET" "/api/tasks" "200" "" "GET /api/tasks (list all)" "true" >/dev/null
        
        # Test creating subtask
        create_subtask_response=$(test_endpoint "POST" "/api/subtasks" "201" "{\"title\":\"Test Subtask\",\"taskId\":\"$TASK_ID\"}" "POST /api/subtasks (create)" "true")
        if [ $? -eq 0 ]; then
            if [ "$HAS_JQ" = "true" ]; then
                SUBTASK_ID=$(echo "$create_subtask_response" | jq -r '.id // empty')
            else
                SUBTASK_ID=$(echo "$create_subtask_response" | grep -oE '"id"\s*:\s*"[^"]+"' | head -1 | grep -oE '"[^"]+"' | tr -d '"' || echo "")
            fi
            if [ -n "$SUBTASK_ID" ] && [ "$SUBTASK_ID" != "null" ]; then
                print_info "Created subtask ID: $SUBTASK_ID"
                
                # Test getting subtasks
                test_endpoint "GET" "/api/tasks/$TASK_ID/subtasks" "200" "" "GET /api/tasks/:id/subtasks (list)" "true" >/dev/null
                
                # Test updating subtask
                test_endpoint "PATCH" "/api/subtasks/$SUBTASK_ID" "200" '{"title":"Updated Subtask","completed":true}' "PATCH /api/subtasks/:id (update)" "true" >/dev/null
                
                # Test deleting subtask
                test_endpoint "DELETE" "/api/subtasks/$SUBTASK_ID" "204" "" "DELETE /api/subtasks/:id (delete)" "false" >/dev/null
            fi
        fi
        
        # Test deleting task
        test_endpoint "DELETE" "/api/tasks/$TASK_ID" "204" "" "DELETE /api/tasks/:id (delete)" "false" >/dev/null
        
        # Verify deletion
        test_endpoint "PATCH" "/api/tasks/$TASK_ID" "404" '{"title":"Should not exist"}' "PATCH /api/tasks/:id (verify deleted)" "false" >/dev/null
    fi
fi

# Test validation errors
test_endpoint "POST" "/api/tasks" "400" '{}' "POST /api/tasks (validation error - missing title)" "false" >/dev/null

# Clean up test category
if [ -n "$TEST_CATEGORY_ID" ] && [ "$TEST_CATEGORY_ID" != "null" ]; then
    test_endpoint "DELETE" "/api/categories/$TEST_CATEGORY_ID" "204" "" "DELETE /api/categories/:id (cleanup)" "false" >/dev/null
fi

echo ""

# ============================================
# 5. NOTES API TESTS
# ============================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}5. NOTES API TESTS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Create a test category first (for note association)
test_category_response=$(test_endpoint "POST" "/api/categories" "201" '{"name":"Test Category for Notes '$(date +%s)'"}' "POST /api/categories (for notes)" "true")
if [ "$HAS_JQ" = "true" ]; then
    NOTE_CATEGORY_ID=$(echo "$test_category_response" | jq -r '.id // empty')
else
    NOTE_CATEGORY_ID=$(echo "$test_category_response" | grep -oE '"id"\s*:\s*"[^"]+"' | head -1 | grep -oE '"[^"]+"' | tr -d '"' || echo "")
fi

# Create a note
create_note_response=$(test_endpoint "POST" "/api/notes" "201" "{\"title\":\"Test Note $(date +%s)\",\"content\":\"Test content\"${NOTE_CATEGORY_ID:+,\"categoryId\":\"$NOTE_CATEGORY_ID\"}}" "POST /api/notes (create)" "true")
if [ $? -eq 0 ]; then
    if [ "$HAS_JQ" = "true" ]; then
        NOTE_ID=$(echo "$create_note_response" | jq -r '.id // empty')
    else
        NOTE_ID=$(echo "$create_note_response" | grep -oE '"id"\s*:\s*"[^"]+"' | head -1 | grep -oE '"[^"]+"' | tr -d '"' || echo "")
    fi
    if [ -n "$NOTE_ID" ] && [ "$NOTE_ID" != "null" ]; then
        print_info "Created note ID: $NOTE_ID"
        
        # Test updating note
        test_endpoint "PATCH" "/api/notes/$NOTE_ID" "200" '{"title":"Updated Test Note","content":"Updated content"}' "PATCH /api/notes/:id (update)" "true" >/dev/null
        
        # Test getting notes
        test_endpoint "GET" "/api/notes" "200" "" "GET /api/notes (list all)" "true" >/dev/null
        
        # Test deleting note
        test_endpoint "DELETE" "/api/notes/$NOTE_ID" "204" "" "DELETE /api/notes/:id (delete)" "false" >/dev/null
        
        # Verify deletion
        test_endpoint "PATCH" "/api/notes/$NOTE_ID" "404" '{"title":"Should not exist"}' "PATCH /api/notes/:id (verify deleted)" "false" >/dev/null
    fi
fi

# Test validation errors
test_endpoint "POST" "/api/notes" "400" '{}' "POST /api/notes (validation error - missing title)" "false" >/dev/null

# Clean up test category
if [ -n "$NOTE_CATEGORY_ID" ] && [ "$NOTE_CATEGORY_ID" != "null" ]; then
    test_endpoint "DELETE" "/api/categories/$NOTE_CATEGORY_ID" "204" "" "DELETE /api/categories/:id (cleanup)" "false" >/dev/null
fi

echo ""

# ============================================
# 6. CRON ENDPOINTS TESTS
# ============================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}6. CRON ENDPOINTS TESTS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Test daily refresh endpoint
test_endpoint "POST" "/api/tasks/refresh/daily" "200" "" "POST /api/tasks/refresh/daily (cron endpoint)" "true" >/dev/null

# Test weekly refresh endpoint
test_endpoint "POST" "/api/tasks/refresh/weekly" "200" "" "POST /api/tasks/refresh/weekly (cron endpoint)" "true" >/dev/null

echo ""

# ============================================
# 7. ERROR HANDLING TESTS
# ============================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}7. ERROR HANDLING TESTS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Test 404 for non-existent resources
test_endpoint "GET" "/api/categories/non-existent-id-12345" "200" "" "GET /api/categories/:id (non-existent - should return empty or 404)" "false" >/dev/null
test_endpoint "PATCH" "/api/tasks/non-existent-id-12345" "404" '{"title":"Test"}' "PATCH /api/tasks/:id (non-existent)" "false" >/dev/null
test_endpoint "DELETE" "/api/notes/non-existent-id-12345" "500" "" "DELETE /api/notes/:id (non-existent)" "false" >/dev/null

# Test invalid JSON
print_test "Testing invalid JSON handling"
invalid_response=$(curl -s -w "\n%{http_code}" --max-time $TIMEOUT \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"invalid": json}' \
    "$APP_URL/api/categories" 2>&1)
status_code=$(echo "$invalid_response" | tail -n1)
if [ "$status_code" = "400" ] || [ "$status_code" = "500" ]; then
    print_pass "Invalid JSON handling (Status: $status_code)"
else
    print_fail "Invalid JSON handling" "Expected 400/500 but got $status_code"
fi

echo ""

# ============================================
# SUMMARY
# ============================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}TEST SUMMARY${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Total Tests: $TESTS_TOTAL"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    echo ""
    echo "Your app is fully deployed and working correctly:"
    echo "  ✓ App is reachable"
    echo "  ✓ Database is connected"
    echo "  ✓ All API endpoints are functional"
    echo "  ✓ CORS is configured correctly"
    echo "  ✓ Error handling works as expected"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    echo ""
    echo "Please check:"
    echo "  1. Vercel function logs (Dashboard → Functions → api → Logs)"
    echo "  2. DATABASE_URL environment variable is set correctly"
    echo "  3. Database tables exist (run migrations if needed)"
    echo "  4. Network connectivity to $APP_URL"
    echo ""
    echo "Run with verbose mode for more details:"
    echo "  $0 $APP_URL true"
    exit 1
fi
