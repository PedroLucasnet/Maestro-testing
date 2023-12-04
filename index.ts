
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

const base = 'https://mainnet.gomaestro-api.org/v1'

type tArgs = {
  recvWindow: string
  timestamp: string
  symbol?: string
  endTime?: string
}



const main = async () => {
  console.log('Hello')


}

main()