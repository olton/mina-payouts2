const isset = (v) => {
    try {
        return typeof v !== 'undefined'
    } catch (e) {
        return false
    }
}

module.exports = {
    isset
}