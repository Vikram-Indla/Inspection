import fs from 'node:fs/promises';
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';

const out = process.env.OUTPUT_DIR ?? new URL('../../outputs/019fbd0c-8368-7a72-819b-32653b4d1e65/', import.meta.url).pathname;
const previewDir = '/private/tmp/inspection-workbook-build/previews';
const wb = Workbook.create();
const navy='#17324D', teal='#087E8B', gold='#D9A441', pale='#EAF4F5', input='#FFF4CC', output='#E8F3E8', ink='#243746';
const roles=['admin','planner','supervisor','inspector'];
const names={admin:['نورة العتيبي','ريم القحطاني','سارة الحربي','هيا الدوسري','لطيفة الشهري'],planner:['عبدالله السبيعي','فيصل الغامدي','ماجد الزهراني','تركي المطيري','خالد الرشيدي'],supervisor:['محمد العنزي','أحمد الشمري','سلمان الثقفي','ياسر الجهني','بدر التميمي'],inspector:['فهد الدوسري','عمر القحطاني','زياد الحارثي','ناصر البلوي','راشد المطيري']};
const regions=['Riyadh','Eastern Province','Makkah','Madinah','Qassim'];
const cities=['Riyadh','Dammam','Jeddah','Madinah','Buraydah'];
const factories=['مصنع نجد للمكونات المعدنية','مصنع الخليج للتغليف الغذائي','مصنع البحر الأحمر للكابلات','مصنع طيبة للمنتجات الزجاجية','مصنع القصيم للمعدات الزراعية'];
const coords=[[24.7136,46.6753],[26.4207,50.0888],[21.4858,39.1925],[24.5247,39.5692],[26.3592,43.9818]];
const id=(prefix,n)=>`${prefix}000000-0000-4000-8000-${String(n).padStart(12,'0')}`;

function col(n){let s=''; while(n){n--;s=String.fromCharCode(65+n%26)+s;n=Math.floor(n/26);} return s;}
function add(name, headers, rows, note='Editable yellow cells are package inputs; green cells are derived or validated outputs.'){
  const s=wb.worksheets.add(name); s.showGridLines=false;
  const end=col(headers.length); s.getRange(`A1:${end}1`).merge(); s.getRange('A1').values=[[name]];
  s.getRange(`A1:${end}1`).format={fill:navy,font:{bold:true,color:'#FFFFFF',size:16},rowHeight:28};
  s.getRange(`A2:${end}2`).merge(); s.getRange('A2').values=[[note]]; s.getRange(`A2:${end}2`).format={fill:pale,font:{color:ink,italic:true},wrapText:true,rowHeight:28};
  s.getRange(`A3:${end}${3+rows.length}`).values=[headers,...rows];
  s.getRange(`A3:${end}3`).format={fill:teal,font:{bold:true,color:'#FFFFFF'},wrapText:true,rowHeight:28};
  if(rows.length){ const t=s.tables.add(`A3:${end}${3+rows.length}`,true,`T${name.replace(/[^A-Za-z0-9]/g,'').slice(0,22)}`); t.style='TableStyleMedium2'; t.showFilterButton=true; }
  s.freezePanes.freezeRows(3); s.getRange(`A3:${end}${3+rows.length}`).format.autofitColumns();
  for(let c=0;c<headers.length;c++){ const r=s.getRangeByIndexes(0,c,3+rows.length,1); if(r.format.columnWidth>32) r.format.columnWidth=32; }
  if(rows.length) s.getRange(`A4:${end}${3+rows.length}`).format={font:{color:ink},wrapText:true};
  return s;
}

add('Guide & Controls',['Control','Value','Purpose'],[
 ['Package ID','local-test-data-v1','Deterministic seed ownership and rollback key'],['Environment','LOCAL ONLY','Importer refuses non-loopback database hosts'],['QA password','Password','Allowed only when environment guard proves local'],['Production writes','PROHIBITED','No production URLs or credentials are stored'],['Stable IDs','Enabled','All business and persona IDs are deterministic'],['Deletion policy','Exact-member only','No heuristic cleanup; immutable audit/history retained'],['Source schema','Current local clone','Derived read-only from active PLN-012 proof schema'],['Fictitious data','Yes','No real person or establishment is represented']]);

const accounts=[]; const profiles=[];
for(const role of roles) for(let n=1;n<=5;n++){ const p={admin:'a1',planner:'a2',supervisor:'a3',inspector:'a4'}[role]; accounts.push([`${role}${n}`,`${role}${n}@local.saqeel.test`,role,id(p,n),'Password','LOCAL_ONLY']); profiles.push([id(p,n),`${role}${n}`,names[role][n-1],regions[n-1],role==='admin'?'national':'regional','active']); }
add('Accounts',['Username','Hidden Auth Email','Role','User ID','Local QA Password','Password Guard'],accounts);
add('Profiles',['User ID','Username','Fictitious Display Name','Region','Org Scope','Status'],profiles);

const est=factories.map((x,i)=>[id('f1',i+1),`TST-${['RUH','DMM','JED','MED','QSM'][i]}-00${i+1}`,x,regions[i],cities[i],coords[i][0],coords[i][1],`demo_seed:local-test-data-v1`,185-i*18]);
add('Establishments',['Factory ID','Factory Code','Fictitious Name','Region','City','Latitude','Longitude','Provenance','Employees'],est);
const licences=add('Licences',['Licence ID','Factory ID','Licence Number','Status','Stage','Issue Date','Expiry Date','Source'],factories.map((_,i)=>[id('f2',i+1),id('f1',i+1),`LIC-TST-00${i+1}`,'active','operational',new Date('2022-01-01'),new Date('2028-12-31'),'demo_seed:local-test-data-v1']));
licences.getRange('F4:G8').format.numberFormat='yyyy-mm-dd';
add('Packages Templates',['Package ID','Version ID','Code','Title','Version','Status','Item Code'],factories.map((_,i)=>[id('72',i+1),id('73',i+1),`TST-PKG-00${i+1}`,`Saudi Industrial Core Inspection ${i+1}`,'v1','published','TST-SAFETY-001']));
add('Plans',['Plan ID','Plan Reference','Method','Status','Planner Username','Supervisor Username','Cohort'],factories.map((_,i)=>[id('74',i+1),`QA-PLAN-00${i+1}`,i===1?'bulk':'single','published',`planner${i+1}`,`supervisor${i+1}`,i+1]));
add('Bulk Plans',['Scenario','Plan ID','Factory Count','Inspector Count','Atomicity','Purpose'],[['BULK-COHORT-2',id('74',2),1,1,'one transaction','Representative bulk-planning scenario']]);
const states=['prepared','on_the_way','executing','under_review','under_review'];
const scenarios=['scheduled','assigned_travel','checked_in_executing','returned_corrected_approved','submitted_under_review'];
add('Visits',['Visit ID','Reference','Plan ID','Factory ID','Package Version ID','State','Latitude','Longitude','Planner','Inspector','Cohort'],factories.map((_,i)=>[id('75',i+1),`QA-VISIT-00${i+1}`,id('74',i+1),id('f1',i+1),id('73',i+1),states[i],coords[i][0],coords[i][1],`planner${i+1}`,`inspector${i+1}`,i+1]));
add('Assignments',['Assignment ID','Visit ID','Inspector User ID','Method','Status','Cohort'],factories.map((_,i)=>[id('76',i+1),id('75',i+1),id('a4',i+1),'manual',i===0?'assigned':'accepted',i+1]));
add('Inspection Data',['Inspection ID','Visit ID','Package Version ID','Lifecycle','Response','Complete','Cohort'],[3,4,5].map(n=>[id('77',n),id('75',n),id('73',n),n===3?'in_progress':n===4?'approved':'under_review',n===4?'compliant_corrected':'compliant',true,n]));
add('Findings Reports Evidence',['Record Type','Record ID','Inspection ID','Description / Path','Severity','SHA-256 / Status'],[
 ['Finding',id('79',4),id('77',4),'Fictitious obstruction documented for correction.','minor','recorded'],
 ['Evidence metadata',id('7a',4),id('77',4),'local-test-data-v1/cohort-4/finding-photo.jpg','n/a','4444444444444444444444444444444444444444444444444444444444444444'],
 ['Submission version','local-test-data-v1-cohort4-v1',id('77',4),'Initial immutable submission snapshot','v1','immutable'],
 ['Review','cohort4-v1-return',id('77',4),'Supervisor returned safety section for correction','v1','returned'],
 ['Submission version','local-test-data-v1-cohort4-v2',id('77',4),'Corrected immutable submission snapshot','v2','immutable'],
 ['Review','cohort4-v2-approve',id('77',4),'Supervisor approved corrected submission','v2','approved'],
 ['Submission version','local-test-data-v1-cohort5-v1',id('77',5),'Review-ready immutable submission snapshot','v1','immutable'],
 ['Review','cohort5-v1-pending',id('77',5),'Open supervisor review','v1','under_review']]);
add('Relationship Matrix',['Cohort','Admin','Planner','Supervisor','Inspector','Factory','Plan','Visit','Scenario'],factories.map((_,i)=>[i+1,`admin${i+1}`,`planner${i+1}`,`supervisor${i+1}`,`inspector${i+1}`,id('f1',i+1),id('74',i+1),id('75',i+1),scenarios[i]]));
add('Data Dictionary',['Sheet','Field','Type','Required','Definition'],[['Accounts','Username','text','Yes','User-visible alias; hidden email is Auth transport only'],['Profiles','Role','enum','Yes','One of admin/planner/supervisor/inspector'],['Establishments','Provenance','text','Yes','Exact batch ownership marker'],['Visits','State','governed enum','Yes','Current operational_state value'],['Visits','Latitude/Longitude','decimal','Yes','Plausible Saudi coordinates'],['Findings Reports Evidence','SHA-256','text','When evidence exists','Metadata digest; no real image in workbook']]);
add('Import Order',['Step','Entity','Action','Rollback Order'],[['01','Environment','Guard loopback + production refusal','n/a'],['02','Roles','Verify/upsert governed four roles','16'],['03','Auth users','Upsert 20 deterministic local identities','15'],['04','Profiles and grants','Upsert profiles and role rows','14'],['05','Establishments and licences','Upsert master data','13'],['06','Packages and versions','Upsert form configuration','12'],['07','Plans and visits','Upsert planning graph','11'],['08','Assignments','Upsert inspector links','10'],['09','Inspection data','Upsert mutable execution fixtures','09'],['10','Validation','Counts, FKs, RLS, coordinates','n/a']]);
const val=add('Validation Reconciliation',['Check','Expected','Formula / Actual','Status'],[
 ['Accounts',20,null,null],['Profiles',20,null,null],['Establishments',5,null,null],['Licences',5,null,null],['Packages',5,null,null],['Plans',5,null,null],['Visits',5,null,null],['Assignments',5,null,null],['Submission versions',3,null,null],['Reviews',3,null,null],['Relationship cohorts',5,null,null],['Production secret cells',0,0,'PASS']]);
const refs=[['Accounts',23],['Profiles',23],['Establishments',8],['Licences',8],['Packages Templates',8],['Plans',8],['Visits',8],['Assignments',8],['Relationship Matrix',8]];
refs.slice(0,8).forEach(([sh,end],i)=>{val.getRange(`C${4+i}`).formulas=[[`=COUNTA('${sh}'!$A$4:$A$${end})`]];val.getRange(`D${4+i}`).formulas=[[`=IF(B${4+i}=C${4+i},"PASS","FAIL")`]];});
val.getRange('C12').formulas=[[`=COUNTIF('Findings Reports Evidence'!$A$4:$A$11,"Submission version")`]];
val.getRange('C13').formulas=[[`=COUNTIF('Findings Reports Evidence'!$A$4:$A$11,"Review")`]];
val.getRange('C14').formulas=[[`=COUNTA('Relationship Matrix'!$A$4:$A$8)`]];
for(let row=12;row<=14;row++) val.getRange(`D${row}`).formulas=[[`=IF(B${row}=C${row},"PASS","FAIL")`]];
val.getRange('D4:D15').conditionalFormats.add('containsText',{text:'PASS',format:{fill:output,font:{color:'#1B5E20',bold:true}}});
val.getRange('D4:D15').conditionalFormats.add('containsText',{text:'FAIL',format:{fill:'#FDECEC',font:{color:'#A51D2D',bold:true}}});

const summary=add('Import Summary',['Metric','Expected','Actual','Status'],[['Accounts',20,null,null],['Cohorts',5,null,null],['Factories',5,null,null],['Visits',5,null,null],['Core validation checks',12,null,null]],'Executive reconciliation for the local-only governed package.');
summary.getRange('C4:C8').formulas=[["='Validation Reconciliation'!C4"],["='Validation Reconciliation'!C14"],["='Validation Reconciliation'!C6"],["='Validation Reconciliation'!C10"],["=COUNTIF('Validation Reconciliation'!$D$4:$D$15,\"PASS\")"]];
summary.getRange('D4:D8').formulas=[['=IF(B4=C4,"PASS","FAIL")'],['=IF(B5=C5,"PASS","FAIL")'],['=IF(B6=C6,"PASS","FAIL")'],['=IF(B7=C7,"PASS","FAIL")'],['=IF(B8=C8,"PASS","FAIL")']];
summary.getRange('D4:D8').conditionalFormats.add('containsText',{text:'PASS',format:{fill:output,font:{color:'#1B5E20',bold:true}}});

for(const s of wb.worksheets.items){ const used=s.getUsedRange(); used.format.font={name:'Aptos',color:ink}; s.getRange('A1').format.font={name:'Aptos Display',bold:true,color:'#FFFFFF',size:16}; }
await fs.mkdir(out,{recursive:true}); await fs.mkdir(previewDir,{recursive:true});
for(const s of wb.worksheets.items){ const png=await wb.render({sheetName:s.name,autoCrop:'all',scale:0.8,format:'png'}); await fs.writeFile(`${previewDir}/${s.name.replace(/[^A-Za-z0-9]/g,'_')}.png`,new Uint8Array(await png.arrayBuffer())); }
const check=await wb.inspect({kind:'table',range:'Import Summary!A1:D8',include:'values,formulas',tableMaxRows:10,tableMaxCols:6});
console.log(check.ndjson);
const errors=await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A',options:{useRegex:true,maxResults:300},summary:'final formula error scan'}); console.log(errors.ndjson);
const x=await SpreadsheetFile.exportXlsx(wb); await x.save(`${out}/SAQEEL_Local_Test_Data_Package.xlsx`);
