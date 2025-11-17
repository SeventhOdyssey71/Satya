// Emergency toLowerCase debugging trap
// This will intercept ALL toLowerCase calls and show where they're happening

console.log('🚨 DEPLOYING TOLOWERCASE DEBUG TRAP...');

// Override the String prototype toLowerCase method globally
const originalToLowerCase = String.prototype.toLowerCase;

String.prototype.toLowerCase = function() {
  // Check if this is being called on undefined/null
  if (this == null) {
    const error = new Error('toLowerCase called on null/undefined!');
    console.error('🚨🚨🚨 TOLOWERCASE ERROR TRAPPED!', {
      value: this,
      type: typeof this,
      stack: error.stack
    });
    throw new TypeError('value.toLowerCase is not a function');
  }
  
  // Check if this is not a string
  if (typeof this !== 'string') {
    const error = new Error('toLowerCase called on non-string!');
    console.error('🚨🚨🚨 TOLOWERCASE ERROR TRAPPED!', {
      value: this,
      type: typeof this,
      constructor: this.constructor?.name,
      stack: error.stack
    });
    throw new TypeError('value.toLowerCase is not a function');
  }
  
  // Log all toLowerCase calls during upload
  if (window.debugToLowerCase) {
    console.log('✅ toLowerCase called safely on:', this, {
      stack: new Error().stack?.split('\n')[1]?.trim()
    });
  }
  
  // Call original method
  return originalToLowerCase.call(this);
};

// Function to enable/disable debugging
window.enableToLowerCaseDebug = function() {
  window.debugToLowerCase = true;
  console.log('🔍 toLowerCase debugging enabled - all calls will be logged');
};

window.disableToLowerCaseDebug = function() {
  window.debugToLowerCase = false;
  console.log('🔇 toLowerCase debugging disabled');
};

console.log('🎯 toLowerCase trap deployed! Call window.enableToLowerCaseDebug() to track all calls');
console.log('🔧 Now try your upload - any toLowerCase error will show exact location!');