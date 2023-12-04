
import * as fs from 'fs'

import dayjs from "dayjs"

import {cfg} from "./config"


// let isodate = new Date('2021-11-29T14:30:00Z')
// let result = isodate.getTime()
// console.log(result) //1638196200000

console.log(dayjs(1634485205456).toISOString())
//1634485205456 
//Sunday, October 17, 2021 3:40:05.456 PM

const filename =  'data/symbols.json'
const {size: symbSize} = fs.statSync(filename)//.size
console.log(symbSize)


console.log('2021-11-25 09:57 PM')
console.log(dayjs('2021-11-25 09:57 PM').toISOString())
