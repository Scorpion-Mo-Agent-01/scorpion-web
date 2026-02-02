#!/bin/bash

BASE_URL="http://localhost:3000"
PASSED=0
FAILED=0

echo "======================================"
echo "Scorpion Web - Test Suite"
echo "======================================"
echo ""

# Test 1: Homepage loads
echo "Test 1: Homepage loads"
if curl -s "$BASE_URL/" | grep -q "SCORPION"; then
    echo "✓ PASSED"
    PASSED=$((PASSED + 1))
else
    echo "✗ FAILED"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test 2: GET /api/tasks returns JSON array
echo "Test 2: GET /api/tasks returns JSON array"
TASKS=$(curl -s "$BASE_URL/api/tasks")
if echo "$TASKS" | jq -e 'type == "array"' > /dev/null 2>&1; then
    TASK_COUNT=$(echo "$TASKS" | jq 'length')
    echo "✓ PASSED - Retrieved $TASK_COUNT tasks"
    PASSED=$((PASSED + 1))
else
    echo "✗ FAILED"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test 3: POST /api/tasks creates a new task
echo "Test 3: POST /api/tasks creates a new task"
NEW_TASK=$(curl -s -X POST "$BASE_URL/api/tasks" \
  -H "Content-Type: application/json" \
  -d '{"title":"Automated Test Task","description":"Created by test suite"}')
TASK_ID=$(echo "$NEW_TASK" | jq -r '.id' 2>/dev/null)
if [ -n "$TASK_ID" ] && [ "$TASK_ID" != "null" ]; then
    echo "✓ PASSED - Created task with ID: $TASK_ID"
    PASSED=$((PASSED + 1))
else
    echo "✗ FAILED"
    FAILED=$((FAILED + 1))
    TASK_ID=""
fi
echo ""

# Test 4: PATCH /api/tasks updates task status
if [ -n "$TASK_ID" ]; then
    echo "Test 4: PATCH /api/tasks updates task status"
    UPDATED=$(curl -s -X PATCH "$BASE_URL/api/tasks" \
      -H "Content-Type: application/json" \
      -d "{\"id\":\"$TASK_ID\",\"status\":\"done\"}")
    UPDATED_STATUS=$(echo "$UPDATED" | jq -r '.status' 2>/dev/null)
    if [ "$UPDATED_STATUS" == "done" ]; then
        echo "✓ PASSED - Status updated to 'done'"
        PASSED=$((PASSED + 1))
    else
        echo "✗ FAILED - Expected status 'done', got '$UPDATED_STATUS'"
        FAILED=$((FAILED + 1))
    fi
else
    echo "Test 4: PATCH /api/tasks updates task status"
    echo "✗ SKIPPED - No task ID from previous test"
fi
echo ""

# Test 5: Data persistence - verify task exists in DB
echo "Test 5: Data persistence - verify task in container (SQLite)"
if [ -n "$TASK_ID" ] && docker exec scorpion-web sqlite3 /app/data/tasks.db "select id from tasks where id='$TASK_ID';" | grep -q "$TASK_ID"; then
    echo "✓ PASSED - Task persisted to data/tasks.db"
    PASSED=$((PASSED + 1))
else
    echo "✗ FAILED - Task not found in data DB"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test 6: Dashboard route exists
echo "Test 6: Dashboard route exists"
if curl -s "$BASE_URL/dashboard" | grep -q "Obsidian Control"; then
    echo "✓ PASSED - Dashboard route accessible"
    PASSED=$((PASSED + 1))
else
    echo "✗ FAILED"
    FAILED=$((FAILED + 1))
fi
echo ""

# Summary
echo "======================================"
echo "Test Summary"
echo "======================================"
echo "PASSED: $PASSED"
echo "FAILED: $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "✓ All tests passed!"
    exit 0
else
    echo "✗ Some tests failed"
    exit 1
fi
