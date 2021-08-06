const print = (...args) => {
    console.log(...args)
}

const error = (...args) => {
    console.error(...args)
}

module.exports = {
    print,
    error
}