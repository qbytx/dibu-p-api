const isDefined = (values) => {
  if (!Array.isArray(values)) {
    throw new TypeError(`Expected an array of values, instead recieved ${typeof values}`);
  }

  return values.every((value, index) => {
    if (value === null || value === undefined) {
      console.log(`Undefined value found at index: ${index}`);
      return false;
    }
    return true;
  });
};

module.exports = {
  isDefined
};
