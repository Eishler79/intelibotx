// TEST DE FETCH - EJECUTAR EN CONSOLA DEL NAVEGADOR
// Este test verifica qué está pasando con el fetch y el Network tab

console.log('=== TEST FETCH NETWORK TAB ===');

// Test 1: Verificar estado actual del fetch
console.log('1. ESTADO ACTUAL:');
console.log('   - window.fetch.name:', window.fetch.name);
console.log('   - window.fetch es nativo?', window.fetch.name === 'fetch');
console.log('   - window.__NATIVE_FETCH__ existe?', !!window.__NATIVE_FETCH__);
if (window.__NATIVE_FETCH__) {
    console.log('   - __NATIVE_FETCH__.name:', window.__NATIVE_FETCH__.name);
}

// Test 2: Llamada con fetch actual (interceptado)
console.log('\n2. TEST CON FETCH ACTUAL (posiblemente interceptado):');
console.log('   Ejecutando: fetch("/api/market-data/BTCUSDT?simple=true")');
console.log('   REVISA EL NETWORK TAB - ¿Aparece la llamada?');

fetch('http://localhost:8000/api/market-data/BTCUSDT?simple=true')
    .then(r => {
        console.log('   ✓ Respuesta recibida:', r.status);
        console.log('   PREGUNTA: ¿Apareció en Network tab? (Sí/No)');
    })
    .catch(e => console.error('   ✗ Error:', e.message));

// Test 3: Llamada con fetch nativo (si está disponible)
setTimeout(() => {
    if (window.__NATIVE_FETCH__) {
        console.log('\n3. TEST CON __NATIVE_FETCH__ (nativo guardado):');
        console.log('   Ejecutando: __NATIVE_FETCH__("/api/market-data/ETHUSDT?simple=true")');
        console.log('   REVISA EL NETWORK TAB - ¿Aparece la llamada?');

        window.__NATIVE_FETCH__('http://localhost:8000/api/market-data/ETHUSDT?simple=true')
            .then(r => {
                console.log('   ✓ Respuesta recibida:', r.status);
                console.log('   PREGUNTA: ¿Apareció en Network tab? (Sí/No)');
            })
            .catch(e => console.error('   ✗ Error:', e.message));
    } else {
        console.log('\n3. NO HAY __NATIVE_FETCH__ disponible');
    }
}, 1000);

// Test 4: Verificar qué está interceptando
setTimeout(() => {
    console.log('\n4. ANÁLISIS DEL INTERCEPTOR:');
    console.log('   - Código del fetch actual (primeras 200 chars):');
    console.log('   ', window.fetch.toString().substring(0, 200));

    // Intentar encontrar el fetch nativo
    console.log('\n5. BÚSQUEDA DE FETCH NATIVO:');
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    const nativeFetch = iframe.contentWindow.fetch;
    console.log('   - Fetch desde iframe:', nativeFetch.name);
    console.log('   - Es nativo?', nativeFetch.name === 'fetch');

    if (nativeFetch.name === 'fetch') {
        console.log('\n6. TEST CON FETCH NATIVO DE IFRAME:');
        console.log('   Ejecutando con fetch nativo real...');
        console.log('   REVISA EL NETWORK TAB - ¿Aparece la llamada?');

        nativeFetch('http://localhost:8000/api/market-data/ADAUSDT?simple=true')
            .then(r => {
                console.log('   ✓ Respuesta recibida:', r.status);
                console.log('   PREGUNTA CRÍTICA: ¿Apareció en Network tab? (Sí/No)');
                console.log('\n   SI APARECIÓ: El problema es el interceptor');
                console.log('   SI NO APARECIÓ: El problema es otra cosa (CORS, DevTools, etc.)');
            })
            .catch(e => console.error('   ✗ Error:', e.message));
    }

    document.body.removeChild(iframe);
}, 2000);

console.log('\n=== FIN DEL TEST - REVISA NETWORK TAB Y RESPONDE LAS PREGUNTAS ===');