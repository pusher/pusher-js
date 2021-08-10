let interval = 50;

/**
 * waitsFor backports the jasmine@1.x.x waitsFor feature to keep old tests working
 *
 * @deprecated You shouldn't use this for writing new tests
 *
 * @param {Function} condition
 * @param {string} reason
 * @param {number} timeout
 * @returns
 */
module.exports = async (condition, reason, timeout) => {
  if (typeof condition !== 'function') {
    throw new Error('Condition is not a function');
  }

  if (typeof reason !== 'string') {
    throw new Error('Reason is not a string');
  }

  if (typeof timeout !== 'number') {
    throw new Error('Timeout is not a number');
  }

  while (timeout >= 0) {
    if (condition()) {
      return;
    }

    await new Promise(r => setTimeout(r, interval));

    timeout -= interval;
  }

  throw new Error(`waitsFor on "${reason}" timed out`);
};
