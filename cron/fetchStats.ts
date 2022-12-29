import { getPlayerDataThrottled } from './slippi'
import { GoogleSpreadsheet } from 'google-spreadsheet';
import * as syncFs from 'fs';
import * as path from 'path';
import util from 'util';
import * as settings from '../settings'

import { exec } from 'child_process';
const fs = syncFs.promises;
const execPromise = util.promisify(exec);

var playerCodes = [
  "JOEM#521", "CPU#0", "AKFU#975", "CUBS#69", "AXE#845", "MIKEY#1",
  "KREG#147", "ARCH#870", "NOYO#107", "PATS#583", "MEDZ#841", "KYLE#943",
  "NOOD#338", "CHEWY#9", "SOL#480", "FWD#914", "YAKU#664", "NUT#247",
  "BTR#424", "ABSU#168", "ED#631", "AXCL#700", "FIDDLE#0", "SSJK#355",
  "DUBS#910", "ROCK#422", "RAY#419", "DUST#298", "CUM#566", "CRSP#939",
  "BRO#171", "BOX#0", "SAM#394", "MITO#858", "LUDW#318", "SANT#433",
  "MIDI#881", "SMOK#728", "FATE#706", "MELO#343", "YAMS#600", "GMW#420",
  "LYL#966", "KEV#024", "ADUN#843", "RFRN#1", "NANA#608", "YING#303",
  "AMIR#948", "THEF#211", "JETS#0", "SSJK#297", "PLUM#261", "LRMR#958",
  "TYO#635", "PIXY#485", "READ#50", "KNEE#477", "GOON#405", "SURF#877", 
  "GWM#420", "SURF#877"];

const getPlayerConnectCodes = async (): Promise<string[]> => {
  // const doc = new GoogleSpreadsheet(settings.spreadsheetID);
  // await doc.useServiceAccountAuth(creds);
  // await doc.loadInfo(); // loads document properties and worksheets
  // const sheet = doc.sheetsByIndex[0];
  // const rows = (await sheet.getRows()).slice(1); // remove header row
  // return [...new Set(rows.map((r) => r._rawData[1]).filter(r => r !== ''))] as string[]
  return playerCodes

};

const getPlayers = async () => {
  const codes = await getPlayerConnectCodes()
  console.log(`Found ${codes.length} player codes`)
  const allData = codes.map(code => getPlayerDataThrottled(code))
  const results = await Promise.all(allData.map(p => p.catch(e => e)));
  const validResults = results.filter(result => !(result instanceof Error));
  const unsortedPlayers = validResults
    .filter((data: any) => data?.data?.getConnectCode?.user)
    .map((data: any) => data.data.getConnectCode.user);
  return unsortedPlayers.sort((p1, p2) =>
    p2.rankedNetplayProfile.ratingOrdinal - p1.rankedNetplayProfile.ratingOrdinal)
}

async function main() {
  console.log('Starting player fetch.');
  const players = await getPlayers();
  if(!players.length) {
    console.log('Error fetching player data. Terminating.')
    return
  }
  console.log('Player fetch complete.');
  // rename original to players-old
  const newFile = path.join(__dirname, 'data/players-new.json')
  const oldFile = path.join(__dirname, 'data/players-old.json')
  const timestamp = path.join(__dirname, 'data/timestamp.json')

  await fs.rename(newFile, oldFile)
  console.log('Renamed existing data file.');
  await fs.writeFile(newFile, JSON.stringify(players));
  await fs.writeFile(timestamp, JSON.stringify({updated: Date.now()}));
  console.log('Wrote new data file and timestamp.');
  console.log('Deploying.');
  const rootDir = path.normalize(path.join(__dirname, '..'))
  console.log(rootDir)
  // if no current git changes
  const { stdout, stderr } = await execPromise(`git -C ${rootDir} status --porcelain`);
  if(stdout || stderr) {
    console.log('Pending git changes... aborting deploy');
    return
  }
  const { stdout: stdout2, stderr: stderr2 } = await execPromise(`npm run --prefix ${rootDir} deploy`);
  console.log(stdout2);
  if(stderr2) {
    console.error(stderr2);
  }
  console.log('Deploy complete.');
}

main();
