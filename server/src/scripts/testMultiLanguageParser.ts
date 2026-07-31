import { parseCodeUnits } from '../utils/codeParser.js';

console.log('====================================');
console.log('Testing Multi-Language Code Unit Parser Registry');
console.log('====================================\n');

let errors = 0;

// 1. JavaScript / TypeScript
const tsCode = `
export class UserSession {
  constructor() {}
}

export async function calculateTotal(items: number[]) {
  return items.reduce((a, b) => a + b, 0);
}
`;
const tsUnits = parseCodeUnits(tsCode, 'typescript');
console.log('TypeScript Units:', tsUnits);
if (tsUnits.length >= 2 && tsUnits.some(u => u.unitName === 'UserSession') && tsUnits.some(u => u.unitName === 'calculateTotal')) {
  console.log('✅ TypeScript / JavaScript parsing PASSED');
} else {
  console.error('❌ TypeScript / JavaScript parsing FAILED');
  errors++;
}

// 2. Python
const pyCode = `
class DataPipeline:
    def execute(self):
        print("Running pipeline")

def process_data(items):
    return len(items)
`;
const pyUnits = parseCodeUnits(pyCode, 'python');
console.log('Python Units:', pyUnits);
if (pyUnits.length >= 3 && pyUnits.some(u => u.unitName === 'DataPipeline') && pyUnits.some(u => u.unitName === 'process_data')) {
  console.log('✅ Python parsing PASSED');
} else {
  console.error('❌ Python parsing FAILED');
  errors++;
}

// 3. Java
const javaCode = `
public class OrderService {
    public void processOrder(int orderId) {
        System.out.println("Processing");
    }
}
`;
const javaUnits = parseCodeUnits(javaCode, 'java');
console.log('Java Units:', javaUnits);
if (javaUnits.length >= 2 && javaUnits.some(u => u.unitName === 'OrderService') && javaUnits.some(u => u.unitName === 'processOrder')) {
  console.log('✅ Java parsing PASSED');
} else {
  console.error('❌ Java parsing FAILED');
  errors++;
}

// 4. C++
const cppCode = `
class Vector3D {
public:
    double getMagnitude() {
        return 0.0;
    }
};

int main() {
    return 0;
}
`;
const cppUnits = parseCodeUnits(cppCode, 'cpp');
console.log('C++ Units:', cppUnits);
if (cppUnits.length >= 2 && cppUnits.some(u => u.unitName === 'Vector3D') && cppUnits.some(u => u.unitName === 'main')) {
  console.log('✅ C++ parsing PASSED');
} else {
  console.error('❌ C++ parsing FAILED');
  errors++;
}

// 5. C#
const csCode = `
public class CustomerController {
    public async Task<IActionResult> GetCustomer(int id) {
        return Ok();
    }
}
`;
const csUnits = parseCodeUnits(csCode, 'csharp');
console.log('C# Units:', csUnits);
if (csUnits.length >= 2 && csUnits.some(u => u.unitName === 'CustomerController') && csUnits.some(u => u.unitName === 'GetCustomer')) {
  console.log('✅ C# parsing PASSED');
} else {
  console.error('❌ C# parsing FAILED');
  errors++;
}

// 6. Go
const goCode = `
func (s *Server) Start() {
    log.Println("Server started")
}

func CalculateHash(data []byte) string {
    return "hash"
}
`;
const goUnits = parseCodeUnits(goCode, 'go');
console.log('Go Units:', goUnits);
if (goUnits.length >= 2 && goUnits.some(u => u.unitName === 'Start') && goUnits.some(u => u.unitName === 'CalculateHash')) {
  console.log('✅ Go parsing PASSED');
} else {
  console.error('❌ Go parsing FAILED');
  errors++;
}

// 7. PHP
const phpCode = `
<?php
class User {
    public function getName() {
        return "Alice";
    }
}

function format_currency($amount) {
    return "$" . $amount;
}
`;
const phpUnits = parseCodeUnits(phpCode, 'php');
console.log('PHP Units:', phpUnits);
if (phpUnits.length >= 2 && phpUnits.some(u => u.unitName === 'User') && phpUnits.some(u => u.unitName === 'format_currency')) {
  console.log('✅ PHP parsing PASSED');
} else {
  console.error('❌ PHP parsing FAILED');
  errors++;
}

// 8. Ruby
const rubyCode = `
class ShoppingCart
  def add_item(item)
    @items << item
  end
end

def total_price(cart)
  cart.sum
end
`;
const rubyUnits = parseCodeUnits(rubyCode, 'ruby');
console.log('Ruby Units:', rubyUnits);
if (rubyUnits.length >= 3 && rubyUnits.some(u => u.unitName === 'ShoppingCart') && rubyUnits.some(u => u.unitName === 'add_item') && rubyUnits.some(u => u.unitName === 'total_price')) {
  console.log('✅ Ruby parsing PASSED');
} else {
  console.error('❌ Ruby parsing FAILED');
  errors++;
}

// 9. Rust
const rustCode = `
pub struct Account {
    id: u64,
}

pub async fn connect_db(url: &str) {
    println!("Connecting");
}
`;
const rustUnits = parseCodeUnits(rustCode, 'rust');
console.log('Rust Units:', rustUnits);
if (rustUnits.length >= 2 && rustUnits.some(u => u.unitName === 'Account') && rustUnits.some(u => u.unitName === 'connect_db')) {
  console.log('✅ Rust parsing PASSED');
} else {
  console.error('❌ Rust parsing FAILED');
  errors++;
}

if (errors === 0) {
  console.log('\n🎉 ALL MULTI-LANGUAGE CODE PARSER TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
} else {
  process.exit(1);
}
