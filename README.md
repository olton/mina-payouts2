# Mina Payout Script
**Mina Payout Script** is a tool to calculate payouts to the delegators. Script written in a JavaScript (NodeJS 14+).
The script base on the [mina-payout](https://github.com/c29r3/mina-payout) by [Sergey (aka whataday2day)](https://github.com/c29r3).

### Key features
- [x] Three types of commission (for regular, foundation and supercharge).
- [x] Calculate for required address and epoch
- [x] Create result as detailed object

### Installation

Clone repository and install dependencies:
```shell
git clone https://github.com/olton/mina-payouts2.git
cd mina-payouts2
npm install
```

### Run script
You can use command line argument to specify calculating:

**Match keys to arguments:**
* `-a` address (**required**)
* `-e` epoch (default `0`)
* `-f` fee (default `0.05`)
* `-s` fee for supercharge rewards (default `0.05`)
* `-n` fee for foundation delegations (default `0.05`)
* `-k` blocks to confirmations  (default `15`)
* `-m` min block height (default `0`)
* `-x` max block height (default `0`)
* `-c` coinbase (default `720`)
* `-i` include address to unlocked (default `false`)
* `-v` specify decimal size for result information `val.toFixed(v)` (default `4`)

> To calc we get max height === (max_block_height - confirmations)  

To run script execute command:
```shell
node src/index -a B62q... -e 9
```

### Result example
```json
> node src\index.js a B62qrAWZFqvgJbfU95t1owLAMKtsDTAGgSZzsBJYUzeQZ7dQNMmG5vw -e 1
        
We calculate payouts for address: B62qrAWZFqvgJbfU95t1owLAMKtsDTAGgSZzsBJYUzeQZ7dQNMmG5vw
In the epoch 1 with fee 5.00%

Using ledger hash jx7buQVWFLsXTtzRgSxbYcT8EYLS8KCZbLrfDcJxMtyy4thw2Ee
The pool total staking balance is: 66000
The foundation delegation balance is: 0
The unlocked balance is: 0
There are 1 delegates in the pool
We are using blocks from 0 to 48630

We won these 1:
┌────┬──────────────┬────────┬───────┬──────────┬──────┬───────┬──────────────────────────────────────────────────────┐
│ ID │ Block height │ Reward │ Snark │  Tx Fees │ Slot │ Epoch │ Hash                                                 │
├────┼──────────────┼────────┼───────┼──────────┼──────┼───────┼──────────────────────────────────────────────────────┤
│  1 │         5184 │    720 │     0 │ 11000000 │ 7292 │     1 │ 3NLP7BhbvwCYfwfKZHz2bJBBbnrNEivym6fYrG1GZZwjhRhzYETd │
└────┴──────────────┴────────┴───────┴──────────┴──────┴───────┴──────────────────────────────────────────────────────┘

We are won 720.0110 mina (720011000000 nanomina) in this window.
Regular rewards is 720.011 mina
Super charge rewards is 0 mina
Transactions fee is 0.011 mina
Pool fee is 36.0005 mina
Paid out rewards to delegators is 684.0104 mina
Snark fee is 0 mina

Paid out rewards by type:
┌──────────────┬──────────┐
│         Type │   Reward │
├──────────────┼──────────┤
│   Foundation │   0.0000 │
│      Regular │ 684.0104 │
│ Super Charge │   0.0000 │
└──────────────┴──────────┘

Payout table:
┌────┬─────────────────────────────────────────────────────────┬─────────────────┬────────┬─────────────┬───────┬────────┐
│ ID │                                                 Address │         Balance │      % │ Payout Mina │ Found │ Locked │
├────┼─────────────────────────────────────────────────────────┼─────────────────┼────────┼─────────────┼───────┼────────┤
│  1 │ B62qrAWZFqvgJbfU95t1owLAMKtsDTAGgSZzsBJYUzeQZ7dQNMmG5vw │ 66000.000000000 │ 100.00 │   684.01045 │    no │    yes │
└────┴─────────────────────────────────────────────────────────┴─────────────────┴────────┴─────────────┴───────┴────────┘

CSV data:

"id","address","balance","percent","mina","found","locked"
1,"B62qrAWZFqvgJbfU95t1owLAMKtsDTAGgSZzsBJYUzeQZ7dQNMmG5vw","66000.000000000","100.00",684.01045,"no","yes"
```

## Disclaimer
The script is provided as is. The author does not bear any responsibility for your mistakes and carelessness.

## Thanks
- [x] [Gareth Davies](https://github.com/garethtdavies/mina-payout-script)
- [x] [Sergey (aka whataday2day)](https://github.com/c29r3/mina-payout)