/**
 * VitalHub Supreme - Browser Env Loader
 * =====================================
 * Este script emula el comportamiento de 'dotenv' pero para el navegador.
 * Lee el archivo .env mediante fetch y lo expone en window.env.
 */

window.env = {};

async function loadEnv() {
    console.log('🌐 Cargando configuración desde .env...');
    try {
        const response = await fetch('.env');
        if (!response.ok) {
            console.warn('⚠️ No se encontró el archivo .env o el servidor no permite leerlo.');
            return;
        }
        
        const text = await response.text();
        const lines = text.split('\n');
        
        lines.forEach(line => {
            // Limpiar espacios y comentarios
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine.startsWith('#')) return;
            
            // Separar KEY=VAL
            const firstEqualIndex = trimmedLine.indexOf('=');
            if (firstEqualIndex === -1) return;
            
            const key = trimmedLine.substring(0, firstEqualIndex).trim();
            const value = trimmedLine.substring(firstEqualIndex + 1).trim();
            
            // Guardar en el objeto global (eliminando posibles comillas)
            window.env[key] = value.replace(/^["']|["']$/g, '');
        });
        
        console.log('✅ Configuración cargada con éxito.');
    } catch (error) {
        console.error('❌ Error al cargar el entorno:', error);
    }
}

// Iniciar carga inmediata
const envPromise = loadEnv();
