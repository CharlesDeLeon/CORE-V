const bcrypt = require('bcryptjs');

const password = 'Password123!';

bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Hash for "Password123!":', hash);
  }
});
