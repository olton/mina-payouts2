const {error, print} = require("./print")

const exit = (message, code = 0) => {
    code ? error(message) : print(message)
    process.exit(code)
}

module.exports = {
    exit
}
