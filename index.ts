
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

import dotenv from 'dotenv'; 
//dotenv.config();  // Load environment variables from .env file 
const apiKey = process.env.MSTR_KEY;  // Retrieve the environment variable 
console.log('API Key:', apiKey);  // Use the environment variable as needed

// "JavaScript fatigue is what happens when people use tools they don't need to solve problems they don't have" - Lucas (but not Santoni)
// source: https://betterprogramming.pub/understanding-promises-in-javascript-13d99df067c1

const base = 'https://mainnet.gomaestro-api.org/v1/'

type tArgs = {
  recvWindow: string
  timestamp: string
  symbol?: string
  endTime?: string
}


const fetchGeneric = async (endpoint: string, label: string, cursor?: string, signed?: boolean, symbol?: string) => { //function()

  const filenameSymbol = (symbol ? `_${symbol}` : '')
  const filenameCursor = (cursor ? `_${cursor}` : '')
  const filename =  `data/${label+filenameSymbol+filenameCursor}.json`

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

  let queryCursor = ''
  if (cursor){
    queryCursor = `?cursor=${cursor}`
  }

  const url = `${base+endpoint+queryCursor+querySigned}`

  let retJsonStr = '{}'

  if (cfg.allowLocalCache && fs.existsSync( filename)) {
    console.log(`reading ${filename}\n`)
    retJsonStr = fs.readFileSync(filename, 'utf8')
  }
  else {
    console.log(`getting ${label} ${(symbol ? `${symbol}` : '')}\n${url}\n`)
    const ret = await axios.get(url, { 
      headers: {
        "api-key": cfg.API_KEY,
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




const PolicyUTxOs = async () => {
  console.log('-- PolicyUTxOs')
//  const queryArg1 = 'f0ff48bbb7bbe9d59a40f1ce90e9e9d0ff5002ec48f232b49ca0fb9a'
  const queryArg1 = 'f0ff48bbb7bbe9d59a40f1ce90e9e9d0ff5002ec48f232b49ca0fb9a'
  const endpoint1 = `policy/${queryArg1}/utxos`
  let next_cursor = ''
  let fetchretint
  //console.log('-- fetchGeneric returned')
  do {
    fetchretint = await fetchGeneric(endpoint1, endpoint1.replace(/\//gi,'_'), next_cursor)
    console.log(`next_cursor: ${fetchretint.retObj.next_cursor}`)
    next_cursor = fetchretint.retObj.next_cursor
  }
  while (fetchretint.retObj.next_cursor != null); // fetchret = null
}

const main = async () => {
  console.log('-- main')
  PolicyUTxOs()

}

main()