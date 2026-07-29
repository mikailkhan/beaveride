import { parseCodeUnits } from '../utils/codeParser.js';

console.log('====================================');
console.log('Testing Code Unit Parser (Phase 13 Step 1)');
console.log('====================================\n');

// 1. JavaScript / TypeScript
const tsCode = `
import { useState } from 'react';

export function calculateTotal(items: number[]): number {
  return items.reduce((acc, curr) => acc + curr, 0);
}

export const fetchUserData = async (userId: string) => {
  const response = await fetch(\`/api/users/\${userId}\`);
  return response.json();
};

export class UserSession {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  logout() {
    this.token = '';
  }
}
`;

console.log('--- TypeScript Units ---');
const tsUnits = parseCodeUnits(tsCode, 'typescript');
console.table(tsUnits);

// 2. Python
const pyCode = `
import sys

def calculate_discount(price, discount_rate):
    if price < 0:
        return 0
    return price * (1 - discount_rate)

class ShoppingCart:
    def __init__(self):
        self.items = []

    def add_item(self, item):
        self.items.append(item)
`;

console.log('\n--- Python Units ---');
const pyUnits = parseCodeUnits(pyCode, 'python');
console.table(pyUnits);

// 3. Go
const goCode = `
package main

import "fmt"

func ProcessOrder(orderId string) error {
	fmt.Println("Processing", orderId)
	return nil
}

type OrderService struct{}

func (s *OrderService) Execute() {
	fmt.Println("Executed")
}
`;

console.log('\n--- Go Units ---');
const goUnits = parseCodeUnits(goCode, 'go');
console.table(goUnits);

// Validations
let errors = 0;

if (tsUnits.length !== 5) {
  console.error(`❌ Expected 5 TS units, got ${tsUnits.length}`);
  errors++;
} else {
  console.log('✅ TS units count passed (5 units found: calculateTotal, fetchUserData, UserSession, constructor, logout)');
}

if (pyUnits.length !== 4) {
  console.error(`❌ Expected 4 Python units, got ${pyUnits.length}`);
  errors++;
} else {
  console.log('✅ Python units count passed (4 units found: calculate_discount, ShoppingCart, __init__, add_item)');
}

if (goUnits.length !== 2) {
  console.error(`❌ Expected 2 Go units, got ${goUnits.length}`);
  errors++;
} else {
  console.log('✅ Go units count passed (2 units found: ProcessOrder, Execute)');
}

if (errors === 0) {
  console.log('\n🎉 ALL CODE PARSER TESTS PASSED SUCCESSFULLY!');
} else {
  process.exit(1);
}
