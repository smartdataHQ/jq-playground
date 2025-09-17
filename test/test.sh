#!/bin/bash

echo "Testing jq examples..."
echo "======================"

# Test users example
echo "Testing users example:"
jq -f users.jq users.json
if [ $? -eq 0 ]; then
  echo "✅ Users example is valid"
else
  echo "❌ Users example has errors"
fi
echo ""

# Test products example
echo "Testing products example:"
jq -f products.jq products.json
if [ $? -eq 0 ]; then
  echo "✅ Products example is valid"
else
  echo "❌ Products example has errors"
fi
echo ""

# Test logs example
echo "Testing logs example:"
jq -f logs.jq logs.json
if [ $? -eq 0 ]; then
  echo "✅ Logs example is valid"
else
  echo "❌ Logs example has errors"
fi
echo ""

echo "Tests completed"