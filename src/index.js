const path = require( "path" )
const fs = require( "fs" )
const {writeFileSync} = require( "fs" )
const {parse} = require( "json2csv" )
const {calc} = require("./modules/calc")
const {getArguments} = require("./helpers/arguments")
const {isset} = require("./helpers/isset")
const {print, error} = require("./helpers/print")
const {Table} = require("console-table-printer")

/*
* Using command line argument
* node index.mjs -k B62qr... -e 1 -f 0.05
*
* Match keys to arguments:
* -a === address
* -e === epoch
* -f === fee
* -s === fee for super charge
* -n === fee for foundation delegations
* -k === confirmations
* -m === minHeight
* -x === maxHeight
* -c === coinbase
* -i === include address to unlocked
* -v === val.toFixed(v)
*
* Default values:
* epoch = 0,
* fee = 0.05,
* feeSuperCharge = 0.05,
* feeFoundation = 0.05,
* confirmations = 15,
* minHeight = 0,
* maxHeight = 0,
* coinbase = 720
* includeAddressToUnlocked = false
*
* */

/*
* Set foundation delegation addresses, if exists
* */
const foundation = []

/*
* Set calculation parameters
* */
const args = getArguments()
const {
    a: address = "B62qrAWZFqvgJbfU95t1owLAMKtsDTAGgSZzsBJYUzeQZ7dQNMmG5vw",
    e: epoch = 0,
    f: fee = 0.05,
    s: feeSuperCharge = 0.05,
    n: feeFoundation = 0.05,
    k: confirmations = 15,
    m: minHeight = 0,
    x: maxHeight = 0,
    c: coinbase = 720,
    i: includeAddressToUnlocked = false,
    v: fixed = 4
} = args

async function start () {
    print(`\nWe calculate payouts for address: ${address}`)
    print(`In the epoch ${epoch} with fee ${(fee * 100).toFixed(2)}%`)

    const result = await calc(
        address,
        {
            epoch,
            fee,
            feeSuperCharge,
            feeFoundation,
            confirmations,
            minHeight,
            maxHeight,
            coinbase,
            includeAddressToUnlocked
        },
        foundation)

    if (isset(result.error)) {
        console.log(result.error.message)
        return
    }

    if (!result.data) {
        console.log(result.message)
        return
    }

    print(`\nUsing ledger hash ${result.ledgerHash}`)
    print(`The pool total staking balance is: ${result.totalStakingBalance}`)
    print(`The foundation delegation balance is: ${result.totalStakingBalanceFoundation}`)
    print(`The unlocked balance is: ${result.totalStakingBalanceUnlocked}`)
    print(`There are ${result.delegators.length} delegates in the pool`)
    print(`We are using blocks from ${result.fromBlock} to ${result.toBlock}`)

    if (result.emptyBlocks.length) {
        print(`Skipped blocks with 0 coinbase ${result.emptyBlocks.length}:`)
        const _tableEmptyBlocks = new Table({
            columns: [
                {name: "index", title: "ID", alignment: 'center'},
                {name: "block", title: "Block height"}
            ]
        })
        _tableEmptyBlocks.addRows(result.emptyBlocks)
        _tableEmptyBlocks.printTable()
    }

    print(`\nWe won these ${result.canonicalBlocks.length}:`)
    const _tableWonBlocks = new Table({
        columns: [
            {name: "id", title: "ID"},
            {name: "height", title: "Block height"},
            {name: "reward", title: "Reward"},
            {name: "snarkFee", title: "Snark"},
            {name: "txFees", title: "Tx Fees"},
            {name: "slot", title: "Slot"},
            {name: "epoch", title: "Epoch"},
            {name: "stateHash", title: "Hash", alignment: 'left'}
        ]
    })
    _tableWonBlocks.addRows(result.canonicalBlocks)
    _tableWonBlocks.printTable()

    const totalReward = result.totalReward + result.superCharge

    print(`\nWe are won ${((totalReward) / 10**9).toFixed(fixed)} mina (${totalReward} nanomina) in this window.`)
    print(`Regular rewards is ${result.totalReward / 10**9} mina`)
    print(`Super charge rewards is ${result.superCharge / 10**9} mina`)
    print(`Transactions fee is ${result.transactionsFee / 10**9} mina`)
    print(`Pool fee is ${ ((totalReward - result.delegatorsRewards) / 10**9).toFixed(fixed) } mina`)
    print(`Paid out rewards to delegators is ${ (result.delegatorsRewards / 10**9).toFixed(fixed) } mina`)
    print(`Snark fee is ${result.totalSnarkFee / 10**9} mina`)

    print(`\nPaid out rewards by type:`)
    const _tableRewards = new Table()
    _tableRewards.addRows([
        {"Type": "Foundation", "Reward": (result.foundationRewards / 10**9).toFixed(fixed)},
        {"Type": "Regular", "Reward": (result.regularRewards / 10**9).toFixed(fixed)},
        {"Type": "Super Charge", "Reward": (result.superChargeRewards / 10**9).toFixed(fixed)}
    ])
    _tableRewards.printTable()

    print(`\nPayout table:`)
    const payoutTable = []
    for(let r of result.payoutTable) {
        const {id, address, balance, nano, mina, found, locked} = r
        payoutTable.push({
            id,
            address,
            balance: balance.toFixed(9),
            percent: ((balance / result.totalStakingBalance) * 100).toFixed(2),
            mina,
            found: found ? "yes" : "no",
            locked: locked ? "yes" : "no"
        })
    }
    const _tablePayouts = new Table({
        columns: [
            {name: "id", title: "ID"},
            {name: "address", title: "Address"},
            {name: "balance", title: "Balance"},
            {name: "percent", title: "%"},
            {name: "mina", title: "Payout Mina"},
            {name: "found", title: "Found"},
            {name: "locked", title: "Locked"}
        ]
    })
    _tablePayouts.addRows(payoutTable)
    _tablePayouts.printTable()

    const csvFields = ['id', 'address', 'balance', 'percent', 'mina', 'found', 'locked']

    try {
        const csv = parse(payoutTable, {fields: csvFields})
        writeFileSync(`./csv/rewards-epoch-${epoch}.csv`, csv)

        print(`\nCSV data:\n`)
        console.log(csv)
    } catch (err) {
        console.log(err)
    }
}

start();


