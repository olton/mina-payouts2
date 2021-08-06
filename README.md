# Mina Payout Script
**Mina Payout Script** is a tool to calculate payouts to the delegators. Script written in a JavaScript (NodeJS 14+).

### Key features
- [x] Three types of commission.
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
* `-s` fee for super charge rewards (default `0.05`)
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

## Disclaimer
The script is provided as is. The author does not bear any responsibility for your mistakes and carelessness.

## Thanks
- [x] [Gareth Davies](https://github.com/garethtdavies/mina-payout-script)
- [x] [Sergey (aka whataday2day)](https://github.com/c29r3/mina-payout)