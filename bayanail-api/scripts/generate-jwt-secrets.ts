import crypto from 'crypto';

console.log('🔐 Génération de secrets JWT pour la production\n');
console.log('─'.repeat(80));
console.log('');

// Générer JWT_SECRET
const jwtSecret = crypto.randomBytes(32).toString('hex');
console.log('JWT_SECRET=' + jwtSecret);
console.log('');

// Générer JWT_REFRESH_SECRET
const jwtRefreshSecret = crypto.randomBytes(32).toString('hex');
console.log('JWT_REFRESH_SECRET=' + jwtRefreshSecret);
console.log('');

console.log('─'.repeat(80));
console.log('');
console.log('✅ Secrets générés avec succès !');
console.log('');
console.log('💡 Copiez ces valeurs dans votre fichier .env de production :');
console.log('   1. Sur le VPS, éditez le fichier .env');
console.log('   2. Remplacez JWT_SECRET et JWT_REFRESH_SECRET par les valeurs ci-dessus');
console.log('   3. Redémarrez le serveur');
console.log('');

