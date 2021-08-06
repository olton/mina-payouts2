const fetch = require('node-fetch')

const fetchGraphQL = async (query, variables = {}) => {
    try {
        const result = await fetch(
            `https://graphql.minaexplorer.com`,
            {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query,
                    variables
                })
            }
        )

        return result.ok ? await result.json() : null
    } catch (error) {
        console.error("The Request to Explorer war aborted! Reason: " + error.name)
        return null
    }
}

const getLagerHash = async (variables) => {
    const query = `
        query ($epoch: Int) {
          blocks(query: {canonical: true, protocolState: {consensusState: {epoch: $epoch}}}, limit: 1) {
            protocolState {
              consensusState {
                stakingEpochData {
                  ledger {
                    hash
                  }
                }
                epoch
              }
            }
          }
        }
    `;

    return await fetchGraphQL(query, variables)
}

const getStakingLager = async (variables) => {
    const query = `
        query($delegate: String!, $ledgerHash: String!){
          stakes(query: {delegate: $delegate, ledgerHash: $ledgerHash}, limit: 1000) {
            public_key
            balance
            chainId
            timing {
              cliff_amount
              cliff_time
              initial_minimum_balance
              timed_epoch_end
              timed_in_epoch
              timed_weighting
              untimed_slot
              vesting_increment
              vesting_period
            }
          }
        }    
    `;

    return await fetchGraphQL(query, variables)
}

const getLatestHeight = async (variables) => {
    const query = `
        query{
          blocks(query: {canonical: true}, sortBy: DATETIME_DESC, limit: 1) {
            blockHeight
          }
        }    
    `;

    return await fetchGraphQL(query, variables)
}

const getBlocks = async (variables) => {
    const query = `
        query($creator: String!, $epoch: Int, $blockHeightMin: Int, $blockHeightMax: Int, $dateTimeMin: DateTime, $dateTimeMax: DateTime){
          blocks(query: {creator: $creator, protocolState: {consensusState: {epoch: $epoch}}, canonical: true, blockHeight_gte: $blockHeightMin, blockHeight_lte: $blockHeightMax, dateTime_gte:$dateTimeMin, dateTime_lte:$dateTimeMax}, sortBy: DATETIME_DESC, limit: 1000) {
            blockHeight
            canonical
            creator
            dateTime
            txFees
            snarkFees
            receivedTime
            stateHash
            stateHashField
            protocolState {
              consensusState {
                blockHeight
                epoch
                slotSinceGenesis
              }
            }
            transactions {
              coinbase
              coinbaseReceiverAccount {
                publicKey
              }
              feeTransfer {
                fee
                recipient
                type
              }
            }
          }
        }
    `;

    return await fetchGraphQL(query, variables)
}

module.exports = {
    fetchGraphQL,
    getLagerHash,
    getStakingLager,
    getLatestHeight,
    getBlocks
}