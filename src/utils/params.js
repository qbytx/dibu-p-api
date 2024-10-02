const isDefined = (values) => {
  for (let index = 0; index < values.length; index++) {
    const value = values[index];
    if (value === null || value === undefined) {
      console.log(`Undefined value found at index: ${index}`);
      return false;
    }
  }
  return true;
};

module.exports = {
  isDefined
};
