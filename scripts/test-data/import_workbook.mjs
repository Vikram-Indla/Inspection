#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';

const workbookPath=process.argv[2];
const databaseUrl=process.env.LOCAL_TEST_DATABASE_URL;
const accountPassword=process.env.LOCAL_TEST_ACCOUNT_PASSWORD;
if(!workbookPath || !databaseUrl || !accountPassword) throw new Error('Usage: LOCAL_TEST_DATABASE_URL=postgresql://... LOCAL_TEST_ACCOUNT_PASSWORD=<operator-owned> import_workbook.mjs workbook.xlsx');
const u=new URL(databaseUrl);
if(!['127.0.0.1','localhost','::1'].includes(u.hostname) || u.port!=='59422') throw new Error('LOCAL-TEST-DATA-ENV-REFUSED: target must be the dedicated loopback stack on port 59422');
if(process.env.NODE_ENV==='production') throw new Error('LOCAL-TEST-DATA-ENV-REFUSED: NODE_ENV=production');
if(!/^[A-Za-z0-9._~!@#%^+=-]{8,128}$/.test(accountPassword)) throw new Error('LOCAL-TEST-DATA-ENV-REFUSED: operator password contains unsupported transport characters');
const wb=await SpreadsheetFile.importXlsx(await FileBlob.load(workbookPath));
const accountCheck=await wb.inspect({kind:'table',range:'Accounts!A3:E25',include:'values',tableMaxRows:25,tableMaxCols:8});
const text=accountCheck.ndjson;
for(const role of ['admin','planner','supervisor','inspector']) for(let n=1;n<=5;n++) if(!text.includes(`${role}${n}`)) throw new Error(`Workbook validation failed: missing ${role}${n}`);
for(const boundary of ['multi-role','no-workspace']) if(!text.includes(boundary)) throw new Error(`Workbook validation failed: missing ${boundary}`);
const seedSql=new URL('./local_test_data_seed.sql',import.meta.url).pathname;
const pgOptions=`${process.env.PGOPTIONS ?? ''} -c app.local_test_seed_password=${accountPassword}`.trim();
const run=spawnSync('psql',[databaseUrl,'-X','-v','ON_ERROR_STOP=1','-f',seedSql],{encoding:'utf8',env:{...process.env,PGOPTIONS:pgOptions,LOCAL_TEST_ACCOUNT_PASSWORD:undefined}});
if(run.status!==0) throw new Error(`Import failed: ${run.stderr.split('\n').slice(-6).join('\n')}`);
console.log(JSON.stringify({mode:'upsert',environment:'local',accounts:22,role_grants:22,cohorts:5,boundary_personas:['multi-role','no-workspace'],seed_batch_id:'local-test-data-v1',status:'complete'}));
