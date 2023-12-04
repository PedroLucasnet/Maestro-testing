
import * as fs from 'fs'
import {parse} from "csv-parse"

export async function fsWriteJson(whatToWrite: string, filename: string) {
    fs.writeFileSync (filename, whatToWrite)
      console.log (`wrote ${filename}\n`)
  }
  

// for now I used this function only to import the CSV and save it as a .json file
// current index.ts does not call this. it is just reading the import-export/csvASjson.json file
// when index.ts did  let csvObj = await loadCSV()  I could only get the parser object
export async function loadCSV () {
  type cryptioCSV = {
    'Date (GMT)' : string
    'Hash / unique id' : string //hash
    'Order type' : string
    'Incoming asset' : string
    'Incoming volume' : number
    'Outgoing asset' : string
    'Outgoing volume' : number
    'Fee asset' : number
    'Fee volume' : number
    'Success' : string
    'Cryptio ID' : string //hash
    'Source' : string
  }

  const headers = [
  'Date (GMT)',
  'Hash / unique id',
  'Order type',
  'Incoming asset',
  'Incoming volume',
  'Outgoing asset',
  'Outgoing volume',
  'Fee asset',
  'Fee volume',
  'Success',
  'Cryptio ID'
  ];
  
  const floatCols = [
    'Incoming volume',
    'Outgoing volume',
    'Fee volume'
    ];
    
  const fileContent = fs.readFileSync('import-export/cryptio_transactions.csv', 'utf8')

  // let csvObj:cryptioCSV[]

  const csvObj = parse(fileContent, { delimiter: '\t', columns: headers, fromLine: 2,
    cast : (eachVal , context) => {
      if (floatCols.includes(context.column.toString())){
        return parseFloat(eachVal)
      }
      return eachVal
    }
  }, //callback
    (error, result:cryptioCSV[]) => { //
      if (error) {
        console.error(error) 
      }
      fsWriteJson(JSON.stringify(result, null, 2), 'import-export/cryptio_transactions.json')
      // csvObj = result
      // console.log("Imported CSV:\n", result)
    }
  )
  // const csvObj = JSON.parse(fs.readFileSync('data/csvASjson.json', 'utf8'))
  return csvObj
}
