#!/usr/bin/env npx tsx
/**
 * CLI script to generate a test report.
 * Usage:
 *   npx tsx scripts/generate-test-report.ts                    # sample report
 *   npx tsx scripts/generate-test-report.ts --input results.json  # from vitest JSON
 */
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { generateReport, generateSampleReport, generateReportFromVitest } from '../src/test/report-generator';

const args = process.argv.slice(2);
const inputIdx = args.indexOf('--input');
const outputIdx = args.indexOf('--output');
const inputFile = inputIdx >= 0 ? args[inputIdx + 1] : null;
const outputFile = outputIdx >= 0 ? args[outputIdx + 1] : 'test-report.html';

let data;
if (inputFile && existsSync(inputFile)) {
  const json = JSON.parse(readFileSync(inputFile, 'utf-8'));
  data = generateReportFromVitest(json);
  console.log(`📥 Loaded test results from ${inputFile}`);
} else {
  data = generateSampleReport();
  console.log('📦 Generated sample report data');
}

const html = generateReport(data);
writeFileSync(outputFile, html, 'utf-8');
console.log(`✅ Report saved to ${outputFile}`);
console.log(`🔗 Open: file://${process.cwd()}/${outputFile}`);
