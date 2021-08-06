const assert = require("assert")
const {getLagerHash, getStakingLager, getBlocks, getLatestHeight} = require("./graphql")
const {isset} = require("./../helpers/isset")
const {print} = require("./../helpers/print")

const calc = async (
    address,
    {
        epoch = 0,
        fee = 0.05,
        feeSuperCharge = 0.05,
        feeFoundation = 0.05,
        confirmations = 15,
        minHeight = 0,
        maxHeight = 0,
        coinbase = 720,
        includeAddressToUnlocked = false
    } = {},
    foundationDelegations = []
) => {
    if (globalThis.debug) {
        print(`\nWe use next values:`)
        print(`Epoch: ${epoch}`)
        print(`Fee: ${fee}`)
        print(`Super charge fee: ${feeSuperCharge}`)
        print(`Foundation fee: ${feeFoundation}`)
        print(`Confirmations: ${confirmations}`)
        print(`Min height: ${minHeight}`)
        print(`Max height: ${maxHeight}`)
        print(`Coinbase: ${coinbase}`)
        print(`Address will included to unlocked: ${includeAddressToUnlocked}`)
    }

    const result = {
        ok: false,
        data: true
    }
    const nano = 10**9

    let totalStakingBalance = 0
    let totalStakingBalanceUnlocked = 0
    let totalStakingBalanceFoundation = 0
    let totalReward = 0
    let delegators = []
    let emptyBlocks = []
    let nonCanonicalBlocks = []
    let canonicalBlocks = []
    let includedBlocks = []
    let allBlockRewards = 0
    let allX2BlockRewards = 0
    let totalSnarkFee = 0
    let transactionsFee = 0
    let delegatorsRewards = 0
    let payoutTable = []

    try {
        const ledgerHashData = await getLagerHash({epoch})
        const ledgerHash = ledgerHashData["data"]["blocks"][0]["protocolState"]["consensusState"]["stakingEpochData"]["ledger"]["hash"]

        const latestBlock = maxHeight ? {'data': {'blocks': [{'blockHeight': maxHeight}]}} : await getLatestHeight()
        assert(latestBlock && latestBlock["data"]["blocks"][0]["blockHeight"] > 1, `Can't get latest block height`)

        const confirmedBlock = latestBlock["data"]["blocks"][0]["blockHeight"] - confirmations
        assert(confirmedBlock <= latestBlock["data"]["blocks"][0]["blockHeight"], `Confirmed block must be less or equal to ${latestBlock["data"]["blocks"][0]["blockHeight"]}`)

        const stakingLedger = await getStakingLager({
            "delegate": address,
            "ledgerHash": ledgerHash
        })

        result.address = address
        result.ledgerHash = ledgerHash

        if (!isset(stakingLedger["data"]["stakes"]) || !stakingLedger["data"]["stakes"]) {
            result.message = `We haven't delegators!`
            return result
        }

        // Create delegators list
        for (let stake of stakingLedger["data"]["stakes"]) {
            let locked = true, foundation = false
            let balance = +stake["balance"]
            let publicKey = stake["public_key"]

            if (balance === 0) continue

            if (!stake.timing || (includeAddressToUnlocked && address === publicKey)) {
                locked = false
                totalStakingBalanceUnlocked += balance
            }

            if (foundationDelegations.includes(publicKey)) {
                foundation = true
                totalStakingBalanceFoundation += balance
            }

            delegators.push({
                publicKey,
                totalReward: 0,
                stakingBalance: balance,
                percentOfTotal: 0,
                percentOfSuperCharge: 0,
                locked,
                foundationDelegation: foundation
            })

            totalStakingBalance += balance
        }

        const blocks = await getBlocks({
            "creator": address,
            epoch,
            "blockHeightMin": minHeight,
            "blockHeightMax": confirmedBlock,
        })

        if (!isset(blocks["data"]["blocks"]) || !blocks["data"]["blocks"]) {
            result.message = `Nothing to payout as we didn't win anything!`
            return result
        }

        result.data = true

        let blockIndex = 1
        for (let block of blocks["data"]["blocks"]) {
            const height = block["blockHeight"]
            const slot = block["protocolState"]["consensusState"]["slotSinceGenesis"]
            const blockRewardNano = +(block["transactions"]["coinbase"])
            const blockReward = blockRewardNano / nano
            const snarkFee = +block["snarkFees"]
            const epoch = +block["protocolState"]["consensusState"]["epoch"]
            const stateHash = block["stateHash"]
            const txFees = +block["txFees"]

            if (!block["transactions"]["coinbaseReceiverAccount"]) {
                emptyBlocks.push(height)
                continue
            }

            if (!block["canonical"]) {
                nonCanonicalBlocks.push(height)
                continue
            }

            includedBlocks.push(height)

            totalSnarkFee += snarkFee
            transactionsFee += txFees

            if (blockReward > coinbase) {
                allX2BlockRewards += blockRewardNano - (coinbase * nano)
                allBlockRewards += blockRewardNano - (coinbase * nano)
            } else {
                allBlockRewards += blockRewardNano
            }

            canonicalBlocks.push({
                id: blockIndex,
                height,
                reward: blockReward,
                snarkFee,
                txFees,
                slot,
                epoch,
                stateHash,
            })

            blockIndex++
        }

        totalReward = allBlockRewards + transactionsFee - totalSnarkFee

        result.fromBlock = minHeight
        result.toBlock = confirmedBlock
        result.canonicalBlocks = canonicalBlocks
        result.nonCanonicalBlocks = nonCanonicalBlocks
        result.emptyBlocks = emptyBlocks
        result.includedBlocks = includedBlocks
        result.transactionsFee = transactionsFee
        result.superCharge = allX2BlockRewards
        result.totalReward = totalReward
        result.totalSnarkFee = totalSnarkFee
        result.totalStakingBalance = totalStakingBalance
        result.totalStakingBalanceFoundation = totalStakingBalanceFoundation
        result.totalStakingBalanceUnlocked = totalStakingBalanceUnlocked

        let delegatorIndex = 1
        let foundationRewards = 0
        let superChargeRewards = 0
        let regularRewards = 0

        for (let d of delegators) {
            const balance = d["stakingBalance"]
            let superCharge

            d["percentOfTotal"] = balance / totalStakingBalance

            if (d["foundationDelegation"]) {
                d["totalReward"] = totalReward * d["percentOfTotal"] * (1 - feeFoundation)
                foundationRewards += d["totalReward"]
            } else {
                d["totalReward"] = totalReward * d["percentOfTotal"] * (1 - fee)
                regularRewards += d["totalReward"]

                if (d["locked"] === false) {
                    d["percentOfSuperCharge"] = balance / totalStakingBalanceUnlocked
                    superCharge = allX2BlockRewards * d["percentOfSuperCharge"] * (1 - feeSuperCharge)
                    d["totalReward"] = d["totalReward"] + superCharge
                    superChargeRewards += superCharge
                }
            }

            delegatorsRewards += d["totalReward"]

            payoutTable.push({
                id: delegatorIndex,
                address: d["publicKey"],
                balance: d["stakingBalance"],
                nano: Math.round(d["totalReward"]),
                mina: Math.round(d["totalReward"]) / nano,
                found: d["foundationDelegation"],
                locked: d["locked"]
            })

            delegatorIndex++
        }

        result.delegatorsRewards = delegatorsRewards
        result.foundationRewards = foundationRewards
        result.superChargeRewards = superChargeRewards
        result.regularRewards = regularRewards
        result.delegators = delegators
        result.payoutTable = payoutTable
        result.poolFee = totalReward * fee + allX2BlockRewards * feeSuperCharge

        result.ok = true

        return result
    } catch (e) {
        return {
            "error": {
                "message": `Can't calculate rewards because ${e.message || e.name}`
            }
        }
    }
}

module.exports = {
    calc
}