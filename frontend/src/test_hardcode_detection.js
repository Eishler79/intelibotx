#!/usr/bin/env node
/**
 * TEST EJECUTABLE REAL - Hardcode Detection
 * Verificar líneas exactas de hardcode en BotCreationModal
 */

const fs = require('fs');
const path = require('path');

const MODAL_PATH = path.join(__dirname, 'components', 'EnhancedBotCreationModal.jsx');

function testHardcodeDetection() {
    console.log('🔍 TESTING HARDCODE DETECTION');
    console.log(`📁 File: ${MODAL_PATH}`);
    
    if (!fs.existsSync(MODAL_PATH)) {
        console.log('❌ FAIL: Modal file not found');
        return false;
    }
    
    const content = fs.readFileSync(MODAL_PATH, 'utf8');
    const lines = content.split('\n');
    
    // EXACT hardcode violations to find
    const violations = [
        { pattern: /base_currency:\s*['"]\s*USDT\s*['"]/, description: "base_currency hardcode" },
        { pattern: /strategy:\s*['"]\s*Smart Scalper\s*['"]/, description: "strategy hardcode" },
        { pattern: /interval:\s*['"]\s*15m\s*['"]/, description: "interval hardcode" },
        { pattern: /margin_type:\s*['"]\s*ISOLATED\s*['"]/, description: "margin_type hardcode" }
    ];
    
    let foundViolations = [];
    
    lines.forEach((line, index) => {
        violations.forEach(violation => {
            if (violation.pattern.test(line.trim())) {
                foundViolations.push({
                    line: index + 1,
                    content: line.trim(),
                    description: violation.description
                });
            }
        });
    });
    
    console.log(`\n📊 HARDCODE VIOLATIONS FOUND: ${foundViolations.length}`);
    
    foundViolations.forEach(violation => {
        console.log(`❌ Line ${violation.line}: ${violation.description}`);
        console.log(`   Code: ${violation.content}`);
    });
    
    // Expected violations (should find all 4 types)
    const expectedTypes = violations.map(v => v.description);
    const foundTypes = [...new Set(foundViolations.map(v => v.description))];
    
    console.log(`\n🎯 EXPECTED: ${expectedTypes.length} hardcode types`);
    console.log(`📍 FOUND: ${foundTypes.length} hardcode types`);
    
    // AFTER DL-001 FIX: We should find NO hardcode violations
    if (foundViolations.length === 0) {
        console.log('✅ PASS: No hardcode violations found - DL-001 COMPLIANT');
        return true;
    } else {
        console.log('❌ FAIL: Hardcode violations still exist - DL-001 NOT COMPLIANT');
        return false;
    }
}

if (require.main === module) {
    const result = testHardcodeDetection();
    process.exit(result ? 0 : 1);
}

module.exports = { testHardcodeDetection };