const pool = require('../database');

const tables = [
  'ticket_panels',
  'ticket_buttons',
  'ticket_roles',
  'ticket_bans',
  'ticket_logs',
  'ticket_active',
  'ticket_closed',
  'ticket_abuse'
];

(async function(){
  try {
    console.log('Checking ticket tables...');
    for (const t of tables) {
      const res = await pool.query("SELECT to_regclass($1) AS exists", [t]);
      const exists = res.rows[0] && res.rows[0].exists;
      console.log(`${t}: ${exists ? 'FOUND' : 'MISSING'}`);
    }
    process.exit(0);
  } catch (e) {
    console.error('Error checking tables', e);
    process.exit(2);
  }
})();
