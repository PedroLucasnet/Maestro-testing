
// v0.11. Add API calls throtling

import * as fs from 'fs'

import dayjs from "dayjs" 
import customParseFormat from 'dayjs/plugin/customParseFormat'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

// import moment from 'moment' // ended up using dayjs.utc; should uninstall this

import crypto from "crypto"
import axios from "axios"
import {Md5} from "ts-md5/dist/md5"
import {ExportToCsv} from "export-to-csv" // https://www.npmjs.com/package/export-to-csv

import {fsWriteJson, loadCSV} from "./utils"
import {cfg} from "./config"
import { strictEqual } from 'assert'
import { stringify } from 'querystring'
import { createSolutionBuilderWithWatch } from 'typescript'

// "JavaScript fatigue is what happens when people use tools they don't need to solve problems they don't have" - Lucas (but not Santoni)
// source: https://betterprogramming.pub/understanding-promises-in-javascript-13d99df067c1

const base = 'https://api.binance.com'

type tArgs = {
  recvWindow: string
  timestamp: string
  symbol?: string
  endTime?: string
}

type tSymbol = {
  symbol: string
  status: string // unfetched, fetched
}

type tTrade = {
  symbol:          string;
  id:              number;
  orderId:         number;
  orderListId:     number;
  price:           string;
  qty:             string;
  quoteQty:        string;
  commission:      string;
  commissionAsset: string;
  time:            number;
  isBuyer:         boolean;
  isMaker:         boolean;
  isBestMatch:     boolean;
}

class cryptioCSV {
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
}




const fetchGeneric = async (endpoint: string, label: string, signed?: boolean, symbol?: string) => { //function()

  const filenameSymbol = (symbol ? `_${symbol}` : '')
  const filename =  `data/${label+filenameSymbol}.json`

  let retWeight = 0

  let querySigned = ''
  if (signed){
    const Args: Partial<tArgs> = {
        recvWindow: cfg.defRecvWindow,
        timestamp: dayjs().valueOf().toString(),
        endTime: cfg.endTime
      }
    if (symbol){
      Args.symbol = symbol
    }
    const query = new URLSearchParams(Args).toString()
    const signature = crypto.createHmac("sha256", cfg.API_SECRET).update(query).digest("hex")
    querySigned = `?${query}&signature=${signature}`
  }

  const url = `${base+endpoint+querySigned}`

  let retJsonStr = '{}'

  if (cfg.allowLocalCache && fs.existsSync( filename)) {
    console.log(`reading ${filename}\n`)
    retJsonStr = fs.readFileSync(filename, 'utf8')
  }
  else {
    console.log(`getting ${label} ${(symbol ? `${symbol}` : '')}\n${url}\n`)
    const ret = await axios.get(url, { 
      headers: {
        "X-MBX-APIKEY": cfg.API_KEY,
      },
    })//.then(ret => console.log("got it"))
    // .catch(error => console.log(error.response.data))

    // console.log(`fetchGeneric: ret object keys: ${Object.keys(ret)}\n`)          
    // console.log(`fetchGeneric: ret['headers'] object keys: ${Object.keys(ret['headers'])}\n`)          
    // console.log(`fetchGeneric: ret x-mbx-used-weight: ${ret['headers']['x-mbx-used-weight']}\n`)          
    // console.log(`fetchGeneric: ret x-mbx-used-weight-1m: ${ret['headers']['x-mbx-used-weight-1m']}\n`)    
    retWeight = Number(ret['headers']['x-mbx-used-weight-1m'])

    retJsonStr = JSON.stringify(ret.data, null, 2)
    console.log(`fetchGeneric: retJsonStr (trunc 3000chars): ${retJsonStr.substring(0, 3000)}\n`)
    fsWriteJson(retJsonStr, filename)
  }

  const retObj = JSON.parse(retJsonStr)
  // console.log(`fetchGeneric data bit: ${retObj['timezone']}\n`)
  return { retObj , retWeight }
}


const getSymbols = async () => {

  const filename =  'data/symbols.json'

  // let symbolsObj:any = {}
  let symbolsObj:any[]   //  = {} //
             // :tSymbol
  // check if symbols.json exists and import that one
  if (cfg.allowLocalCache && fs.existsSync(filename) && fs.statSync(filename).size) {  //
    console.log(`reading ${filename}\n`)
    const symbolsStr = fs.readFileSync(filename, 'utf8')
    symbolsObj = JSON.parse(symbolsStr)
  }
  // else fetch exchangeInfo and generate a symbolsObj
  else{
    const exchangeInfoObj = await (await fetchGeneric("/api/v3/exchangeInfo", "exchangeInfo", false)).retObj
    console.log(`getSymbols: exchangeInfoObj keys: ${Object.keys(exchangeInfoObj)}\n`)          
    console.log(`getSymbols: exchangeInfoObj 'symbols' length: ${exchangeInfoObj['symbols'].length}\n`)          
    console.log(`getSymbols: exchangeInfoObj 'symbols' content (json.stringified): \n${JSON.stringify(exchangeInfoObj['symbols'][0], null, 2).substring(0, 2000)}\n`)          
    // console.log(`getSymbols: exchangeInfoObj 'symbols' keys: ${Object.keys(exchangeInfoObj['symbols'])}\n`)  // 0 - 1970

    // console.log(`getSymbols symbol: ${exchangeInfoObj['symbols']['symbol'][0]}\n`)   //fails, probably because 'symbol' is not an array       
    symbolsObj = exchangeInfoObj['symbols'].map(symbol => ({
      symbol: symbol.symbol , 
      baseAsset: symbol.baseAsset , 
      quoteAsset: symbol.quoteAsset , 
      status: 'unfetched'
     })) 
  } 
  console.log(`getSymbols: symbolsObj (json.stringified): ${JSON.stringify(symbolsObj, null, 2).substring(0, 1000)}\n`)          
  // return JSON.parse('{}')
  return symbolsObj
}


async function timeout(ms){
  return new Promise(resolve => setTimeout(resolve, ms))
}


const getTrades = async (symbolsObj) => {

async function paceMaker () {
  console.log('The time is: ' + dayjs().format('HH:mm:ss.SSS'))
  console.log(`getTrades: binanceUsedWeight:`)
  console.log(binanceUsedWeight)
  console.log('\n')

  if (binanceUsedWeight > 1100) {
    const waitUntil = binanceLastReset + 61000
    const waitForMs = waitUntil - dayjs().valueOf()
    console.log(`waiting ${waitForMs}ms`)
    await timeout(waitForMs)
    console.log('...and moving on')
  }

}

  // const symbolsObj = await getSymbols()
  // console.log(`symbolsObj:\n ${JSON.stringify(symbolsObj, null, 2)}\n`)  // all

  let symbolTradesObj: any
  let allTradesObj = []

  let binanceUsedWeight = 0
  let binanceLastReset = dayjs().valueOf()
  await paceMaker ()

  // let batchCounter = 0
  // const batchSize = 5000

  // let symbol:tSymbol
  // for (symbol in symbolsObj){
  const symbolsCount = Object.keys(symbolsObj).length
  for (let i = 0; i < symbolsCount; i++ ){
    console.log(`Symbol ${i+1} of ${symbolsCount}`)

    if (symbolsObj[i].status == 'unfetched'){
      let { retObj , retWeight } = await fetchGeneric("/api/v3/myTrades", "trades", true, symbolsObj[i].symbol) ; symbolTradesObj=retObj
      if (retWeight < binanceUsedWeight) binanceLastReset = dayjs().valueOf()
      binanceUsedWeight=retWeight
      symbolsObj[i].status = 'fetched'
      console.log(`trades ${symbolsObj[i].symbol}:\n ${JSON.stringify(symbolTradesObj, null, 2)}\n`)  // all

      await paceMaker ()
      // if (batchCounter > batchSize-1) {break}
      // batchCounter++
      // console.log(`batchCounter: ${batchCounter}\n`)
    }
    else {
      console.log(`${symbolsObj[i].symbol} should be cached from previous fetch`)
      const filename = `data/trades_${symbolsObj[i].symbol}.json`
      if (cfg.allowLocalCache && fs.existsSync( filename)) {
        console.log(`reading ${filename}\n`)
        const symbolTradesStr = fs.readFileSync(filename, 'utf8')
        symbolTradesObj = JSON.parse(symbolTradesStr)
      }
      // when using cache is not allowed or file not found, make a standard call
      else {
        console.log(`${filename} not found`)
        let { retObj , retWeight } = await fetchGeneric("/api/v3/myTrades", "trades", true, symbolsObj[i].symbol) ; symbolTradesObj=retObj
        if (retWeight < binanceUsedWeight) binanceLastReset = dayjs().valueOf()
        binanceUsedWeight=retWeight
          symbolsObj[i].status = 'fetched AGAIN'

        await paceMaker ()
      }
    }

    allTradesObj = allTradesObj.concat(symbolTradesObj)
  }

  const symbolsStr = JSON.stringify(symbolsObj, null, 2)
  fsWriteJson(symbolsStr, 'data/symbols.json')

  // console.log(`allTradesObj:\n ${JSON.stringify(allTradesObj, null, 2)}\n`)  // all

  return allTradesObj
}



function getBaseQuote (symbolsObj, symbol, BaseOrQuote) {
  let query = symbol
  const foundSymbol = symbolsObj.filter( elem => {
    if (elem['symbol'] == query){
      return elem
    }
  })
  
  // console.log('foundSymbol:\n')
  // console.log(foundSymbol)

  // console.log(foundSymbol[0]['baseAsset'])
  // console.log(foundSymbol[0]['quoteAsset'])

  if (foundSymbol.length == 0) {
    return symbol
  } else {
    if (BaseOrQuote == 'Base') return foundSymbol[0]['baseAsset']
    if (BaseOrQuote == 'Quote') return foundSymbol[0]['quoteAsset']
    return symbol
  }
}






const main = async () => {


  const symbolsObj = await getSymbols()
  // const symbolsStr = JSON.stringify(symbolsObj, null, 2)
  // fsWriteJson(symbolsStr, 'data/symbols.json')

  // demo use of getBaseQuote 
  console.log('Base: ' + getBaseQuote(symbolsObj, 'KSMETH' , 'Base') + '\n')
  console.log('Quote: ' + getBaseQuote(symbolsObj, 'KSMETH' , 'Quote') + '\n')


// trades --------------  
  const allTradesObj:tTrade[] = await getTrades(symbolsObj)

  // using persisted AllTrades file while developing
  // const devAllTradesFile ='data/allTradesObj.json'
    // fsWriteJson(JSON.stringify(allTradesObj, null, 2), devAllTradesFile)
  // const devAllTradesJSON = fs.readFileSync(devAllTradesFile, 'utf8')
  // const allTradesObj:tTrade[]  = JSON.parse(devAllTradesJSON)




  // console.log(`allTradesObj:\n ${JSON.stringify(allTradesObj, null, 2)}\n`)  // all
  console.log(`\n ------------- trades input sample (${allTradesObj.length} records):`)
  // console.log(allTradesObj)  // all
  // console.log(allTradesObj[0])
  console.log(allTradesObj.slice(0,2))
    // Possible Dev: Make persist/retrieve allTradesObj from previous runs


// trades transformation to csvData format
  let wipTrades:any = allTradesObj.map(trade => ({  //wip = work in progress
    'Date (ISO)' : dayjs(trade.time).toISOString().substring(0,17)+'00.000Z',
    'Date (GMT)' : '', //placeholder for the CSV datetimes
    'Date (ISO) orig' : dayjs(trade.time).toISOString(),
    'Date (ms)      ' : trade.time,
    'Hash / unique id': '',
    'Order type'      : 'trade',
    'Incoming asset'  : getBaseQuote(symbolsObj, trade.symbol , 'Base'),
    'Incoming volume' : Number(trade.qty),
    'Outgoing asset'  : getBaseQuote(symbolsObj, trade.symbol , 'Quote'),
    'Outgoing volume' : Number(trade.quoteQty),
    'Fee asset'       : trade.commissionAsset,
    'Fee volume'      : trade.commission,
    'Success'         : 'YES',
    'Cryptio ID'      : '',
  //  'Source'          : 'API'
    }))




    for (let i = 0; i < Object.keys(allTradesObj).length; i++) {

      if (!allTradesObj[i]['isBuyer']){  // if (isBuyer) incoming is Base; here we flip that for !isBuyer records
        wipTrades[i]['Incoming asset']  = getBaseQuote(symbolsObj, allTradesObj[i].symbol , 'Quote')       
        wipTrades[i]['Incoming volume'] = Number(allTradesObj[i].quoteQty)
        wipTrades[i]['Outgoing asset']  = getBaseQuote(symbolsObj, allTradesObj[i].symbol , 'Base')  
        wipTrades[i]['Outgoing volume'] = Number(allTradesObj[i].qty)
     }
      
/*       if (133 < i && i < 137) {
      }
      try {
      } catch (err) {}
 */   
 }
  






    console.log(`\n ------------- trades WIP sample (${wipTrades.length} records):`)
    // console.log(wipTrades)  // all
    // console.log(wipTrades[0])
    console.log(wipTrades.slice(0,2))
    
    const apiComparable:any = wipTrades.map(elem => ({
      'Date (ISO)'      : elem['Date (ISO)'] ,
      'Order type'      : elem['Order type'],
      'Incoming asset'  : elem['Incoming asset'],
      'Incoming volume' : Number(elem['Incoming volume']),
      'Outgoing asset'  : elem['Outgoing asset'],
      'Outgoing volume' : Number(elem['Outgoing volume']),
      'Fee asset'       : elem['Fee asset'],
      'Fee volume'      : Number(elem['Fee volume']),
      'Success'         : elem['Success'],
    }))
  

    console.log(`\n ------------- apiData Comparable sample (${apiComparable.length} records):`)
    // console.log(csvComparable)  // all
    // console.log(csvComparable[0])
    console.log(apiComparable.slice(134,137))
    // console.log(csvComparable['Date (GMT)'])
  
  
  
    console.log(`\n ------------- apiComparable hashing:`);
    for (let i = 0; i < Object.keys(apiComparable).length; i++) {
      // console.log(`i is ${i}`)
  
      // console.log(Md5.hashStr(JSON.stringify(csvComparable[i])))
      // console.log(Md5.hashStr(JSON.stringify(csvComparable[i])))
      // console.log(Md5.hashStr(JSON.stringify(csvComparable[i])))
      // console.log(Md5.hashStr(JSON.stringify(csvComparable[i])))
      // console.log(Md5.hashStr(JSON.stringify(csvComparable[i])))
  
      if (133 < i && i < 137) {
        console.log(apiComparable[i]);
  
        console.log(Md5.hashStr(JSON.stringify(apiComparable[i])));
      }
  
      wipTrades[i]["Comp Hash"] = Md5.hashStr(JSON.stringify(apiComparable[i]));
  
      try {
      } catch (err) {}
    }
  
  
    console.log(`\n ------------- apiData WIP sample hashed (${wipTrades.length} records):`)
    // console.log(csvObj)  // all
    // console.log(csvObj[0])
    console.log(wipTrades.slice(134,137))
    // console.log(csvObj['Date (GMT)'])
  






  
// CSV ------------------
  // let csvObj = await loadCSV() // not loading this directly from csv file for now, using a prepared csv->json file
  let csvObj:any = JSON.parse(fs.readFileSync('import-export/cryptio_transactions.json', 'utf8'))
        //  :cryptioCSV[]
  
  console.log(`\n ------------- csvData input sample (${csvObj.length} records):`)
  // console.log(csvObj)  // all
  // console.log(csvObj[0])
  console.log(csvObj.slice(134,137))


    // convert dates

  // csvObj['Date (ISO)'] = dayjs(csvObj['Date (GMT)']).toISOString()  // does nothing (because this is not python :P)
  
  // csvObj = csvObj.map(obj=> ({ ...obj, 'Date (ISO)': dayjs('2021-02-16 11:48 PM').toISOString()})) //format is ok
  // csvObj = csvObj.map(obj=> ({ ...obj, 'Date (ISO)': obj['Date (GMT)'] }))  //I can access and iterate the obj property
  // csvObj = csvObj.map(obj=> ({ ...obj, 'Date (ISO)': dayjs(obj['Date (GMT)']).toISOString()})) //fails because there is an invalid date

    dayjs.extend(utc)
    dayjs.extend(customParseFormat)
    dayjs.extend(timezone)

  csvObj.forEach (function (elem) {  
    try {

      // const theTime = dayjs.utc(elem['Date (GMT)'])
      const theTime = dayjs.utc(elem['Date (GMT)'], 'YYYY-MM-DD hh:mm A', true)//.tz("Europe/Prague")
      // console.log('day: ' + theTime.utc().toString() + ' ' +theTime.utc().toISOString())  // .valueOf()

      elem['Date (ISO)'] = theTime.utc().toISOString()
    } catch (err) {
      elem['Date (ISO)'] = 'failed to convert'
    }
  })

/*   for (let i = 0; i < Object.keys(csvObj).length ; i++ ){ //  //-2
    console.log(`i is ${i}`)
    console.log(String(csvObj[i]['Date (GMT)']))
    try {
      console.log(dayjs(csvObj[i]['Date (GMT)']).toISOString())  // .valueOf()
      csvObj[i]['Date (ISO)'] = dayjs(csvObj[i]['Date (GMT)']).toISOString()
    } catch (err) {
      csvObj[i]['Date (ISO)'] = 'failed to convert'
    }
  } */


  console.log(`\n ------------- csvData WIP sample (${csvObj.length} records):`)
  // console.log(csvObj)  // all
  // console.log(csvObj[0])
  console.log(csvObj.slice(134,137))
  // console.log(csvObj['Date (GMT)'])





  const csvComparable:any = csvObj.map(elem => ({
    'Date (ISO)'      : elem['Date (ISO)'] ,
    'Order type'      : elem['Order type'],
    'Incoming asset'  : elem['Incoming asset'],
    'Incoming volume' : Number(elem['Incoming volume']),
    'Outgoing asset'  : elem['Outgoing asset'],
    'Outgoing volume' : Number(elem['Outgoing volume']),
    'Fee asset'       : elem['Fee asset'],
    'Fee volume'      : Number(elem['Fee volume']),
    'Success'         : elem['Success'],
  }))


  console.log(`\n ------------- csvData Comparable sample (${csvComparable.length} records):`)
  // console.log(csvComparable)  // all
  // console.log(csvComparable[0])
  console.log(csvComparable.slice(134,137))
  // console.log(csvComparable['Date (GMT)'])



  console.log(`\n ------------- csvComparable hashing:`);
  for (let i = 0; i < Object.keys(csvComparable).length; i++) {
    // console.log(`i is ${i}`)

    // console.log(Md5.hashStr(JSON.stringify(csvComparable[i])))
    // console.log(Md5.hashStr(JSON.stringify(csvComparable[i])))
    // console.log(Md5.hashStr(JSON.stringify(csvComparable[i])))
    // console.log(Md5.hashStr(JSON.stringify(csvComparable[i])))
    // console.log(Md5.hashStr(JSON.stringify(csvComparable[i])))

    if (133 < i && i < 137) {
      console.log(csvComparable[i]);

      console.log(Md5.hashStr(JSON.stringify(csvComparable[i])));
    }

    csvObj[i]["Comp Hash"] = Md5.hashStr(JSON.stringify(csvComparable[i]));

    try {
    } catch (err) {}
  }


  console.log(`\n ------------- csvData WIP sample hashed (${csvObj.length} records):`)
  // console.log(csvObj)  // all
  // console.log(csvObj[0])
  console.log(csvObj.slice(134,137))
  // console.log(csvObj['Date (GMT)'])







  // prep merge

  // JS approach would be
  // wipTrades.forEach (function (element) {
  //   element.Source = 'API'
  // })
/*   Property 'Source' does not exist on type '{ 'Date (GMT)': string;
   'Hash / unique id': string; 'Order type': string; 'Incoming asset': string; 
   'Incoming volume': string; 'Outgoing asset': string; 'Outgoing volume': string;
    'Fee asset': string; 'Fee volume': string; Success: string;
     'Cryptio ID': string; }'.ts(2339)
 */


     wipTrades = wipTrades.map(obj=> ({ Source: 'API' , ...obj}))
     csvObj = csvObj.map(obj=> ({ Source: 'CSV', ...obj }))

  console.log('\n -------------------- post prep merge:')

  console.log(`'\n ------------- WIP trades sample (${wipTrades.length} records):'`)
  // console.log(wipTrades)  // all
  console.log(wipTrades[0])

  console.log(`'\n ------------- WIP csvData sample (${csvObj.length} records):'`)
  // console.log(csvObj)  // all
  console.log(csvObj[0])



    // merge


const merged = wipTrades.concat(csvObj)
    
  console.log('\n -------------------- post merge:')

  console.log(`\n ------------- merged sample (${merged.length} records):`)
  console.log(merged.slice(191,195))
    



    // export
    const options = { 
      fieldSeparator: ',',
      filename: 'data/mergedCSV',
      quoteStrings: '"',
      decimalSeparator: '.',
      showLabels: true, 
      // showTitle: true,
      // title: 'My Awesome CSV',
      useTextFile: false,
      useBom: true,
      useKeysAsHeaders: true,
      // headers: ['Column 1', 'Column 2', etc...] <-- Won't work with useKeysAsHeaders present!
    };
   
  const csvExporter = new ExportToCsv(options); //https://www.npmjs.com/package/export-to-csv

  const mergedJSON = JSON.stringify(merged, null, 2)

  const mergedCSV = csvExporter.generateCsv( mergedJSON , true );

  fsWriteJson(mergedCSV, 'import-export/mergedAPI+Cryptio.csv')

  console.log(mergedCSV)



}

main()