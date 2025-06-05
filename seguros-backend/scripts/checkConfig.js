require('dotenv').config();

console.log('Verificando configuración del servidor:');
console.log('----------------------------------------');
console.log('PORT:', process.env.PORT);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('JWT_SECRET está configurado:', !!process.env.JWT_SECRET);
console.log('----------------------------------------'); 