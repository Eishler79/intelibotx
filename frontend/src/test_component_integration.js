#!/usr/bin/env node
/**
 * TEST EJECUTABLE REAL - Component Integration
 * Verificar que BotControlPanel también esté libre de hardcode
 */

const fs = require('fs');
const path = require('path');

const CONTROL_PANEL_PATH = path.join(__dirname, 'components', 'BotControlPanel.jsx');

function testBotControlPanel() {
    console.log('🔍 TESTING BOT CONTROL PANEL INTEGRATION');
    console.log(`📁 File: ${CONTROL_PANEL_PATH}`);
    
    if (!fs.existsSync(CONTROL_PANEL_PATH)) {
        console.log('❌ FAIL: BotControlPanel file not found');
        return false;
    }
    
    const content = fs.readFileSync(CONTROL_PANEL_PATH, 'utf8');
    
    // Check for DL-001 compliance improvements
    const improvements = [
        { pattern: /strategy:\s*bot\.strategy\s*\|\|\s*['"]\s*['"]/, description: "Strategy fallback removed" },
        { pattern: /base_currency:\s*bot\.base_currency\s*\|\|\s*['"]\s*['"]/, description: "Base currency fallback removed" },
        { pattern: /interval:\s*bot\.interval\s*\|\|\s*['"]\s*['"]/, description: "Interval fallback removed" },
        { pattern: /Smart Scalper - Wyckoff/, description: "Strategy descriptions updated" }
    ];
    
    let improvementsFound = 0;
    improvements.forEach(improvement => {
        if (improvement.pattern.test(content)) {
            console.log(`✅ ${improvement.description}`);
            improvementsFound++;
        } else {
            console.log(`❌ Missing: ${improvement.description}`);
        }
    });
    
    console.log(`\n📊 DL-001 IMPROVEMENTS: ${improvementsFound}/${improvements.length}`);
    
    if (improvementsFound >= 2) {
        console.log('✅ PASS: BotControlPanel DL-001 compliance improved');
        return true;
    } else {
        console.log('❌ FAIL: Insufficient DL-001 improvements');
        return false;
    }
}

if (require.main === module) {
    const result = testBotControlPanel();
    process.exit(result ? 0 : 1);
}

module.exports = { testBotControlPanel };