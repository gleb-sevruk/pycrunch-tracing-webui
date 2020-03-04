Array.prototype.filterInPlace = function (condition, thisArg) {
  let j = 0

  this.forEach((el, index) => {
    if (condition.call(thisArg, el, index, this)) {
      if (index !== j) {
        this[j] = el
      }
      j++
    }
  })

  this.length = j
  return this
}